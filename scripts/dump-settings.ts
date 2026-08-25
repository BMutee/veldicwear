import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const footer = await prisma.siteSection.findUnique({
    where: { key: "footer" },
  });
  console.log("=== SiteSection('footer') ===");
  console.log(JSON.stringify(footer, null, 2));

  const store = await prisma.storeSettings.findUnique({
    where: { id: "store" },
  });
  console.log("\n=== StoreSettings('store') ===");
  console.log(JSON.stringify(store, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});