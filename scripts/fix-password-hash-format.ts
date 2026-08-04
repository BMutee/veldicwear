import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/fix-password-hash-format.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User "${email}" not found.`);
    process.exit(1);
  }

  // Get current hash
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT password FROM "Account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    user.id
  );

  if (!rows || rows.length === 0) {
    console.error("No credential account found.");
    process.exit(1);
  }

  const currentHash: string = rows[0].password;
  console.log("Current hash:", currentHash);
  console.log("Current prefix:", currentHash.substring(0, 4));

  // Replace $2b$ with $2a$ - both are identical algorithms
  // Better Auth internally expects $2a$ format
  const fixedHash = currentHash.replace("$2b$", "$2a$");
  console.log("Fixed hash:", fixedHash);
  console.log("Fixed prefix:", fixedHash.substring(0, 4));

  // Update with the fixed hash
  await prisma.$executeRawUnsafe(
    `UPDATE "Account" SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
    fixedHash,
    user.id
  );

  console.log(`\n✅ Password hash format fixed for "${email}"`);
  console.log(`   Changed from ${currentHash.substring(0, 4)} to ${fixedHash.substring(0, 4)}`);

  await prisma.$disconnect();
}

main().catch(console.error);