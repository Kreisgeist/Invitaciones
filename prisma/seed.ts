import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a sample event
  const event = await prisma.event.create({
    data: {
      name: "Fiesta de Ejemplo",
      description:
        "¡Estás cordialmente invitado/a a nuestra celebración! Será una noche llena de alegría, buena comida y excelente compañía.",
      date: new Date("2026-06-15"),
      time: "18:00",
      location: "Salón de Eventos Las Palmas, Av. Principal #123",
      dressCode: "Formal / Cocktail",
      maxGuests: 100,
    },
  });

  console.log(`✅ Event created: ${event.name}`);

  // Create sample groups with guests
  const groups = [
    {
      name: "Familia García",
      notes: "Amigos cercanos de la universidad",
      guests: [
        { name: "Carlos García", category: "ADULT" as const, order: 0 },
        { name: "María López de García", category: "ADULT" as const, order: 1 },
        { name: "Hijo 1", category: "CHILD" as const, order: 2 },
        { name: "Hijo 2", category: "CHILD" as const, order: 3 },
      ],
    },
    {
      name: "Familia Rodríguez",
      notes: null,
      guests: [
        { name: "Pedro Rodríguez", category: "ADULT" as const, order: 0 },
        { name: "Ana Martínez de Rodríguez", category: "ADULT" as const, order: 1 },
      ],
    },
    {
      name: "Juan Hernández",
      notes: "Compañero de trabajo",
      guests: [
        { name: "Juan Hernández", category: "ADULT" as const, order: 0 },
      ],
    },
  ];

  for (const groupData of groups) {
    const group = await prisma.group.create({
      data: {
        eventId: event.id,
        name: groupData.name,
        notes: groupData.notes,
        guests: {
          create: groupData.guests,
        },
      },
      include: { guests: true },
    });
    console.log(
      `✅ Group "${group.name}" created with ${group.guests.length} guests`
    );
  }

  console.log("\n🎉 Seed complete!");
  console.log(
    `\nEvent ID: ${event.id}\nYou can now create rounds from the dashboard.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
