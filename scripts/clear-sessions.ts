import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/clear-sessions.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User "${email}" not found.`);
    process.exit(1);
  }

  // Delete ALL sessions for this user
  const deleted = await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  console.log(`Deleted ${deleted.count} sessions for "${email}".`);

  // Also delete any verification records
  await prisma.verification.deleteMany({
    where: { identifier: email },
  });

  console.log("Sessions cleared. Now try logging in again.");
  
  await prisma.$disconnect();
}

main().catch(console.error);