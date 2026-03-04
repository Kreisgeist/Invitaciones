import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invitationResponseSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.invitationLink.findUnique({
      where: { token },
      include: {
        round: true,
        group: { include: { guests: true } },
        response: true,
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "Enlace no encontrado" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = now > new Date(link.expiresAt);
    const isRoundClosed = link.round.status === "CLOSED";
    const isRoundNotOpen = link.round.status !== "OPEN";

    if (isExpired || isRoundClosed) {
      return NextResponse.json(
        { error: "El periodo de confirmación ha finalizado." },
        { status: 410 }
      );
    }

    if (isRoundNotOpen) {
      return NextResponse.json(
        { error: "La ronda de invitaciones aún no está abierta." },
        { status: 403 }
      );
    }

    // If already responded, this is an edit — allowed during open period
    const isEdit = !!link.response;

    const body = await request.json();
    const parsed = invitationResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate additional guests don't exceed max
    const totalGuests = link.group.guests.length + data.additionalGuests.length;
    if (totalGuests > 10) {
      return NextResponse.json(
        {
          error: `El total de invitados no puede exceder 10. Actualmente hay ${link.group.guests.length} invitados en tu grupo.`,
        },
        { status: 400 }
      );
    }

    if (isEdit && link.response) {
      // Update existing response
      await prisma.$transaction(async (tx) => {
        // Delete existing guest responses and additional requests
        await tx.guestResponse.deleteMany({
          where: { responseId: link.response!.id },
        });
        await tx.additionalGuestRequest.deleteMany({
          where: { responseId: link.response!.id },
        });

        // Update response
        await tx.response.update({
          where: { id: link.response!.id },
          data: {
            status: data.status,
            guestResponses: {
              create: data.guestResponses.map((gr) => ({
                guestId: gr.guestId,
                attending: gr.attending,
                updatedName: gr.updatedName || null,
                menuChoice: gr.menuChoice,
                dietaryNotes: gr.dietaryNotes || null,
              })),
            },
            additionalGuestRequests: {
              create: data.additionalGuests.map((ag) => ({
                fullName: ag.fullName,
                category: ag.category,
                menuChoice: ag.menuChoice,
              })),
            },
          },
        });
      });
    } else {
      // Create new response
      await prisma.$transaction(async (tx) => {
        await tx.response.create({
          data: {
            invitationLinkId: link.id,
            status: data.status,
            guestResponses: {
              create: data.guestResponses.map((gr) => ({
                guestId: gr.guestId,
                attending: gr.attending,
                updatedName: gr.updatedName || null,
                menuChoice: gr.menuChoice,
                dietaryNotes: gr.dietaryNotes || null,
              })),
            },
            additionalGuestRequests: {
              create: data.additionalGuests.map((ag) => ({
                fullName: ag.fullName,
                category: ag.category,
                menuChoice: ag.menuChoice,
              })),
            },
          },
        });

        // Mark link as used
        await tx.invitationLink.update({
          where: { id: link.id },
          data: { used: true, usedAt: new Date() },
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing response:", error);
    return NextResponse.json(
      { error: "Error al procesar la respuesta" },
      { status: 500 }
    );
  }
}
