import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { guestSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Support single or batch creation
    const batchSchema = z.array(guestSchema);
    const batchParsed = batchSchema.safeParse(body);

    if (batchParsed.success) {
      const guests = await prisma.$transaction(
        batchParsed.data.map((g, i) =>
          prisma.guest.create({
            data: { ...g, order: g.order || i },
          })
        )
      );
      return NextResponse.json(guests, { status: 201 });
    }

    // Try single guest
    const parsed = guestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.create({ data: parsed.data });
    return NextResponse.json(guest, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el invitado" },
      { status: 500 }
    );
  }
}
