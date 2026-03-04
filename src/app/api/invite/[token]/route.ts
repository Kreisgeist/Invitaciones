import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const link = await prisma.invitationLink.findUnique({
    where: { token },
    include: {
      round: {
        include: {
          event: true,
        },
      },
      group: {
        include: {
          guests: { orderBy: { order: "asc" } },
        },
      },
      response: {
        include: {
          guestResponses: { include: { guest: true } },
          additionalGuestRequests: true,
        },
      },
    },
  });

  if (!link) {
    return NextResponse.json(
      { error: "Enlace no encontrado", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const now = new Date();
  const isExpired = now > new Date(link.expiresAt);
  const isRoundClosed = link.round.status === "CLOSED";
  const isRoundNotOpen = link.round.status !== "OPEN";
  const hasResponse = !!link.response;

  // Determine the display name for the group
  const displayName =
    link.group.guests.length === 1
      ? link.group.guests[0].name
      : link.group.name;

  return NextResponse.json({
    token: link.token,
    displayName,
    event: {
      name: link.round.event.name,
      description: link.round.event.description,
      date: link.round.event.date,
      time: link.round.event.time,
      location: link.round.event.location,
      mapUrl: link.round.event.mapUrl,
      dressCode: link.round.event.dressCode,
      primaryColor: link.round.event.primaryColor,
      secondaryColor: link.round.event.secondaryColor,
      bgImageUrl: link.round.event.bgImageUrl,
    },
    guests: link.group.guests.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
    })),
    currentGroupSize: link.group.guests.length,
    maxGroupSize: 10,
    allowAdditionalTickets: link.round.allowAdditionalTickets,
    status: {
      isExpired,
      isRoundClosed,
      isRoundNotOpen,
      hasResponse,
      canEdit: hasResponse && !isExpired && !isRoundClosed,
    },
    existingResponse: link.response
      ? {
          status: link.response.status,
          respondedAt: link.response.respondedAt,
          guestResponses: link.response.guestResponses.map((gr) => ({
            guestId: gr.guestId,
            attending: gr.attending,
            updatedName: gr.updatedName,
            menuChoice: gr.menuChoice,
            dietaryNotes: gr.dietaryNotes,
            guestName: gr.guest.name,
            guestCategory: gr.guest.category,
          })),
          additionalGuestRequests:
            link.response.additionalGuestRequests.map((ag) => ({
              id: ag.id,
              fullName: ag.fullName,
              category: ag.category,
              menuChoice: ag.menuChoice,
            })),
        }
      : null,
  });
}
