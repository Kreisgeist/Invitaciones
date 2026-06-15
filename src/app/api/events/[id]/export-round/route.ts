import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const { searchParams } = new URL(_request.url);
  const roundId = searchParams.get("roundId");

  if (!roundId) {
    return NextResponse.json(
      { error: "roundId es requerido" },
      { status: 400 }
    );
  }

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      event: { select: { name: true } },
      links: {
        include: {
          group: { include: { guests: true } },
          response: {
            include: {
              guestResponses: { include: { guest: true } },
              additionalGuestRequests: true,
            },
          },
        },
      },
    },
  });

  if (!round) {
    return NextResponse.json(
      { error: "Ronda no encontrada" },
      { status: 404 }
    );
  }

  const acceptedLinks = round.links.filter(
    (l) => l.response?.status === "ACCEPTED"
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Reporte");

  // Column widths
  worksheet.columns = [
    { header: "Grupo", key: "group", width: 25 },
    { header: "Invitado", key: "guest", width: 30 },
    { header: "Categoría", key: "category", width: 12 },
    { header: "Asiste", key: "attending", width: 12 },
    { header: "Menú", key: "menu", width: 14 },
    { header: "Notas dietéticas", key: "dietaryNotes", width: 30 },
    { header: "Boleto adicional", key: "additional", width: 20 },
  ];

  // Title row
  worksheet.mergeCells("A1:G1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = `${round.event.name} - ${round.name}`;
  titleCell.font = { name: "Calibri", size: 16, bold: true };
  titleCell.alignment = { horizontal: "center" };
  worksheet.getRow(1).height = 30;

  // Blank row
  worksheet.addRow([]);

  // Header row
  const headerRow = worksheet.addRow([
    "Grupo",
    "Invitado",
    "Categoría",
    "Asiste",
    "Menú",
    "Notas dietéticas",
    "Boleto adicional",
  ]);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8B5E3C" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  let currentRow = 4;
  let totalAdults = 0;
  let totalChildren = 0;
  let totalAdditionalApproved = 0;
  let totalAdditionalPending = 0;

  for (const link of acceptedLinks) {
    const groupStartRow = currentRow;
    let groupAdults = 0;
    let groupChildren = 0;
    const groupGuests = link.response!.guestResponses.filter(
      (gr) => gr.attending
    );

    if (groupGuests.length === 0) {
      // Group accepted but no guests attending (shouldn't happen, but handle it)
      const row = worksheet.addRow([
        link.group.name,
        "(sin asistentes)",
        "",
        "",
        "",
        "",
        "",
      ]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
      continue;
    }

    for (const gr of groupGuests) {
      const isAdult = gr.menuChoice === "ADULT";
      if (isAdult) groupAdults++;
      else groupChildren++;

      const additionalRequests = link.response!.additionalGuestRequests.filter(
        (ag) => ag.approved
      );
      const additionalStr =
        additionalRequests.length > 0
          ? additionalRequests
              .map(
                (ag) =>
                  `${ag.fullName} (${ag.category === "CHILD" ? "Menor" : "Adulto"})`
              )
              .join(", ")
          : "";

      const row = worksheet.addRow([
        link.group.name,
        gr.updatedName || gr.guest.name,
        gr.guest.category === "CHILD" ? "Menor" : "Adulto",
        gr.attending ? "Sí" : "No",
        gr.menuChoice === "CHILD" ? "Infantil" : "Adulto",
        gr.dietaryNotes || "",
        additionalStr,
      ]);
      row.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
    }

    // Additional tickets that are NOT approved
    const pendingAdditional = link.response!.additionalGuestRequests.filter(
      (ag) => !ag.approved
    );
    if (pendingAdditional.length > 0) {
      for (const ag of pendingAdditional) {
        const row = worksheet.addRow([
          link.group.name,
          ag.fullName,
          ag.category === "CHILD" ? "Menor" : "Adulto",
          "",
          ag.menuChoice === "CHILD" ? "Infantil" : "Adulto",
          "",
          `Solicitado (pendiente)`,
        ]);
        row.eachCell((cell) => {
          cell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF999999" } };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        currentRow++;
      }
    }

    const groupEndRow = currentRow - 1;

    // Merge group cells for this group's rows
    if (groupEndRow > groupStartRow) {
      worksheet.mergeCells(`A${groupStartRow}:A${groupEndRow}`);
      const groupCell = worksheet.getCell(`A${groupStartRow}`);
      groupCell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    }

    totalAdults += groupAdults;
    totalChildren += groupChildren;
  }

  totalAdditionalApproved = acceptedLinks.flatMap((l) =>
    l.response!.additionalGuestRequests.filter((ag) => ag.approved)
  ).length;
  totalAdditionalPending = acceptedLinks.flatMap((l) =>
    l.response!.additionalGuestRequests.filter((ag) => !ag.approved)
  ).length;

  // Summary section
  currentRow += 1;
  const summaryStart = currentRow;
  worksheet.addRow([]);

  const summaryHeader = worksheet.addRow([
    `Resumen - ${round.name}`,
  ]);
  worksheet.mergeCells(
    `A${currentRow + 1}:G${currentRow + 1}`
  );
  summaryHeader.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 12, bold: true };
  });

  currentRow += 2;
  worksheet.addRow([
    "Grupos confirmados",
    acceptedLinks.length,
  ]);
  currentRow++;
  worksheet.addRow([
    "Total adultos confirmados",
    totalAdults,
  ]);
  currentRow++;
  worksheet.addRow([
    "Total menores confirmados",
    totalChildren,
  ]);
  currentRow++;
  worksheet.addRow([
    "Total asistentes",
    totalAdults + totalChildren,
  ]);
  currentRow++;
  worksheet.addRow([
    "Boletos adicionales aprobados",
    totalAdditionalApproved,
  ]);
  currentRow++;
  worksheet.addRow([
    "Boletos adicionales pendientes",
    totalAdditionalPending,
  ]);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="reporte-${round.name.replace(/\s+/g, "-").toLowerCase()}.xlsx"`,
    },
  });
}
