import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/fix-account.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User "${email}" not found.`);
    process.exit(1);
  }

  // Check what fields are in the Account table currently
  const accounts: any = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Account" WHERE "userId" = $1`,
    user.id
  );
  console.log("Current account(s):", JSON.stringify(accounts, null, 2));

  // The Account.type is null - Better Auth might need it set for credential accounts
  // Let's also check if there's a difference in what Better Auth expects:
  // providerId = "credential" and type should probably be "email" or "password"
  
  const updated = await prisma.$executeRawUnsafe(
    `UPDATE "Account" SET type = 'email' WHERE "userId" = $1 AND "providerId" = 'credential'`,
    user.id
  );
  console.log(`\nSet type='email' on ${updated} account(s)`);

  // Verify
  const after: any = await prisma.$queryRawUnsafe(
    `SELECT id, type, "providerId", LEFT(password, 30) as pw FROM "Account" WHERE "userId" = $1`,
    user.id
  );
  console.log("After update:", JSON.stringify(after, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);