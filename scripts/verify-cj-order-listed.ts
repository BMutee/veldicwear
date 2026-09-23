import "dotenv/config";
import { cjPost } from "../lib/cj";

/**
 * Verify the recreated CJ order is visible in CJ's order lists.
 * Tries the v2 order-list endpoints with our order number / CJ order id.
 */
async function main() {
  const orderNumber = process.argv[2] ?? "2100682884221509632";
  const cjOrderId = process.argv[3] ?? "SD2609172026430653500";

  const attempts: Array<{ name: string; endpoint: string; body: Record<string, unknown> }> = [
    { name: "pendingList", endpoint: "shopping/pendingList", body: { orderNumber } },
    { name: "pendingList page1", endpoint: "shopping/pendingList", body: { pageNumber: 1, pageSize: 20 } },
    { name: "order/list", endpoint: "shopping/order/list", body: { orderNumber, pageNumber: 1, pageSize: 20 } },
    { name: "order/getOrderList", endpoint: "shopping/order/getOrderList", body: { orderNumber, pageNumber: 1, pageSize: 20 } },
    { name: "order/getOrderDetail (orderNumber)", endpoint: "shopping/order/getOrderDetail", body: { orderNumber } },
    { name: "order/getOrderDetail (cjOrderId)", endpoint: "shopping/order/getOrderDetail", body: { orderId: cjOrderId } },
  ];

  for (const attempt of attempts) {
    try {
      const res = await cjPost<unknown>(attempt.endpoint, attempt.body);
      const json = JSON.stringify(res);
      console.log(`\n=== ${attempt.name} (${attempt.endpoint}) ===`);
      console.log(json.length > 2200 ? json.slice(0, 2200) + " …[truncated]" : json);
    } catch (e) {
      console.log(`\n=== ${attempt.name} (${attempt.endpoint}) ===`);
      console.log(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
