import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invitation = await prisma.staticInvitation.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitación no encontrada", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  if (!invitation.enabled) {
    return NextResponse.json(
      {
        error: "Esta invitación no está disponible actualmente.",
        code: "DISABLED",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    event: {
      name: invitation.event.name,
      description: invitation.event.description,
      date: invitation.event.date,
      time: invitation.event.time,
      location: invitation.event.location,
      mapUrl: invitation.event.mapUrl,
      ceremonyTime: invitation.event.ceremonyTime,
      ceremonyLocation: invitation.event.ceremonyLocation,
      ceremonyMapUrl: invitation.event.ceremonyMapUrl,
      dressCode: invitation.event.dressCode,
      primaryColor: invitation.event.primaryColor,
      secondaryColor: invitation.event.secondaryColor,
      bgImageUrl: invitation.event.bgImageUrl,
      invitationSections: invitation.event.invitationSections,
    },
  });
}
