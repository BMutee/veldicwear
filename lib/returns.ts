/**
 * Return-window rules, in one place.
 *
 * The window is stated in several places that must never disagree — the
 * /returns portal, the Return & Refund Policy, the Terms page and the email we
 * send back after a request — so the number lives here and the pages import it
 * instead of hard-coding "30".
 *
 * Data caveat: Order.deliveredAt exists in the schema but nothing writes it yet
 * (the admin sets status = "Delivered" without stamping a date), so orders
 * delivered through the admin have a null delivery date. The window therefore
 * falls back to the order date for those rows. That counts the clock from
 * earlier than reality, which is the safe direction to be wrong in: a customer
 * who is inside the real window is never told they are outside it.
 */

export const RETURN_WINDOW_DAYS = 30;

/** Support inbox. The seeded contact address, overridable per deployment. */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "info@veldicwear.com";

const DAY_MS = 24 * 60 * 60 * 1000;

export const RETURN_REASONS = [
  { value: "does-not-fit", label: "Doesn't fit" },
  { value: "changed-mind", label: "Changed my mind" },
  { value: "wrong-size", label: "Wrong size ordered" },
  { value: "not-as-described", label: "Not as described" },
  { value: "other", label: "Other" },
] as const;

export type ReturnReason = (typeof RETURN_REASONS)[number]["value"];

export function isReturnReason(value: unknown): value is ReturnReason {
  return RETURN_REASONS.some((reason) => reason.value === value);
}

export type ReturnWindowState =
  /** Inside the window — the customer can request a return. */
  | "eligible"
  /** Still in the post / pre-delivery phase; the clock hasn't started. */
  | "in-transit"
  /** Past the window. */
  | "outside-window"
  /** The order was cancelled or already refunded. */
  | "closed";

export type ReturnWindow = {
  state: ReturnWindowState;
  eligible: boolean;
  /** Whole days since the parcel was delivered; null while it is still moving. */
  daysSinceDelivery: number | null;
  /** Whole days left before the window closes; null when not eligible. */
  daysLeft: number | null;
  /** ISO date the window closes (display only); null when not eligible. */
  deadline: string | null;
  /** ISO date the window is counted from — the delivery date, or the order
   *  date for rows that were delivered without one (see the file header). */
  referenceDate: string | null;
};

const CLOSED_STATUSES = new Set(["cancelled", "refunded", "failed"]);

/**
 * Decide whether an order can be returned right now, and say why when it can't.
 *
 * `now` is a parameter so the rules can be verified without freezing time.
 */
export function evaluateReturnWindow(
  order: { status: string; createdAt: string | Date; deliveredAt: string | Date | null },
  now: Date = new Date()
): ReturnWindow {
  const closed: ReturnWindow = {
    state: "closed",
    eligible: false,
    daysSinceDelivery: null,
    daysLeft: null,
    deadline: null,
    referenceDate: null,
  };

  const status = order.status.trim().toLowerCase();
  if (CLOSED_STATUSES.has(status)) return closed;

  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : null;
  const createdAt = new Date(order.createdAt);
  const delivered = status === "delivered" || Boolean(order.deliveredAt);

  if (!delivered) {
    return { state: "in-transit", eligible: false, daysSinceDelivery: null, daysLeft: null, deadline: null, referenceDate: null };
  }

  // Prefer the stamped delivery date; fall back to the order date for orders
  // marked delivered without one.
  const reference = deliveredAt && !Number.isNaN(deliveredAt.getTime()) ? deliveredAt : createdAt;
  if (Number.isNaN(reference.getTime())) return closed;

  const deadline = new Date(reference.getTime() + RETURN_WINDOW_DAYS * DAY_MS);
  const daysSinceDelivery = Math.floor((now.getTime() - reference.getTime()) / DAY_MS);

  // A delivery date in the future means the status is ahead of the carrier
  // record; treat the parcel as still moving rather than rejecting the return.
  if (daysSinceDelivery < 0) {
    return { state: "in-transit", eligible: false, daysSinceDelivery: null, daysLeft: null, deadline: null, referenceDate: reference.toISOString() };
  }

  if (now.getTime() > deadline.getTime()) {
    return {
      state: "outside-window",
      eligible: false,
      daysSinceDelivery,
      daysLeft: 0,
      deadline: deadline.toISOString(),
      referenceDate: reference.toISOString(),
    };
  }

  return {
    state: "eligible",
    eligible: true,
    daysSinceDelivery,
    daysLeft: Math.ceil((deadline.getTime() - now.getTime()) / DAY_MS),
    deadline: deadline.toISOString(),
    referenceDate: reference.toISOString(),
  };
}

/** Human reference the customer quotes in the follow-up email, e.g. RET-4K2P-91. */
export function makeReturnReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — read aloud on support calls
  const block = (length: number) =>
    Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `RET-${block(4)}-${block(2)}`;
}

/** Clamp free text from the customer so one request can't mail a novel. */
export function normaliseReturnNote(note: unknown): string {
  return typeof note === "string" ? note.trim().slice(0, 1000) : "";
}
