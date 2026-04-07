import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { guestSchema } from "@/lib/validations";
import { z } from "zod";
import { nanoid } from "nanoid";

/** Create invitation links for any OPEN rounds that don't yet have a link for this group */
async function createLinksForOpenRounds(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { eventId: true },
  });
  if (!group) return;

  const openRounds = await prisma.round.findMany({
    where: {
      eventId: group.eventId,
      status: "OPEN",
      links: { none: { groupId } },
    },
    select: { id: true, closesAt: true },
  });

  if (openRounds.length === 0) return;

  await prisma.invitationLink.createMany({
    data: openRounds.map((round) => ({
      roundId: round.id,
      groupId,
      token: nanoid(12),
      expiresAt: round.closesAt,
    })),
    skipDuplicates: true,
  });
}

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
      // Auto-create links for OPEN rounds if this group doesn't have them yet
      if (guests.length > 0) {
        await createLinksForOpenRounds(guests[0].groupId);
      }
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
    // Auto-create links for OPEN rounds
    await createLinksForOpenRounds(guest.groupId);
    return NextResponse.json(guest, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear el invitado" },
      { status: 500 }
    );
  }
}
