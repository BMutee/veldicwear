/**
 * End-to-end smoke test for POST /api/extension/cj-import against a running
 * dev server. Usage: npx tsx --env-file=.env scripts/test-extension-endpoint.ts <rawKey>
 */
export {}; // module scope — a bare `main` here collided with other scripts (TS2393)

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const rawKey = process.argv[2];
const EXISTING_PID = "2508300653521615300"; // already imported sunglasses

async function call(label: string, body: unknown, auth?: string) {
  const res = await fetch(`${BASE}/api/extension/cj-import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`[${label}] HTTP ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  return { status: res.status, json };
}

async function main() {
  if (!rawKey) throw new Error("Pass the raw key as argv[2]");

  await call("no auth", { productId: EXISTING_PID });
  await call("bogus key", { productId: EXISTING_PID }, "vw_bogusbogusbogusbogusbogusbogusbogus");
  await call("missing productId", {}, rawKey);
  await call("malformed productId", { productId: "abc-123" }, rawKey);

  // Success — product already imported, so this exercises the REFRESH path
  const refreshed = await call("refresh existing", { productId: EXISTING_PID }, rawKey);
  if (refreshed.status !== 200) throw new Error("refresh existing failed");
  if (refreshed.json.action !== "refreshed") throw new Error("expected action=refreshed");
  if (!refreshed.json.product?.name) throw new Error("expected product name in response");
  if (refreshed.json.product.imageCount < 8) {
    throw new Error(
      `gallery regression: expected >=8 images after refresh, got ${refreshed.json.product.imageCount}`
    );
  }
  if (refreshed.json.product.variantCount < 3) {
    throw new Error(`expected >=3 variants, got ${refreshed.json.product.variantCount}`);
  }

  // Success — a product NOT yet in the DB exercises the IMPORT path.
  // Pick a pid that is very unlikely to exist locally.
  const freshPid = "2508300653521615999";
  const imported = await call("import new", { productId: freshPid }, rawKey);
  console.log(`[import new] action=${imported.json?.action} (502 means the pid is not a real CJ product — auth path still verified)`);

  // lastUsedAt should now be set
  const { prisma } = await import("@/lib/prisma");
  const key = await prisma.extensionApiKey.findFirst({
    where: { revoked: false },
    orderBy: { lastUsedAt: "desc" },
  });
  console.log(`[lastUsedAt] ${key?.lastUsedAt?.toISOString() ?? "NULL"}`);

  // Rate limit: 10 imports/min per key — we've used 2. Hammer 9 more to cross it.
  for (let i = 0; i < 9; i++) {
    await call(`hammer ${i + 1}`, { productId: EXISTING_PID }, rawKey);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
