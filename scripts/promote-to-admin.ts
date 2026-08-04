/**
 * ONE-OFF ADMIN PROMOTION SCRIPT
 * ===============================
 *
 * Usage:
 *   npx tsx scripts/promote-to-admin.ts <email>
 *
 * This script promotes an existing user to the "admin" role.
 * Run it only when you need to manually grant admin access.
 *
 * SECURITY NOTE:
 * - There is NO public UI for creating admins (by design).
 * - Only run this on your local machine or via a secure SSH session.
 * - Treat the admin role like a root-level privilege.
 */

import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: npx tsx scripts/promote-to-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`User "${email}" is already an admin.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`✅ User "${email}" has been promoted to admin.`);
  console.log(`   ID:   ${user.id}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
}

main()
  .catch((e) => {
    console.error("Failed to promote user:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());