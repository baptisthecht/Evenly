import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding plans...");

  await db.plan.upsert({
    where: { id: "free" },
    create: {
      id: "free",
      name: "Free",
      commissionRate: 0.05,
      monthlyFreeQuota: 30,
      monthlyPriceCents: 0,
      yearlyPriceCents: 0,
    },
    update: {
      commissionRate: 0.05,
      monthlyFreeQuota: 30,
    },
  });

  await db.plan.upsert({
    where: { id: "pro" },
    create: {
      id: "pro",
      name: "Pro",
      commissionRate: 0.025,
      monthlyFreeQuota: 150,
      monthlyPriceCents: 2900,
      yearlyPriceCents: 24900,
    },
    update: {
      commissionRate: 0.025,
      monthlyFreeQuota: 150,
    },
  });

  console.log("✅ Plans seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
