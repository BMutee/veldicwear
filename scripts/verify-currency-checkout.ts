/**
 * Live verification of per-currency Stripe checkout (test mode).
 *
 * Run with the dev server up on :3000 and STRIPE_SECRET_KEY in .env:
 *   npx tsx scripts/verify-currency-checkout.ts
 *
 * Covers:
 *   1. USD  -> charges usd at exact cents.
 *   2. EUR  -> display-only estimate; session still charges usd.
 *   3. CAD  -> real charge at live rate; whole-unit rounding; locked rate in
 *              metadata matches the DB ExchangeRate row.
 *   4. Stale CAD rate -> graceful fallback: session charges usd + notice.
 *   5. Order lock -> createOrderFromStripeSession writes currency /
 *      exchangeRateUsed from metadata (test order deleted after).
 */
import { stripe } from "../lib/stripe";
import { prisma } from "../lib/prisma";
import { convertPrice } from "../lib/exchange-rates";
import { createOrderFromStripeSession } from "../lib/createOrderFromStripeSession";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.error(`  ❌ ${name}`, detail ?? "");
  }
}

async function createCheckout(cart: object[], cookieCurrency: string | null) {
  const res = await fetch(`${BASE}/api/payment/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieCurrency ? { Cookie: `currency=${cookieCurrency}` } : {}),
    },
    body: JSON.stringify({
      cart,
      shipping: {
        email: "currency-verify@example.com",
        firstName: "Verify",
        lastName: "Bot",
        address: "1 Test St",
        city: "Testville",
        country: "United States",
        postalCode: "10001",
      },
    }),
  });
  return { status: res.status, data: await res.json() };
}

function sessionIdFromUrl(url: string): string {
  // Stripe checkout URLs embed the session id in the path
  // (https://checkout.stripe.com/c/pay/cs_test_...#...).
  const m = url.match(/cs_(?:test|live)_[A-Za-z0-9]+/);
  if (!m) throw new Error(`Cannot extract session id from: ${url}`);
  return m[0];
}

async function main() {
  // ── Pick a real purchasable product ──
  const product = await prisma.product.findFirst({
    where: { active: true, variants: { some: { stock: { gt: 1 } } } },
    include: { variants: true },
  });
  if (!product) throw new Error("No active product with stock found.");
  const variant = product.variants.find((v) => v.stock > 1) ?? product.variants[0];
  const usdPrice = variant.price ?? product.price;
  const cart = [
    { id: product.id, size: variant.size, color: variant.color, quantity: 1 },
  ];
  console.log(`\nProduct: "${product.name}" (${variant.size}) @ $${usdPrice.toFixed(2)}\n`);

  const createdSessions: string[] = [];
  // Ensure CAD/EUR rate rows are FRESH so case [3] tests the live-rate path
  // (keeps stored rate values; only bumps fetchedAt).
  await prisma.exchangeRate.updateMany({
    where: { currency: { in: ["CAD", "EUR"] } },
    data: { fetchedAt: new Date() },
  });

  // ── 1. USD ──
  console.log("[1] USD checkout");
  {
    const { status, data } = await createCheckout(cart, null);
    check("200 response", status === 200, data);
    if (data.url) {
      createdSessions.push(sessionIdFromUrl(data.url));
      const s = await stripe.checkout.sessions.retrieve(createdSessions[0]);
      check("charges USD", s.currency === "usd", s.currency);
      check(
        `amount_total == $${usdPrice} exact cents`,
        s.amount_total === Math.round(usdPrice * 100),
        s.amount_total,
      );
      check("no fallback flag", s.metadata?.currency_fallback_to_usd === "0");
    }
  }

  // ── 2. EUR (display-only -> USD charge) ──
  console.log("\n[2] EUR checkout (estimate -> USD charge)");
  {
    const { status, data } = await createCheckout(cart, "EUR");
    check("200 response", status === 200, data);
    check("no notice for EUR estimate", !data.notice, data.notice);
    if (data.url) {
      const sid = sessionIdFromUrl(data.url);
      createdSessions.push(sid);
      const s = await stripe.checkout.sessions.retrieve(sid);
      check("charges USD despite EUR browsing", s.currency === "usd", s.currency);
      check("display_currency metadata is EUR", s.metadata?.display_currency === "EUR");
      check("locked rate is 1", Number(s.metadata?.exchange_rate_used) === 1);
    }
  }

  // ── 3. CAD (real charge at live rate) ──
  console.log("\n[3] CAD checkout (live-rate charge)");
  {
    const { status, data } = await createCheckout(cart, "CAD");
    check("200 response", status === 200, data);
    check("no notice (fresh rate)", !data.notice, data.notice);
    if (data.url) {
      const sid = sessionIdFromUrl(data.url);
      createdSessions.push(sid);
      const s = await stripe.checkout.sessions.retrieve(sid);
      const row = await prisma.exchangeRate.findUnique({
        where: { currency: "CAD" },
        select: { rate: true },
      });
      if (!row) throw new Error("No CAD ExchangeRate row — refresh rates first.");
      const expectedCad = Math.round(convertPrice(usdPrice, Number(row.rate)));
      check("charges CAD", s.currency === "cad", s.currency);
      check(
        `amount_total == CA$${expectedCad} whole-unit rounding`,
        s.amount_total === expectedCad * 100,
        { got: s.amount_total, want: expectedCad * 100 },
      );
      check(
        "metadata locked rate == DB rate",
        Math.abs(Number(s.metadata?.exchange_rate_used) - Number(row.rate)) < 1e-6,
        { meta: s.metadata?.exchange_rate_used, db: Number(row.rate) },
      );
      check("charge_currency metadata CAD", s.metadata?.charge_currency === "CAD");
    }
  }

  // ── 4. Stale CAD rate -> USD fallback + notice ──
  console.log("\n[4] Stale CAD rate -> USD fallback");
  {
    const saved = await prisma.exchangeRate.findUnique({ where: { currency: "CAD" } });
    if (!saved) throw new Error("No CAD rate row to make stale.");
    await prisma.exchangeRate.update({
      where: { currency: "CAD" },
      data: { fetchedAt: new Date(Date.now() - 48 * 3600_000) }, // 48h old
    });
    const { status, data } = await createCheckout(cart, "CAD");
    check("200 response (never blocks)", status === 200, data);
    check("notice present", typeof data.notice === "string" && data.notice.length > 0, data.notice);
    check("chargeCurrency fell back to USD", data.chargeCurrency === "USD", data.chargeCurrency);
    if (data.url) {
      const sid = sessionIdFromUrl(data.url);
      createdSessions.push(sid);
      const s = await stripe.checkout.sessions.retrieve(sid);
      check("session actually charges USD", s.currency === "usd", s.currency);
      check("fallback flag in metadata", s.metadata?.currency_fallback_to_usd === "1");

      // ── 5. Order lock from metadata ──
      console.log("\n[5] Order lock via createOrderFromStripeSession");
      try {
        const created = await createOrderFromStripeSession(s);
        const order = created.order;
        check("order created", !!order, order);
        check("order.currency == USD (fallback)", order!.currency === "USD", order!.currency);
        check(
          "order.exchangeRateUsed == 1 (USD)",
          Number(order!.exchangeRateUsed) === 1,
          order!.exchangeRateUsed,
        );
        // cleanup test order + restore stock
        await prisma.order.delete({ where: { id: order!.id } });
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: 1 } },
        });
        console.log("  test order removed, stock restored");
      } catch (e) {
        failed++;
        console.error("  order-lock flow threw:", e);
      }
    }
    // restore freshness
    await prisma.exchangeRate.update({
      where: { currency: "CAD" },
      data: { fetchedAt: saved.fetchedAt },
    });
    console.log("  🧹 CAD rate freshness restored");
  }

  void createOrderFromStripeSession;

  // Cleanup: expire test-mode sessions
  for (const id of createdSessions) {
    try {
      await stripe.checkout.sessions.expire(id);
    } catch {
      /* already expired */
    }
  }

  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

