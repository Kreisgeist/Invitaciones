import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { eventSchema } from "@/lib/validations";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { groups: true, rounds: true },
      },
    },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        date: new Date(parsed.data.date),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el evento" },
      { status: 500 }
    );
  }
}
