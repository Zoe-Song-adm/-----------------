import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@sanmin.edu.pe";
  const password = process.env.ADMIN_PASSWORD || "Admin@2025!";
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        name: "系统管理员",
        role: "ADMIN",
        cohortYear: new Date().getFullYear(),
      },
    });
    console.log(`管理员已创建: ${email}`);
  } else {
    console.log(`管理员已存在: ${email}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
