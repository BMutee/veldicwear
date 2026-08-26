import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/verify-state.ts <email>");
    process.exit(1);
  }

  // Check user state
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT id, email, "twoFactorEnabled", "totpKey", role FROM "User" WHERE email = $1`,
    email
  );
  console.log("User:", JSON.stringify(rows, null, 2));

  // Check account password
  const accounts: any = await prisma.$queryRawUnsafe(
    `SELECT "providerId", "accountId", LEFT(password, 30) as password_prefix FROM "Account" WHERE "userId" = $1`,
    rows[0]?.id || ""
  );
  console.log("Accounts:", JSON.stringify(accounts, null, 2));

  const sessions: any = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "Session" WHERE "userId" = $1`,
    rows[0]?.id || ""
  );
  console.log("Sessions:", JSON.stringify(sessions, null, 2));

  const tfaSessions: any = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM "TwoFactorSession" WHERE "userId" = $1`,
    rows[0]?.id || ""
  );
  console.log("2FA Sessions:", JSON.stringify(tfaSessions, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);