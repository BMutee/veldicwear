import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: { include: { product: { select: { id: true, name: true } } } } },
  });
  for (const o of orders) {
    console.log("===", o.orderNumber, o.status, "| cjStatus:", o.cjFulfillmentStatus);
    console.log("    cjCartRef:", (o.cjCartReference ?? "null").slice(0, 500));
    console.log("    cjOrderId:", o.cjOrderId ?? "null", "| country:", JSON.stringify(o.country), "| city:", JSON.stringify(o.city), "| phone:", JSON.stringify(o.phone));
    for (const i of o.items) {
      console.log(`    item: ${i.name} size=${JSON.stringify(i.size)} color=${JSON.stringify(i.color)} qty=${i.quantity} productId=${i.product.id}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
