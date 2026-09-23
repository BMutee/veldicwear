import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cjFulfillOrder } from "../lib/cj-fulfillment";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const order = await prisma.order.findFirst({
    where: { cjFulfillmentStatus: { in: ["failed", "pending"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!order) {
    console.log("No failed/pending CJ orders to retry.");
    return;
  }
  console.log(`Retrying CJ fulfillment for ${order.orderNumber} (${order.id})`);
  console.log(`  destination: ${order.city}, ${order.country} ${order.postalCode}`);
  console.log(`  address: ${order.address}`);
  console.log(`  status before: ${order.cjFulfillmentStatus}`);

  await cjFulfillOrder(order.id);

  const after = await prisma.order.findUnique({ where: { id: order.id } });
  console.log(`\nstatus after: ${after?.cjFulfillmentStatus}`);
  console.log(`cjOrderId: ${after?.cjOrderId}`);
  console.log(`cjCartReference: ${after?.cjCartReference}`);
  console.log(`\nitems for reference:`);
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  for (const i of items) console.log(`  ${i.name} | size=${JSON.stringify(i.size)} color=${JSON.stringify(i.color)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});