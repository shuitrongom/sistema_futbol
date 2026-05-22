import "dotenv/config";
import { hash } from "bcryptjs";
import { createPrismaClient, cleanup } from "./lib/create-client";
import { seedExercises } from "./seeds/exercises";
import { seedEliteExercises } from "./seeds/exercises-elite";
import { seedRecommendations } from "./seeds/recommendations";

const prisma = createPrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@futbol.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const adminName = process.env.ADMIN_NAME || "Administrador";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: adminName,
        role: "admin",
        isActive: true,
      },
    });

    console.log(`Admin user created: ${admin.email} (${admin.id})`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // Seed exercises
  await seedExercises();

  // Seed elite exercises
  await seedEliteExercises();

  // Seed recommendations
  await seedRecommendations();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await cleanup(prisma);
  });
