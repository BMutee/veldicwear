"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TrackingOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  // Must match /api/orders/track, which selects the Order.items relation.
  // Color included: the tracking page must show the exact variant ordered
  // (name + size + color + quantity), same as the confirmation email.
  items: { name: string; size: string; color?: string | null; quantity: number }[];
};

/**
 * The two ways onto this page: the signed link from the order-confirmation
 * email, or the order number + checkout email typed in by hand. Both end up
 * calling the same public /api/orders/track endpoint with different shapes.
 */
type LookupRequest =
  | { mode: "link"; token: string }
  | { mode: "form"; orderNumber: string; email: string };

/**
 * The four steps a customer actually cares about. Terminal states
 * (cancelled / refunded / failed) deliberately step out of the timeline.
 */
import { SUPPORT_EMAIL } from "@/lib/returns";

const STEPS = ["Ordered", "Processing", "Shipped", "Delivered"] as const;

/**
 * Order.status is written in two shapes across this codebase — title case from
 * the admin ("Shipped", see app/api/admin/orders/[id]/route.ts) and lower case
 * from the schema default / older rows ("pending", "paid"). Normalise before
 * matching so the customer never sees a raw database value.
 */
const STATUS_LABELS: Record<string, string> = {
  ordered: "Order confirmed",
  pending: "Payment pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};

const STEP_FOR_STATUS: Record<string, number> = {
  ordered: 0,
  pending: 0,
  paid: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const TERMINAL_STATUSES = ["cancelled", "refunded", "failed"];

function statusKey(status: string) {
  return status.trim().toLowerCase();
}

function statusLabel(status: string) {
  return STATUS_LABELS[statusKey(status)] ?? status.trim();
}

function statusBadgeClass(status: string) {
  const key = statusKey(status);
  if (TERMINAL_STATUSES.includes(key)) {
    return "border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]";
  }
  if (key === "delivered") {
    return "border-green-800/20 bg-green-100 text-green-800";
  }
  if (key === "shipped" || key === "processing" || key === "paid") {
    return "border-[#CA8A04]/30 bg-[#CA8A04]/10 text-[#CA8A04]";
  }
  return "border-[#1C1917]/15 bg-[#1C1917]/5 text-[#44403C]";
}

// Built once at module scope: creating formatters during render is unnecessary
// work, and the formatted output must be identical on every render.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

/**
 * One network call per lookup, owned by no effect — both the signed link
 * (from useEffect) and the hand-typed form (from the submit handler) go
 * through here. Keeping it outside the component also keeps the effect free
 * of synchronous setState (react-hooks/set-state-in-effect).
 */
async function runLookup(request: LookupRequest): Promise<Response> {
  if (request.mode === "link") {
    return fetch("/api/orders/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: request.token }),
    });
  }
  const params = new URLSearchParams({
    orderNumber: request.orderNumber,
    email: request.email,
  });
  return fetch(`/api/orders/track?${params.toString()}`, { method: "GET" });
}

/** Never let a non-JSON error page crash the page's own error handling. */
async function safeJson(response: Response): Promise<{ order?: TrackingOrder } | null> {
  try {
    return (await response.json()) as { order?: TrackingOrder };
  } catch {
    return null;
  }
}

export default function TrackOrderClient() {
  const token = useSearchParams().get("token");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [copied, setCopied] = useState(false);
  const [formNumber, setFormNumber] = useState("");
  const [formEmail, setFormEmail] = useState("");
  // Which request the screen currently belongs to. A ref (not state) because
  // request handlers need the *current* value even when they were created
  // before a newer request started — a token-link fetch finishing after a
  // hand-typed form submit must not overwrite the form's result.
  const latestRequest = useRef<LookupRequest | null>(null);

  const rememberRequest = useCallback((request: LookupRequest) => {
    latestRequest.current = request;
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const request: LookupRequest = { mode: "link", token };
    rememberRequest(request);

    (async () => {
      try {
        const response = await runLookup(request);
        if (!active || latestRequest.current !== request) return;

        if (response.status === 404) {
          // Only a bad/expired link is the customer's problem to solve.
          setError("This tracking link is invalid or has expired.");
          return;
        }
        if (response.status === 429) {
          setError("Too many lookups. Please try again in a few minutes.");
          setRetryable(true);
          return;
        }
        if (!response.ok) {
          // 5xx / proxy failure — not a bad link, so don't say it is.
          setError("We couldn't load this order right now. Please try again in a moment.");
          setRetryable(true);
          return;
        }

        const data = await safeJson(response);
        if (!active || latestRequest.current !== request) return;
        if (data?.order) {
          setOrder(data.order);
        } else {
          setError("We couldn't load this order right now. Please try again in a moment.");
          setRetryable(true);
        }
      } catch {
        // Network failure — the request never completed, so offer a retry.
        if (active && latestRequest.current === request) {
          setError("We couldn't load this order right now. Check your connection and try again.");
          setRetryable(true);
        }
      } finally {
        if (active && latestRequest.current === request) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token, rememberRequest]);

  const copyTracking = useCallback(async () => {
    const trackingNumber = order?.trackingNumber;
    if (!trackingNumber) return;
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or denied permission). The number is
      // rendered as selectable text, so the customer can still copy it by hand.
    }
  }, [order?.trackingNumber]);

  // Retrying is a user event, so the request state is reset here rather than in
  // the effect: synchronous setState calls inside an effect body cause
  // cascading renders (react-hooks/set-state-in-effect). Re-running the exact
  // request that just failed keeps the message honest.
  const retry = useCallback(() => {
    const current = latestRequest.current;
    if (!current) return;
    setLoading(true);
    setError("");
    setRetryable(false);
    void (async () => {
      try {
        const response = await runLookup(current);
        if (latestRequest.current !== current) return;
        if (response.status === 404) {
          setError(
            current.mode === "link"
              ? "This tracking link is invalid or has expired."
              : "We couldn't find an order with that order number and email. Check both and try again.",
          );
          return;
        }
        if (response.status === 429) {
          setError("Too many lookups. Please try again in a few minutes.");
          setRetryable(true);
          return;
        }
        if (!response.ok) {
          setError("We couldn't load this order right now. Please try again in a moment.");
          setRetryable(true);
          return;
        }
        const data = await safeJson(response);
        if (latestRequest.current !== current) return;
        if (data?.order) {
          setOrder(data.order);
        } else {
          setError("We couldn't load this order right now. Please try again in a moment.");
          setRetryable(true);
        }
      } catch {
        if (latestRequest.current !== current) return;
        setError("We couldn't load this order right now. Check your connection and try again.");
        setRetryable(true);
      } finally {
        if (latestRequest.current === current) setLoading(false);
      }
    })();
  }, []);

  const submitLookup = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const orderNumber = formNumber.trim();
      const email = formEmail.trim();
      if (!orderNumber || !email || loading) return;
      setOrder(null);
      setError("");
      setRetryable(false);
      setLoading(true);
      const request: LookupRequest = { mode: "form", orderNumber, email };
      rememberRequest(request);
      void (async () => {
        try {
          const response = await runLookup(request);
          if (latestRequest.current !== request) return;
          if (response.status === 404) {
            setError("We couldn't find an order with that order number and email. Check both and try again.");
            return;
          }
          if (response.status === 429) {
            setError("Too many lookups. Please try again in a few minutes.");
            setRetryable(true);
            return;
          }
          if (!response.ok) {
            setError("We couldn't load this order right now. Please try again in a moment.");
            setRetryable(true);
            return;
          }
          const data = await safeJson(response);
          if (latestRequest.current !== request) return;
          if (data?.order) {
            setOrder(data.order);
          } else {
            setError("We couldn't load this order right now. Please try again in a moment.");
            setRetryable(true);
          }
        } catch {
          if (latestRequest.current !== request) return;
          setError("We couldn't load this order right now. Check your connection and try again.");
          setRetryable(true);
        } finally {
          if (latestRequest.current === request) setLoading(false);
        }
      })();
    },
    [formNumber, formEmail, loading, rememberRequest],
  );

  // Start over with a different order-number lookup. Token links can't start
  // over this way — their credentials live in the signed URL, not the form.
  const resetLookup = useCallback(() => {
    setOrder(null);
    setError("");
    setRetryable(false);
    setFormNumber("");
    setFormEmail("");
    latestRequest.current = null;
  }, []);

  const activeStep = order ? STEP_FOR_STATUS[statusKey(order.status)] : undefined;
  const isTerminal = order ? TERMINAL_STATUSES.includes(statusKey(order.status)) : false;

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">Support</p>
        <h1 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">
          Track Order
        </h1>
        <p className="mt-3 font-sans text-sm text-[#78716C]">Follow your order from confirmation to delivery.</p>

        {loading && <p className="mt-8 font-sans text-sm text-[#78716C]">Loading your order&hellip;</p>}

        {!loading && error && (
          <div className="mt-8 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
            <p className="font-sans text-sm text-[#DC2626]">{error}</p>
            {retryable && (
              <button
                type="button"
                onClick={retry}
                className="mt-3 border border-[#DC2626]/40 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-[#DC2626] transition-colors duration-200 hover:bg-[#DC2626]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626] cursor-pointer"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!loading && !error && !token && !order && (
          <div className="mt-8 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
              Look up your order
            </h2>
            <p className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">
              Enter the order number and the email address you used at checkout — you&rsquo;ll find both in your order
              confirmation email.
            </p>
            <form onSubmit={submitLookup} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="track-order-number"
                  className="block font-display text-xs font-bold uppercase tracking-[0.12em] text-[#1C1917]"
                >
                  Order number
                </label>
                <input
                  id="track-order-number"
                  name="orderNumber"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. ORD-1727284800000-1234"
                  value={formNumber}
                  onChange={(event) => setFormNumber(event.target.value)}
                  className="mt-2 w-full border border-[#1C1917]/20 bg-white px-4 py-3 font-sans text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#CA8A04] focus:outline-none focus:ring-1 focus:ring-[#CA8A04]"
                />
              </div>
              <div>
                <label
                  htmlFor="track-order-email"
                  className="block font-display text-xs font-bold uppercase tracking-[0.12em] text-[#1C1917]"
                >
                  Email used at checkout
                </label>
                <input
                  id="track-order-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  className="mt-2 w-full border border-[#1C1917]/20 bg-white px-4 py-3 font-sans text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#CA8A04] focus:outline-none focus:ring-1 focus:ring-[#CA8A04]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !formNumber.trim() || !formEmail.trim()}
                className="w-full bg-[#1C1917] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#F3F7FC] transition-colors duration-200 hover:bg-[#CA8A04] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04] cursor-pointer"
              >
                Track my order
              </button>
            </form>
            <p className="mt-5 font-sans text-sm leading-relaxed text-[#44403C]">
              Lost your confirmation email? Check your spam folder first, then{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
              >
                email us
              </a>{" "}
              and we&rsquo;ll send a fresh tracking link.
            </p>
          </div>
        )}

        {!loading && !token && order && (
          <button
            type="button"
            onClick={resetLookup}
            className="mt-6 font-sans text-sm font-semibold text-[#1C1917] underline decoration-[#CA8A04] underline-offset-4 transition-colors duration-200 hover:text-[#CA8A04] cursor-pointer"
          >
            Look up a different order
          </button>
        )}

        {!loading && order && (
          <section className="mt-8 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
                  Order number
                </p>
                <p className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
                  {order.orderNumber}
                </p>
                <p className="mt-1 font-sans text-sm text-[#78716C]">Placed {formatDate(order.createdAt)}</p>
              </div>
              <span
                className={`inline-block border px-3 py-1 font-display text-xs font-bold uppercase tracking-wider ${statusBadgeClass(order.status)}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>

            {activeStep !== undefined ? (
              <ol className="mt-8 grid grid-cols-4 gap-2">
                {STEPS.map((step, index) => {
                  const reached = index <= activeStep;
                  return (
                    <li key={step} className="flex flex-col items-center text-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold ${
                          reached
                            ? "border-[#CA8A04] bg-[#CA8A04] text-white"
                            : "border-[#1C1917]/15 bg-white text-[#A8A29E]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={`mt-2 font-sans text-[0.6875rem] uppercase tracking-[0.08em] ${
                          reached ? "text-[#1C1917]" : "text-[#A8A29E]"
                        }`}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-8 border border-[#1C1917]/10 bg-[#FAFAF9] p-4 font-sans text-sm leading-relaxed text-[#44403C]">
                {isTerminal
                  ? "This order is no longer in transit. See our Return & Refund Policy, or contact us if you have questions."
                  : "We're still confirming the status of this order. Check back shortly, or contact us if you need help."}
              </p>
            )}
            <div className="mt-8 border-t border-[#1C1917]/10 pt-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">Tracking</h2>
              {order.trackingNumber ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="break-all font-mono text-sm text-[#1C1917]">{order.trackingNumber}</span>
                    <button
                      type="button"
                      onClick={copyTracking}
                      className="border border-[#1C1917]/20 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-[#1C1917] transition-colors duration-200 hover:border-[#CA8A04] hover:text-[#CA8A04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CA8A04] cursor-pointer"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {order.trackingCarrier && (
                    <p className="mt-3 font-sans text-sm text-[#44403C]">
                      Carrier: <strong className="text-[#1C1917]">{order.trackingCarrier}</strong>
                    </p>
                  )}
                  <p className="mt-2 font-sans text-xs leading-5 text-[#78716C]">
                    Tracking can take 24&ndash;48 hours to start updating.
                  </p>
                </>
              ) : (
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">
                  Your tracking number will appear here as soon as your order ships. We&rsquo;ll also send it to you by
                  email.
                </p>
              )}
            </div>

            <div className="mt-8 border-t border-[#1C1917]/10 pt-6">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">Items</h2>
              <ul className="mt-3 space-y-2 font-sans text-sm text-[#44403C]">
                {(order.items ?? []).map((item, index) => (
                  <li key={`${item.name}-${item.size}-${index}`} className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="shrink-0 text-[#78716C]">
                      Size {item.size}
                      {item.color ? `, Color: ${item.color}` : ""} &times; {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {order.deliveredAt && (
              <p className="mt-6 border-t border-[#1C1917]/10 pt-4 font-sans text-sm text-[#44403C]">
                Delivered on <strong className="text-[#1C1917]">{formatDate(order.deliveredAt)}</strong>.
              </p>
            )}
          </section>
        )}

        <div className="mt-8 border border-[#1C1917]/10 bg-white p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">Need help?</h2>
          <ul className="mt-3 space-y-2 font-sans text-sm">
            {[
              ["/shipping-policy", "Shipping Policy"],
              ["/returns-refund-policy", "Return & Refund Policy"],
              ["/contact", "Contact us"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 text-[#1C1917] underline decoration-[#CA8A04]/30 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                >
                  <span className="h-1 w-1 rounded-full bg-[#CA8A04]" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-sans text-sm leading-relaxed text-[#44403C]">
            Or email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            with your order number.
          </p>
        </div>

        <Link
          href="/shop"
          className="mt-8 inline-block font-sans text-sm font-semibold text-[#1C1917] underline decoration-[#CA8A04] underline-offset-4 transition-colors duration-200 hover:text-[#CA8A04] cursor-pointer"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
