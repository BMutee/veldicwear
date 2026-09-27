"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { RETURN_REASONS, RETURN_WINDOW_DAYS, SUPPORT_EMAIL, type ReturnWindow } from "@/lib/returns";

/**
 * The customer-facing half of /returns.
 *
 * Three screens in one component because they share the order it just looked
 * up: find the order → choose the lines to send back → reference issued.
 *
 * Everything shown about eligibility comes from the server (evaluateReturnWindow
 * via /api/returns) and is re-checked there on submit, so this file renders the
 * rules in lib/returns.ts instead of keeping a second copy of them.
 *
 * Note there is no Return table: a submitted request notifies the support inbox
 * and a person actioned it, exactly as the Return & Refund Policy promises. The
 * confirmation therefore says "we'll email you instructions" rather than
 * pretending the return is already booked.
 */

type ReturnItem = {
  id: string;
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price: number;
};

type ReturnableOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  items: ReturnItem[];
};

type Step = "search" | "choose" | "done";

// Built once at module scope so the formatted output can't change between renders.
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : DATE_FORMAT.format(date);
}

/** Never let a non-JSON error page break the page's own error handling. */
async function readJson(response: Response): Promise<{
  order?: ReturnableOrder;
  window?: ReturnWindow;
  reference?: string;
  error?: string;
} | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

const LABEL_CLASS =
  "block font-display text-xs font-bold uppercase tracking-[0.14em] text-[#78716C]";
const INPUT_CLASS =
  "mt-2 w-full border border-[#1C1917]/25 bg-transparent px-4 py-3.5 font-sans text-base text-[#1C1917] placeholder:text-[#A8A29E] focus:border-[#CA8A04] focus:outline-none focus:ring-1 focus:ring-[#CA8A04]";
const PRIMARY_BUTTON_CLASS =
  "bg-[#1C1917] px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.16em] text-[#FAFAF9] transition-colors duration-200 hover:bg-[#CA8A04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";
const SECONDARY_BUTTON_CLASS =
  "border border-[#1C1917]/25 px-6 py-3 font-display text-xs font-bold uppercase tracking-[0.14em] text-[#1C1917] transition-colors duration-200 hover:border-[#1C1917] hover:bg-[#1C1917]/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04] cursor-pointer";
const LINK_CLASS =
  "underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer";

