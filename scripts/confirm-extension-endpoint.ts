/**
 * Four-way confirmation for POST /api/extension/cj-import.
 * Usage: npx tsx --env-file=.env scripts/confirm-extension-endpoint.ts
 * Requires the dev server running (TEST_BASE_URL, default http://localhost:3000).
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateExtensionApiKey } from "@/lib/extension-api-keys";
import { cjGet } from "@/lib/cj";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const EXISTING_PID = "2508300653521615300";

let failures = 0;
function check(label: string, ok: boolean, detail?: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function call(body: unknown, auth?: string) {
  const res = await fetch(`${BASE}/api/extension/cj-import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

async function main() {
  // ===== 1. Auth: invalid / missing / revoked rejected 401; valid succeeds =====
  console.log("\n--- 1. Authentication ---");
  const noAuth = await call({ productId: EXISTING_PID });
  check("missing Authorization header -> 401", noAuth.status === 401, `got ${noAuth.status}`);

  const bogus = await call({ productId: EXISTING_PID }, "vw_bogusbogusbogusbogusbogusbogusbogus");
  check("bogus (well-formed but unknown) key -> 401", bogus.status === 401, `got ${bogus.status}`);

  const notVw = await call({ productId: EXISTING_PID }, "sk_live_abcdefghijklmnopqrstuvwxyz123456");
  check("non-vw-prefixed token -> 401", notVw.status === 401, `got ${notVw.status}`);

  const generated = await generateExtensionApiKey("Confirmation test key");
  const rawKey = generated.key;

  await prisma.extensionApiKey.update({ where: { id: generated.id }, data: { revoked: true } });
  const revoked = await call({ productId: EXISTING_PID }, rawKey);
  check("revoked key -> 401", revoked.status === 401, `got ${revoked.status}`);
  await prisma.extensionApiKey.update({ where: { id: generated.id }, data: { revoked: false } });

  const valid = await call({ productId: EXISTING_PID }, rawKey);
  check(
    "valid key succeeds",
    valid.status === 200 && valid.json.ok === true && valid.json.action === "refreshed",
    `got ${valid.status} ${JSON.stringify(valid.json).slice(0, 160)}`
  );

  // ===== 2. Raw key never stored or logged, only its hash =====
  console.log("\n--- 2. Key storage ---");
  const row = await prisma.extensionApiKey.findUniqueOrThrow({ where: { id: generated.id } });
  const sha = createHash("sha256").update(rawKey, "utf8").digest("hex");
  check("DB keyHash equals SHA-256 of raw key", row.keyHash === sha);
  const rowJson = JSON.stringify(row);
  check("raw key string appears nowhere in the DB row", !rowJson.includes(rawKey));

  const { validateExtensionApiKey } = await import("@/lib/extension-api-keys");
  const validated = await validateExtensionApiKey(rawKey);
  check("hash-stored key validates against raw key", validated?.id === generated.id);

  // ===== 3. Real end-to-end IMPORT of a real, not-yet-imported CJ product =====
  console.log("\n--- 3. End-to-end import of a NEW real CJ product ---");
  const list = await cjGet<{ list: Array<{ pid: string; productNameEn?: string }> }>(
    "product/list",
    { pageNum: "1", pageSize: "10", type: "COMMON" }
  );
  const candidate = (list.data?.list ?? []).find(
    (p) => /^\d{10,25}$/.test(p.pid) && p.pid !== EXISTING_PID
  );
  if (!candidate) {
    check("found a real CJ pid to import", false, "product/list returned nothing usable");
  } else {
    const preExisting = await prisma.product.findUnique({ where: { id: candidate.pid } });
    check("candidate pid not yet in local catalog", !preExisting, `pid=${candidate.pid} (${candidate.productNameEn?.slice(0, 40)})`);

    const imported = await call({ productId: candidate.pid }, rawKey);
    check(
      "endpoint returned ok:true action:imported",
      imported.status === 200 && imported.json.ok === true && imported.json.action === "imported",
      `got ${imported.status} ${JSON.stringify(imported.json).slice(0, 200)}`
    );

    const dbProduct = await prisma.product.findUnique({
      where: { id: candidate.pid },
      include: { _count: { select: { images: true, variants: true } } },
    });
    check(
      "product created in DB with description + variants + images",
      Boolean(
        dbProduct &&
          dbProduct.description &&
          !dbProduct.description.startsWith("Imported from CJ Dropshipping:") &&
          dbProduct._count.variants > 0 &&
          dbProduct._count.images > 0
      ),
      dbProduct
        ? `variants=${dbProduct._count.variants} images=${dbProduct._count.images} price=${dbProduct.price}`
        : "product missing"
    );
    console.log(`      imported: ${dbProduct?.name?.slice(0, 70)}`);

    // restore catalog state: this product was never in the catalog before
    await prisma.product.delete({ where: { id: candidate.pid } });
    const gone = await prisma.product.findUnique({ where: { id: candidate.pid } });
    check("test-imported product removed (catalog restored)", !gone);
  }

  // ===== 4. Rate limiting actually triggers =====
  console.log("\n--- 4. Rate limiting ---");
  const codes: number[] = [];
  for (let i = 0; i < 12; i++) {
    // body is intentionally invalid -> fast 400s, but the per-key limiter
    // counts every authorized request before body validation
    codes.push((await call({}, rawKey)).status);
  }
  const allowed = codes.filter((c) => c !== 429).length;
  const limited = codes.filter((c) => c === 429).length;
  // The per-key window (60s) already contains the authorized requests from
  // sections 1 & 3, so fewer than 10 of these 12 fast requests get through —
  // what matters is that 429s DO occur and no more than 10 total were allowed.
  check(
    "rate limit triggers: 429s after <=10 allowed requests in window",
    limited >= 2 && allowed <= 10,
    `this batch: allowed=${allowed} limited=${limited} codes=${codes.join(",")}`
  );

  // cleanup
  await prisma.extensionApiKey.delete({ where: { id: generated.id } });
  const keyGone = await prisma.extensionApiKey.findUnique({ where: { id: generated.id } });
  check("test key deleted", !keyGone);

  console.log(failures === 0 ? "\nALL CONFIRMATIONS PASSED" : `\n${failures} CONFIRMATION(S) FAILED`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main()
  .catch((err) => {
    console.error("RUN FAILED:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
