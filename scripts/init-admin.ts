import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, validatePassword } from "../src/lib/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("请先在 .env 中配置 DATABASE_URL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const phone = process.env.INITIAL_ADMIN_PHONE?.trim();
  const password = process.env.INITIAL_ADMIN_PASSWORD?.trim();

  if (!phone || !password) {
    throw new Error("请先在 .env 中配置 INITIAL_ADMIN_PHONE 和 INITIAL_ADMIN_PASSWORD");
  }

  if (!validatePassword(password)) {
    throw new Error("INITIAL_ADMIN_PASSWORD 至少需要 8 位");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { phone },
    create: {
      phone,
      name: "平台管理员",
      passwordHash,
      role: "SuperAdmin",
      status: "Active",
      subscription: {
        create: {
          status: "Active",
          startsAt: new Date(),
          expiresAt: new Date("2099-12-31T23:59:59.000Z"),
          note: "系统初始化管理员",
        },
      },
    },
    update: {
      passwordHash,
      role: "SuperAdmin",
      status: "Active",
      subscription: {
        upsert: {
          create: {
            status: "Active",
            startsAt: new Date(),
            expiresAt: new Date("2099-12-31T23:59:59.000Z"),
            note: "系统初始化管理员",
          },
          update: {
            status: "Active",
            expiresAt: new Date("2099-12-31T23:59:59.000Z"),
          },
        },
      },
    },
  });

  console.log(`管理员已就绪：${phone}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
