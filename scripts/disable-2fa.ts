import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/disable-2fa.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User with email "${email}" not found.`);
    process.exit(1);
  }

  // Disable 2FA
  await prisma.user.update({
    where: { email },
    data: { 
      twoFactorEnabled: false,
      totpKey: null,
      backupCodes: null,
    },
  });

  // Clean up any pending 2FA sessions
  await prisma.twoFactorSession.deleteMany({
    where: { userId: user.id },
  });

  console.log(`✅ 2FA has been disabled for "${email}".`);
  console.log(`   You can now log in with just your email and password.`);
  console.log(`   After logging in, visit /admin/security to re-enable 2FA if desired.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});