export default function ReturnsClient() {
  const [step, setStep] = useState<Step>("search");
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<ReturnableOrder | null>(null);
  const [window_, setWindow] = useState<ReturnWindow | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Which request the screen currently belongs to, so a slow lookup can't
  // overwrite the result of a newer one.
  const latestRequest = useRef<number>(0);
  // Moved to the top of each screen so keyboard and screen-reader users land on
  // the new content rather than on the form they just submitted.
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step !== "search") stepHeadingRef.current?.focus();
  }, [step]);

  const searchOrder = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedNumber = orderNumber.trim();
      const trimmedEmail = email.trim();
      if (!trimmedNumber || !trimmedEmail || searching) return;

      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;
      setSearching(true);
      setError("");

      void (async () => {
        try {
          const params = new URLSearchParams({
            orderNumber: trimmedNumber,
            email: trimmedEmail,
          });
          const response = await fetch(`/api/returns?${params.toString()}`, { method: "GET" });
          if (latestRequest.current !== requestId) return;

          if (response.status === 404) {
            setError("We couldn't find an order with that order number and email. Check both and try again.");
            return;
          }
          if (response.status === 429) {
            setError("Too many lookups. Please try again in a few minutes.");
            return;
          }
          if (!response.ok) {
            setError("We couldn't look up this order right now. Please try again in a moment.");
            return;
          }

          const data = await readJson(response);
          if (latestRequest.current !== requestId) return;
          if (!data?.order || !data.window) {
            setError("We couldn't look up this order right now. Please try again in a moment.");
            return;
          }

          setOrder(data.order);
          setWindow(data.window);
          setSelected([]);
          setReason("");
          setNote("");
          setStep("choose");
        } catch {
          if (latestRequest.current !== requestId) return;
          setError("We couldn't reach us. Check your connection and try again.");
        } finally {
          if (latestRequest.current === requestId) setSearching(false);
        }
      })();
    },
    [email, orderNumber, searching]
  );

  const submitReturn = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!order || submitting) return;

      const requestId = latestRequest.current + 1;
      latestRequest.current = requestId;
      setSubmitting(true);
      setError("");

      void (async () => {
        try {
          const response = await fetch("/api/returns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderNumber: order.orderNumber,
              email,
              itemIds: selected,
              reason,
              note,
            }),
          });
          if (latestRequest.current !== requestId) return;

          const data = await readJson(response);
          if (latestRequest.current !== requestId) return;

          if (response.status === 404) {
            setError("We couldn't find that order any more. Please look it up again.");
            return;
          }
          if (response.status === 429) {
            setError(data?.error ?? "Too many requests. Please try again later.");
            return;
          }
          if (!response.ok || !data?.reference) {
            setError(
              data?.error ?? "We couldn't submit your request right now. Please try again in a moment."
            );
            return;
          }

          setReference(data.reference);
          setStep("done");
        } catch {
          if (latestRequest.current !== requestId) return;
          setError("We couldn't reach us. Check your connection and try again.");
        } finally {
          if (latestRequest.current === requestId) setSubmitting(false);
        }
      })();
    },
    [email, note, order, reason, selected, submitting]
  );

  const startOver = useCallback(() => {
    latestRequest.current += 1;
    setStep("search");
    setOrder(null);
    setWindow(null);
    setError("");
    setSelected([]);
    setReason("");
    setNote("");
    setReference("");
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        {step === "search" && (
          <>
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-display text-5xl font-black tracking-tight text-[#1C1917] outline-none sm:text-6xl"
            >
              Start a return
            </h1>
            <p className="mt-5 max-w-2xl font-sans text-lg leading-relaxed text-[#44403C]">
              {RETURN_WINDOW_DAYS} days from delivery, unworn and tagged, full refund to your original payment
              method. Enter the order to get going.
            </p>

            {error && (
              <div role="alert" className="mt-8 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
                <p className="font-sans text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            <form onSubmit={searchOrder} className="mt-10 grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="return-order-number" className={LABEL_CLASS}>
                  Order number
                </label>
                <input
                  id="return-order-number"
                  name="orderNumber"
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. ORD-1727284800000-1234"
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="return-order-email" className={LABEL_CLASS}>
                  Email on the order
                </label>
                <input
                  id="return-order-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={searching} className={PRIMARY_BUTTON_CLASS}>
                  {searching ? "Finding your order" : "Find my order"}
                </button>
              </div>
            </form>

            <p className="mt-10 max-w-2xl font-sans text-base leading-relaxed text-[#44403C]">
              Arrived damaged, wrong, or faulty? That&rsquo;s on us and not a return: email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
                {SUPPORT_EMAIL}
              </a>{" "}
              with photos and we&rsquo;ll sort it out.
            </p>

            <p className="mt-6 font-sans text-sm text-[#78716C]">
              <Link href="/returns-refund-policy" className={LINK_CLASS}>
                Read the full Return &amp; Refund Policy
              </Link>
              <span className="mx-2 text-[#A8A29E]">&middot;</span>
              <Link href="/track-order" className={LINK_CLASS}>
                Track an order
              </Link>
            </p>
          </>
        )}

        {step === "choose" && order && window_ && (
          <>
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className="font-display text-3xl font-black tracking-tight text-[#1C1917] outline-none sm:text-4xl"
            >
              Which items are going back?
            </h1>
            <p className="mt-3 font-sans text-sm text-[#78716C]">
              Order <strong className="text-[#1C1917]">{order.orderNumber}</strong>
              {window_.referenceDate && <> &middot; delivered {formatDate(window_.referenceDate)}</>}
            </p>

            {error && (
              <div role="alert" className="mt-8 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
                <p className="font-sans text-sm text-[#DC2626]">{error}</p>
              </div>
            )}

            {window_.eligible ? (
              <form onSubmit={submitReturn} className="mt-10">
                <p className="border-l-2 border-[#CA8A04] bg-[#CA8A04]/5 px-4 py-3 font-sans text-sm text-[#44403C]">
                  {window_.daysLeft === 0
                    ? "Last day to return this order — the window closes today."
                    : `You have ${window_.daysLeft} ${window_.daysLeft === 1 ? "day" : "days"} left to return this order${
                        window_.deadline ? ` (window closes ${formatDate(window_.deadline)})` : ""
                      }.`}
                </p>

                <fieldset className="mt-8 border border-[#1C1917]/12 bg-white">
                  <legend className="ml-4 px-2 font-display text-xs font-bold uppercase tracking-[0.14em] text-[#78716C]">
                    Items
                  </legend>
                  <ul className="divide-y divide-[#1C1917]/10">
                    {order.items.map((item) => {
                      const checked = selected.includes(item.id);
                      return (
                        <li key={item.id}>
                          <label
                            htmlFor={`return-item-${item.id}`}
                            className="flex cursor-pointer items-start gap-4 px-4 py-4 transition-colors duration-200 hover:bg-[#1C1917]/[0.03]"
                          >
                            <input
                              id={`return-item-${item.id}`}
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleItem(item.id)}
                              className="mt-1 h-4 w-4 shrink-0 accent-[#1C1917]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-sans text-base font-medium text-[#1C1917]">
                                {item.name}
                              </span>
                              <span className="mt-0.5 block font-sans text-sm text-[#78716C]">
                                Size {item.size}
                                {item.color ? `, Color: ${item.color}` : ""} &times; {item.quantity}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-sm text-[#1C1917]">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2 sm:max-w-sm">
                    <label htmlFor="return-reason" className={LABEL_CLASS}>
                      Reason
                    </label>
                    <select
                      id="return-reason"
                      name="reason"
                      required
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className={`${INPUT_CLASS} appearance-none`}
                    >
                      <option value="">Choose a reason&hellip;</option>
                      {RETURN_REASONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="return-note" className={LABEL_CLASS}>
                      Anything we should know? <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                      id="return-note"
                      name="note"
                      rows={4}
                      maxLength={1000}
                      placeholder="Wrong size sent, would like to swap for a medium…"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      className={`${INPUT_CLASS} resize-y`}
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting || selected.length === 0 || !reason}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    {submitting ? "Sending" : "Request return"}
                  </button>
                  <button type="button" onClick={startOver} className={SECONDARY_BUTTON_CLASS}>
                    Use a different order
                  </button>
                </div>
                <p className="mt-4 font-sans text-sm text-[#78716C]">
                  Please don&rsquo;t post anything back yet &mdash; we email the return address and label once
                  this request reaches us.
                </p>
              </form>
            ) : (
              <div className="mt-10 border border-[#1C1917]/12 bg-white p-6 sm:p-8">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
                  {window_.state === "in-transit" ? "Not open yet" : "Outside the return window"}
                </h2>
                <p className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">
                  {window_.state === "in-transit" ? (
                    <>
                      This order hasn&rsquo;t been delivered yet, so the {RETURN_WINDOW_DAYS}-day window
                      hasn&rsquo;t opened. It starts on the delivery date &mdash; follow the parcel on the{" "}
                      <Link href="/track-order" className={LINK_CLASS}>
                        tracking page
                      </Link>
                      .
                    </>
                  ) : window_.state === "outside-window" ? (
                    <>
                      This order was delivered more than {RETURN_WINDOW_DAYS} days ago, so the return window
                      has closed. If it arrived damaged, faulty or incorrect that&rsquo;s on us and not a
                      return: email{" "}
                      <a href={`mailto:${SUPPORT_EMAIL}`} className={LINK_CLASS}>
                        {SUPPORT_EMAIL}
                      </a>{" "}
                      with photos and we&rsquo;ll put it right.
                    </>
                  ) : (
                    <>This order was cancelled or already refunded, so there&rsquo;s nothing to return.</>
                  )}
                </p>
                <button type="button" onClick={startOver} className={`${SECONDARY_BUTTON_CLASS} mt-6`}>
                  Use a different order
                </button>
              </div>
            )}
          </>
        )}

        {step === "done" && (
          <>
            <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
              Request received
            </p>
            <h1
              ref={stepHeadingRef}
              tabIndex={-1}
              className="mt-2 font-display text-3xl font-black tracking-tight text-[#1C1917] outline-none sm:text-4xl"
            >
              We&rsquo;ve got it
            </h1>
            <p className="mt-4 max-w-2xl font-sans text-base leading-relaxed text-[#44403C]">
              Your reference is{" "}
              <strong className="font-mono text-[#1C1917]">{reference}</strong> &mdash; it&rsquo;s in the email
              we just sent you too, and quoting it reaches the person handling your return.
            </p>

            <ol className="mt-8 max-w-2xl space-y-3 font-sans text-sm text-[#44403C]">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                <span>We email you a return address and a prepaid label.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                <span>
                  You send the items back unworn, with the tags still attached, within {RETURN_WINDOW_DAYS} days
                  of delivery.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                <span>
                  We inspect them and refund to your original payment method, then email you the confirmation.
                </span>
              </li>
            </ol>

            <p className="mt-8 max-w-2xl font-sans text-sm leading-relaxed text-[#78716C]">
              Nothing to do until that email arrives &mdash; please don&rsquo;t post anything back yet. Changed
              your mind? Reply to the email and we&rsquo;ll cancel the request.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/returns-refund-policy" className={SECONDARY_BUTTON_CLASS}>
                Read the return policy
              </Link>
              <button type="button" onClick={startOver} className={SECONDARY_BUTTON_CLASS}>
                Start another return
              </button>
            </div>
          </>
        )}



      </div>
    </main>
  );
}
