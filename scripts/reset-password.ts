import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  // Hash the password using bcryptjs with 10 rounds (better-auth default)
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log("New bcrypt hash:", hashedPassword);

  // Update the account password directly via raw query
  // to bypass Prisma type issues with the Account model
  await prisma.$executeRawUnsafe(
    `UPDATE "Account" SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
    hashedPassword,
    user.id
  );

  const updated = await prisma.$queryRawUnsafe(
    `SELECT password FROM "Account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    user.id
  );
  console.log("Updated password in DB:", JSON.stringify(updated));

  // Ensure 2FA is disabled
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "twoFactorEnabled" = false, "totpKey" = NULL, "backupCodes" = NULL WHERE id = $1`,
    user.id
  );
  
  // Clean up any 2FA sessions
  await prisma.$executeRawUnsafe(
    `DELETE FROM "TwoFactorSession" WHERE "userId" = $1`,
    user.id
  );

  console.log(`\n✅ Password has been RESET for "${email}"`);
  console.log(`   New password: ${newPassword}`);
  console.log(`   Hash type: bcrypt (${hashedPassword.substring(0, 20)}...)`);
  console.log(`   2FA: disabled`);
  console.log(`\nTry logging in now at http://localhost:3000/login`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});