import "dotenv/config";
import { cjPost } from "../lib/cj";

async function main() {
  // Confirm the PAY endpoint PATH is correct. Bogus ids must produce a
  // validation/lookup error (never 1600101 "Interface not found"), and must
  // NOT actually charge anything.
  const candidates: Array<[string, unknown]> = [
    ["shopping/pay/payBalanceV2", { shipmentOrderId: "INVALID-ID", payId: "INVALID-PAY" }],
    ["shopping/pay-balance-v2", { shipmentOrderId: "INVALID-ID", payId: "INVALID-PAY" }],
  ];
  for (const [path, body] of candidates) {
    try {
      const res = await cjPost<Record<string, unknown>>(path, body);
      console.log(`\nOK   ${path} ->`, JSON.stringify(res.data ?? res).slice(0, 300));
    } catch (err) {
      console.log(`\nFAIL ${path} ->`, err instanceof Error ? err.message : err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
