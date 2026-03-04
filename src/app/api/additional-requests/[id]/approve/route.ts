import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Find the additional guest request with its related data
    const request = await prisma.additionalGuestRequest.findUnique({
      where: { id },
      include: {
        response: {
          include: {
            invitationLink: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (request.approved) {
      return NextResponse.json(
        { error: "Esta solicitud ya fue aprobada" },
        { status: 400 }
      );
    }

    const groupId = request.response.invitationLink.groupId;

    // Get current max order in the group
    const lastGuest = await prisma.guest.findFirst({
      where: { groupId },
      orderBy: { order: "desc" },
    });

    // Create the guest and mark the request as approved in a transaction
    const [guest] = await prisma.$transaction([
      prisma.guest.create({
        data: {
          groupId,
          name: request.fullName,
          category: request.category as "ADULT" | "CHILD",
          order: (lastGuest?.order ?? 0) + 1,
        },
      }),
      prisma.additionalGuestRequest.update({
        where: { id },
        data: { approved: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      guest,
      message: `${request.fullName} fue agregado(a) a ${request.response.invitationLink.group.name}`,
    });
  } catch (error) {
    console.error("Error approving additional request:", error);
    return NextResponse.json(
      { error: "Error al aprobar la solicitud" },
      { status: 500 }
    );
  }
}
