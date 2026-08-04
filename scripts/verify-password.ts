import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.argv[2];
  const testPassword = process.argv[3] || "12345678";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log(`User "${email}" not found.`);
    process.exit(1);
  }

  console.log("User:", user.email, "(role:", user.role, ")");

  // Check ALL accounts for this user
  const accounts = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Account" WHERE "userId" = $1`,
    user.id
  );
  console.log("\nAccounts:", JSON.stringify(accounts, null, 2));

  // Try bcrypt verify on the stored hash
  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT password FROM "Account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
    user.id
  );
  
  if (rows && rows.length > 0) {
    const storedHash = rows[0].password;
    console.log("\nStored hash:", storedHash);
    
    try {
      const match = bcrypt.compareSync(testPassword, storedHash);
      console.log("bcrypt.compare result:", match);
      console.log("Test password:", testPassword);
    } catch (e: any) {
      console.log("bcrypt.compare error:", e.message);
    }
  }

  // Check the Account model field names from Prisma
  const accountColumns = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Account' ORDER BY ordinal_position`
  );
  console.log("\nAccount table columns:", JSON.stringify(accountColumns, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);