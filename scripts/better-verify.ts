import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = "abdulkhalilmohammadi78@gmail.com";

  const rows: any = await prisma.$queryRawUnsafe(
    `SELECT password FROM "Account" WHERE "userId" = (SELECT id FROM "User" WHERE email = $1) AND "providerId" = 'credential'`,
    email
  );

  if (!rows.length) {
    console.log("No account found");
    process.exit(1);
  }

  const storedHash = rows[0].password;
  console.log("Stored hash:", storedHash);

  // Test with Better Auth's verify function
  const { verifyPassword } = await import("@better-auth/utils/password");
  
  const testResult = await verifyPassword(storedHash, "12345678");
  console.log("Verify result:", testResult);

  // Also test wrong password
  const wrongResult = await verifyPassword(storedHash, "wrongpassword");
  console.log("Wrong password result:", wrongResult);

  process.exit(0);
}

main().catch(console.error);