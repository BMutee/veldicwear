import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3] || "12345678";

  if (!email) {
    console.error("Usage: npx tsx scripts/better-reset-password.ts <email> [password]");
    process.exit(1);
  }

  // Use Better Auth's own password hashing (which uses Node.js scrypt)
  const { hashPassword } = await import("@better-auth/utils/password");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User "${email}" not found.`);
    process.exit(1);
  }

  console.log("Hashing with Better Auth's internal password hasher...");
  const hashedPassword = await hashPassword(newPassword);
  console.log("Generated hash:", hashedPassword);
  console.log("Hash starts with:", hashedPassword.substring(0, 20));

  // Update the Account record
  await prisma.$executeRawUnsafe(
    `UPDATE "Account" SET password = $1, type = 'email' WHERE "userId" = $2 AND "providerId" = 'credential'`,
    hashedPassword,
    user.id
  );

  // Verify it was stored
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT password FROM "Account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    user.id
  );
  console.log("Stored in DB:", rows[0]?.password?.substring(0, 30) + "...");

  // Ensure 2FA is disabled
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "twoFactorEnabled" = false, "totpKey" = NULL, "backupCodes" = NULL WHERE id = $1`,
    user.id
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM "TwoFactorSession" WHERE "userId" = $1`,
    user.id
  );
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Session" WHERE "userId" = $1`,
    user.id
  );

  console.log(`\n✅ Password reset for "${email}"`);
  console.log(`   New password: ${newPassword}`);
  console.log(`   2FA disabled, sessions cleared`);

  await prisma.$disconnect();
}

main().catch(console.error);