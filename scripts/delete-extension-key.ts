/** Delete an extension key row (test cleanup). Usage:
 *  npx tsx --env-file=.env scripts/delete-extension-key.ts <keyId>
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const id = process.argv[2];
  if (!id) throw new Error("Usage: delete-extension-key.ts <keyId>");
  await prisma.extensionApiKey.delete({ where: { id } });
  console.log(`DELETED ${id}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
