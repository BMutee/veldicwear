import "dotenv/config";
import { cjGet } from "../lib/cj";

type CJVariant = { vid?: string; variantSku?: string; variantKey?: string };

async function main() {
  const pid = process.argv[2] ?? "1578267399776907264";
  const res = await cjGet<{ variants?: CJVariant[]; productSku?: string; productNameEn?: string }>(
    "product/query",
    { pid, features: JSON.stringify(["enable_description"]) },
  );
  const v = res.data?.variants?.[0];
  console.log(JSON.stringify({
    name: res.data?.productNameEn?.slice(0, 60),
    productSku: res.data?.productSku,
    firstVid: v?.vid,
    firstVariantSku: v?.variantSku,
    firstVariantKey: v?.variantKey,
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });