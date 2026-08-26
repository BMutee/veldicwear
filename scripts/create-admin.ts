import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * ONE-OFF ADMIN ACCOUNT CREATION
 * ==============================
 * Creates (or updates) the Veldic Wear admin account using Better Auth's
 * own password hashing so signIn.email validates it correctly.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password> [firstName] [lastName]
 *
 * NOTE on 2FA: twoFactorEnabled is intentionally left FALSE here. Enabling it
 * would require a one-time code to finish a Better Auth session, but the app's
 * login flow currently has no step to enter that code, so it would lock the
 * admin out. Enable it via /admin/security (once sign-in works) or add a
 * login-time code step first.
 */

async function main() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  const password = process.argv[3];
  const firstName = process.argv[4] || "Abdulkhalil";
  const lastName = process.argv[5] || "Mohammadi";

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> [firstName] [lastName]");
    process.exit(1);
  }

  const { hashPassword } = await import("@better-auth/utils/password");
  const hashed = await hashPassword(password);
  console.log("Password hashed with Better Auth's hasher (scrypt).");

  const existing = await prisma.user.findUnique({ where: { email } });
  let user: { id: string; email: string; role: string };

  if (existing) {
    user = await prisma.user.update({
      where: { email },
      data: { firstName, lastName, role: "admin", emailVerified: true },
    });
    console.log("Existing user found — updated to admin role.");
  } else {
    user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: "admin",
        emailVerified: true,
      },
    });
    console.log("Created new admin user.");
  }

  // Normalize to a SINGLE credential account holding the correct hash.
  // Better Auth picks the first credential account in the user's account list
  // (sign-in.mjs: `user.accounts.find(a => a.providerId === "credential")`), so
  // any leftover duplicate would win over the one we write here.
  await prisma.account.deleteMany({
    where: { userId: user.id, providerId: "credential" },
  });
  await prisma.account.create({
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: hashed,
      type: "email",
    },
  });

  // Clear any stale sessions so the new credentials take effect.
  await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(`\n✅ Admin account ready`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Role:     ${user.role}`);
  console.log(`   userID:   ${user.id}`);
  console.log(`   2FA:      not enabled (see notes)`);
}

main()
  .catch((e) => {
    console.error("Failed to create admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());