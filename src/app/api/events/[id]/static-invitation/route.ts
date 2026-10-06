import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    const invitation = await prisma.staticInvitation.upsert({
      where: { eventId: id },
      update: {},
      create: {
        eventId: id,
        token: nanoid(16),
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error creating static invitation:", error);
    return NextResponse.json(
      { error: "Error al generar la invitación estática" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { error: "El estado de la invitación es inválido" },
        { status: 400 }
      );
    }

    const result = await prisma.staticInvitation.updateMany({
      where: { eventId: id },
      data: { enabled: body.enabled },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "La invitación estática no existe" },
        { status: 404 }
      );
    }

    const invitation = await prisma.staticInvitation.findUniqueOrThrow({
      where: { eventId: id },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error updating static invitation:", error);
    return NextResponse.json(
      { error: "Error al actualizar la invitación estática" },
      { status: 500 }
    );
  }
}
