/**
 * Probe CJ endpoints/methods for variant data and dump product/query keys.
 * Usage: npx tsx --env-file=.env scripts/probe-cj-sku-endpoints.ts [pid]
 */
import { cjGet, cjPost } from "@/lib/cj";

async function main() {
  const pid = process.argv[2] ?? "2508300653521615300";

  // 1) Does product/query itself include variants?
  const detail = await cjGet<Record<string, unknown>>("product/query", {
    pid,
    features: JSON.stringify(["enable_description"]),
  });
  console.log("product/query keys:", Object.keys(detail.data ?? {}).join(", "));
  const variants = (detail.data as Record<string, unknown>)?.variants;
  console.log(
    "product/query variants:",
    variants ? JSON.stringify(variants).slice(0, 500) : "(absent)"
  );

  // 2) POST-style SKU endpoints
  const postCandidates: Array<[string, unknown]> = [
    ["product/sku/getSkuList", { pid }],
    ["product/sku/querySkuList", { pid }],
    ["product/variant/queryVariantList", { pid }],
    ["product/querySkuList", { pid }],
  ];
  for (const [path, body] of postCandidates) {
    try {
      const res = await cjPost<Record<string, unknown>>(path, body);
      console.log(`POST OK   ${path} ->`, JSON.stringify(res.data).slice(0, 300));
    } catch (err) {
      console.log(`POST FAIL ${path} ->`, err instanceof Error ? err.message : err);
    }
  }
}

main().finally(() => process.exit(0));
