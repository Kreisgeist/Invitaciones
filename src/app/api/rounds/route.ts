import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { roundSchema } from "@/lib/validations";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId es requerido" },
      { status: 400 }
    );
  }

  const rounds = await prisma.round.findMany({
    where: { eventId },
    include: {
      links: {
        include: {
          group: true,
          response: {
            include: {
              guestResponses: { include: { guest: true } },
              additionalGuestRequests: true,
            },
          },
        },
      },
      _count: { select: { links: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rounds);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = roundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get all groups for this event
    const groups = await prisma.group.findMany({
      where: { eventId: parsed.data.eventId },
      include: { guests: true },
    });

    if (groups.length === 0) {
      return NextResponse.json(
        { error: "No hay grupos definidos para este evento. Agrega grupos e invitados primero." },
        { status: 400 }
      );
    }

    // Filter groups that have at least one guest
    const groupsWithGuests = groups.filter((g) => g.guests.length > 0);

    if (groupsWithGuests.length === 0) {
      return NextResponse.json(
        { error: "Los grupos no tienen invitados asignados. Agrega invitados a los grupos primero." },
        { status: 400 }
      );
    }

    const closesAt = new Date(parsed.data.closesAt);
    const opensAt = new Date(parsed.data.opensAt);

    // Create round with invitation links for each group
    const round = await prisma.round.create({
      data: {
        name: parsed.data.name,
        eventId: parsed.data.eventId,
        opensAt,
        closesAt,
        status: "DRAFT",
        allowAdditionalTickets: parsed.data.allowAdditionalTickets ?? false,
        links: {
          create: groupsWithGuests.map((group) => ({
            groupId: group.id,
            token: nanoid(12),
            expiresAt: closesAt,
          })),
        },
      },
      include: {
        links: {
          include: { group: true },
        },
      },
    });

    return NextResponse.json(round, { status: 201 });
  } catch (error) {
    console.error("Error creating round:", error);
    return NextResponse.json(
      { error: "Error al crear la ronda" },
      { status: 500 }
    );
  }
}
