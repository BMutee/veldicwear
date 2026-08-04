import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/check-user.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    console.log(`User with email "${email}" NOT FOUND in database.`);
    process.exit(0);
  }

  console.log("=== User Record ===");
  console.log(JSON.stringify(user, null, 2));

  // Check if account has password
  const account = user.accounts?.[0];
  if (account) {
    console.log("\n=== Account Info ===");
    console.log(`Account ID: ${account.id}`);
    console.log(`Provider: ${account.providerId}`);
    console.log(`Has password: ${account.password ? "YES" : "NO"}`);
    if (account.password) {
      console.log(`Password hash starts with: ${account.password.substring(0, 40)}...`);
    }
  } else {
    console.log("\n⚠️  No Account record found! This means the user cannot login via email/password.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});