/** Dump raw product/query response fields for a pid to inspect URL fields.
 * Usage: npx tsx --env-file=.env scripts/dump-cj-product-fields.ts <pid>
 */
import { cjGet } from "@/lib/cj";

async function main() {
  const pid = process.argv[2] ?? "2508300653521615300";
  const res = await cjGet<Record<string, unknown>>("product/query", {
    pid,
    features: JSON.stringify(["enable_description"]),
  });
  const data = res.data ?? {};
  const interesting = Object.entries(data).filter(
    ([k, v]) =>
      /url|link|slug|web/i.test(k) ||
      (typeof v === "string" && /cjdropshipping|http/i.test(v) && !/image|video|\.jpg|\.png|\.mp4/i.test(v))
  );
  console.log(`All top-level keys (${Object.keys(data).length}):`);
  console.log(Object.keys(data).join(", "));
  console.log("\nURL-like fields:");
  for (const [k, v] of interesting) console.log(`${k} = ${JSON.stringify(v)?.slice(0, 200)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
