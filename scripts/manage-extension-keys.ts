/** List/revoke extension keys from CLI for testing. Usage:
 *  npx tsx --env-file=.env scripts/manage-extension-keys.ts list
 *  npx tsx --env-file=.env scripts/manage-extension-keys.ts revoke <keyId>
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const [, , cmd, arg] = process.argv;
  if (cmd === "list") {
    const keys = await prisma.extensionApiKey.findMany({ orderBy: { createdAt: "asc" } });
    for (const k of keys) {
      console.log(
        `${k.id} | ${k.name ?? "(no name)"} | revoked=${k.revoked} | lastUsed=${k.lastUsedAt?.toISOString() ?? "never"} | created=${k.createdAt.toISOString()}`
      );
    }
  } else if (cmd === "revoke" && arg) {
    await prisma.extensionApiKey.update({ where: { id: arg }, data: { revoked: true } });
    console.log(`REVOKED ${arg}`);
  } else {
    console.log("Usage: manage-extension-keys.ts list | revoke <keyId>");
    process.exitCode = 1;
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
