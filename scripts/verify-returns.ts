/**
 * Verifies the return-window rules behind the /returns portal.
 *
 *   npx tsx scripts/verify-returns.ts
 *
 * Pure logic — no server or database needed. Guards:
 *   1. An order inside the window is eligible, with the days left counted from
 *      the delivery date.
 *   2. The window is closed once it expires, and one second before it closes it
 *      is still open (the boundary is the thing that gets off-by-one'd).
 *   3. Orders still in transit, cancelled, refunded or failed are never
 *      eligible, and say why.
 *   4. Orders delivered without a stamped delivery date fall back to the order
 *      date (nothing writes deliveredAt yet) — counted from earlier rather than
 *      later, so a customer inside the real window is never turned away.
 *   5. Free-text notes are trimmed and capped; references are short and
 *      unambiguous to read aloud.
 */
import {
  RETURN_REASONS,
  RETURN_WINDOW_DAYS,
  evaluateReturnWindow,
  isReturnReason,
  makeReturnReference,
  normaliseReturnNote,
} from "../lib/returns";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${label}${ok ? "" : ` → got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`,
  );
}

const NOW = new Date("2026-09-27T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();
const daysAhead = (days: number) => new Date(NOW.getTime() + days * DAY).toISOString();

console.log(`Window is ${RETURN_WINDOW_DAYS} days from delivery`);

console.log("\nInside the window");
const fresh = evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(40), deliveredAt: daysAgo(3) },
  NOW,
);
check("eligible", fresh.eligible, true);
check("state", fresh.state, "eligible");
check("3 days since delivery", fresh.daysSinceDelivery, 3);
check("27 days left", fresh.daysLeft, RETURN_WINDOW_DAYS - 3);
check("counts from the delivery date, not the order date", fresh.referenceDate, daysAgo(3));
check("last day is still open", evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(90), deliveredAt: daysAgo(RETURN_WINDOW_DAYS) },
  NOW,
).eligible, true);
check("one second before closing is still open", evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(90), deliveredAt: new Date(NOW.getTime() - RETURN_WINDOW_DAYS * DAY + 1000).toISOString() },
  NOW,
).eligible, true);
check("and a second later it is not", evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(90), deliveredAt: new Date(NOW.getTime() - RETURN_WINDOW_DAYS * DAY - 1000).toISOString() },
  NOW,
).eligible, false);

console.log("\nOutside the window / not returnable");
const late = evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(200), deliveredAt: daysAgo(RETURN_WINDOW_DAYS + 5) },
  NOW,
);
check("state", late.state, "outside-window");
check("not eligible", late.eligible, false);
check("zero days left", late.daysLeft, 0);
check("the deadline is still reported", typeof late.deadline, "string");
check("in transit", evaluateReturnWindow({ status: "Shipped", createdAt: daysAgo(5), deliveredAt: null }, NOW).state, "in-transit");
check("just ordered", evaluateReturnWindow({ status: "Ordered", createdAt: daysAgo(1), deliveredAt: null }, NOW).state, "in-transit");
check("cancelled", evaluateReturnWindow({ status: "Cancelled", createdAt: daysAgo(5), deliveredAt: daysAgo(2) }, NOW).state, "closed");
check("refunded", evaluateReturnWindow({ status: "Refunded", createdAt: daysAgo(5), deliveredAt: daysAgo(2) }, NOW).state, "closed");
check("payment failed", evaluateReturnWindow({ status: "Failed", createdAt: daysAgo(5), deliveredAt: null }, NOW).state, "closed");
check("a delivery date in the future is treated as in transit", evaluateReturnWindow(
  { status: "Delivered", createdAt: daysAgo(2), deliveredAt: daysAhead(1) },
  NOW,
).state, "in-transit");

console.log("\nDelivered without a stamped delivery date");
const unstamped = evaluateReturnWindow({ status: "Delivered", createdAt: daysAgo(10), deliveredAt: null }, NOW);
check("eligible (falls back to the order date)", unstamped.eligible, true);
check("counted from the order date", unstamped.referenceDate, daysAgo(10));
check("lower-case status is understood", evaluateReturnWindow(
  { status: "delivered", createdAt: daysAgo(10), deliveredAt: daysAgo(10) },
  NOW,
).eligible, true);
check("padded status is understood", evaluateReturnWindow(
  { status: " Delivered ", createdAt: daysAgo(10), deliveredAt: daysAgo(10) },
  NOW,
).eligible, true);
check("an unparseable createdAt is refused rather than approved", evaluateReturnWindow(
  { status: "Delivered", createdAt: "not-a-date", deliveredAt: null },
  NOW,
).eligible, false);

console.log("\nReasons and notes");
check("a known reason is accepted", isReturnReason("does-not-fit"), true);
check("an unknown reason is rejected", isReturnReason("because"), false);
check("a non-string is rejected", isReturnReason(7), false);
check("every reason has a label", RETURN_REASONS.every((entry) => entry.label.length > 0), true);
check("note is trimmed", normaliseReturnNote("  too big  "), "too big");
check("note is capped at 1000 chars", normaliseReturnNote("x".repeat(5000)).length, 1000);
check("a non-string note becomes empty", normaliseReturnNote({ evil: true }), "");
check("reference shape", /^RET-[A-Z2-9]{4}-[A-Z2-9]{2}$/.test(makeReturnReference()), true);
check("references are not all the same", makeReturnReference() !== makeReturnReference(), true);

console.log(
  failures === 0
    ? `\n✅ The ${RETURN_WINDOW_DAYS}-day window opens on delivery and closes ${RETURN_WINDOW_DAYS} days later, and nothing else sneaks through.`
    : `\n❌ ${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
