import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      groups: {
        include: {
          guests: true,
          links: {
            include: {
              response: {
                include: {
                  guestResponses: { include: { guest: true } },
                  additionalGuestRequests: true,
                },
              },
              round: true,
            },
          },
        },
      },
      rounds: {
        include: {
          links: {
            include: {
              response: {
                include: {
                  guestResponses: true,
                  additionalGuestRequests: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  // Compute stats
  const totalGroups = event.groups.length;
  const allGuests = event.groups.flatMap((g) => g.guests);
  const totalGuests = allGuests.length;
  const totalAdults = allGuests.filter((g) => g.category === "ADULT").length;
  const totalChildren = allGuests.filter((g) => g.category === "CHILD").length;

  // Get responses from all rounds
  const allResponses = event.rounds.flatMap((r) =>
    r.links.filter((l) => l.response).map((l) => l.response!)
  );

  // Latest responses per group (in case of multiple rounds)
  const latestByGroup = new Map<string, typeof allResponses[0]>();
  for (const round of event.rounds) {
    for (const link of round.links) {
      if (link.response) {
        const existing = latestByGroup.get(link.groupId);
        if (
          !existing ||
          new Date(link.response.respondedAt) >
            new Date(existing.respondedAt)
        ) {
          latestByGroup.set(link.groupId, link.response);
        }
      }
    }
  }

  const latestResponses = Array.from(latestByGroup.values());

  const confirmedResponses = latestResponses.filter(
    (r) => r.status === "ACCEPTED"
  );
  const declinedResponses = latestResponses.filter(
    (r) => r.status === "DECLINED"
  );

  const confirmedGuests = confirmedResponses.flatMap((r) =>
    r.guestResponses.filter((gr) => gr.attending)
  );

  const declinedGuests = confirmedResponses.flatMap((r) =>
    r.guestResponses.filter((gr) => !gr.attending)
  );

  // Add declined invitation group guests
  const declinedGroupGuests = declinedResponses.reduce(
    (sum, r) => sum + r.guestResponses.length,
    0
  );

  const pendingGroups =
    totalGroups - confirmedResponses.length - declinedResponses.length;

  const adultMenus = confirmedGuests.filter(
    (gr) => gr.menuChoice === "ADULT"
  ).length;
  const childMenus = confirmedGuests.filter(
    (gr) => gr.menuChoice === "CHILD"
  ).length;

  const additionalRequests = confirmedResponses.flatMap(
    (r) => r.additionalGuestRequests
  );
  const totalAdditionalRequested = additionalRequests.length;

  // Collect dietary notes / allergies from confirmed guests
  const dietaryNotes: { guestName: string; groupName: string; notes: string }[] = [];
  for (const group of event.groups) {
    for (const link of group.links) {
      if (link.response && link.response.guestResponses) {
        for (const gr of link.response.guestResponses) {
          if (gr.attending && gr.dietaryNotes && gr.dietaryNotes.trim()) {
            dietaryNotes.push({
              guestName: gr.guest?.name ?? "Invitado",
              groupName: group.name,
              notes: gr.dietaryNotes.trim(),
            });
          }
        }
      }
    }
  }

  // Pending guests = total guests - confirmed attending - declined attending - groups who declined entirely
  const pendingGuests =
    totalGuests -
    confirmedGuests.length -
    declinedGuests.length -
    declinedGroupGuests;

  return NextResponse.json({
    totalGroups,
    totalGuests,
    totalAdults,
    totalChildren,
    confirmedGroups: confirmedResponses.length,
    declinedGroups: declinedResponses.length,
    pendingGroups,
    confirmedGuests: confirmedGuests.length,
    declinedGuests: declinedGuests.length + declinedGroupGuests,
    pendingGuests: Math.max(0, pendingGuests),
    adultMenus,
    childMenus,
    additionalMenusAdult: additionalRequests.filter(
      (a) => a.menuChoice === "ADULT"
    ).length,
    additionalMenusChild: additionalRequests.filter(
      (a) => a.menuChoice === "CHILD"
    ).length,
    totalAdditionalRequested,
    maxGuests: event.maxGuests,
    dietaryNotes,
  });
}
