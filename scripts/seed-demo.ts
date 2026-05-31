/**
 * Seeds a demo member so the app can be tried immediately.
 *   email:    demo@hsk.local
 *   password: Demo1234
 * The demo account is granted level 3 access (unlocks HSK levels 1-3).
 *
 * Run with:  npm run db:seed
 */
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hashPassword(plaintext: string): Promise<string> {
  const sha = createHash("sha512").update(plaintext, "utf8").digest("hex");
  return bcrypt.hash(sha, 10);
}

async function main() {
  const email = "demo@hsk.local";
  const password = await hashPassword("Demo1234");

  const member = await prisma.member.upsert({
    where: { email },
    update: { password },
    create: { username: "demo", email, password },
  });

  await prisma.userAccount.upsert({
    where: { userId: member.id },
    update: { memberLevel: 3 },
    create: { userId: member.id, memberLevel: 3 },
  });

  console.log(`Seeded demo user → ${email} / Demo1234 (level 3 access)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
