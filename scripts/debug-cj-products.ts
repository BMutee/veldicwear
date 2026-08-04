import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { cjGet } from "../lib/cj";

async function main() {
  const data = await cjGet<{
    pageSize: number;
    pageNumber: number;
    totalRecords: number;
    totalPages: number;
    content: Array<{
      productList: Array<Record<string, unknown>>;
    }>;
  }>("product/listV2", {
    keyWord: "test",
    page: "1",
    size: "1",
    features: JSON.stringify(["enable_description"]),
  });

  console.log("=== RAW CJ product/listV2 response ===");
  console.log(JSON.stringify(data.data, null, 2));

  const productList = (data.data as any).content?.flatMap((c: any) => c.productList ?? []) ?? [];
  if (productList.length > 0) {
    const firstProduct = productList[0];
    console.log("\n=== First product keys ===");
    console.log(Object.keys(firstProduct));
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});