import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SEED_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const passwordHash = await Bun.password.hash("Admin123!", {
    algorithm: "bcrypt",
    cost: 12,
  });

  await prisma.user.upsert({
    where: { email: "admin@telkom.co.id" },
    update: {
      passwordHash,
      role: "admin",
    },
    create: {
      id: SEED_USER_ID,
      email: "admin@telkom.co.id",
      passwordHash,
      role: "admin",
    },
  });

  console.log("Seeded user: admin@telkom.co.id / Admin123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
