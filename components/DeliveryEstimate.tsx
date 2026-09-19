"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PROCESSING_DAYS_IN_STOCK,
  PROCESSING_DAYS_SOURCED_MAX,
  SHIPPING_DAYS_MAX,
  getDeliveryEstimate,
  getEstimateForItems,
} from "@/lib/getDeliveryEstimate";

type EstimateItem = { sourcingRequired?: boolean };

type Props = {
  /** When the order was (or will be) placed. Defaults to right now. */
  orderDate?: Date;
  /** Single-item status (e.g. the product page). */
  sourcingRequired?: boolean;
  /**
   * Whole cart / order status. When provided this wins over `sourcingRequired`
   * and the slowest item's status drives the estimate, because a shared order
   * ships together (see `getEstimateForItems`).
   */
  items?: EstimateItem[];
  className?: string;
};

const GLYPH_SIZE = 12;

// Built once at module scope: creating formatters during render is unnecessary
// work, and date formatting must be deterministic between renders.
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function TruckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={GLYPH_SIZE}
      height={GLYPH_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
    </svg>
  );
}

export default function DeliveryEstimate({
  orderDate,
  sourcingRequired,
  items,
  className = "",
}: Props) {
  // Defaulting to "now" must not happen during render: the server and the
  // client would compute different dates on the hydration pass. `undefined`
  // until the effect runs keeps the first render deterministic on both sides.
  // The update is deferred through a timeout (the same pattern the cart page
  // uses for its initial load) so no state is set synchronously in the effect.
  const [clientNow, setClientNow] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (orderDate !== undefined) return;
    const timer = window.setTimeout(() => setClientNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [orderDate]);

  // `orderDate.getTime()` keeps the dependency stable across equal Date objects.
  const orderDateMs = orderDate?.getTime() ?? clientNow;
  const stages = useMemo(() => {
    // Missing flags fall back to "needs sourcing" so a partial payload can only
    // ever make the estimate more conservative, never over-promise.
    const scopedItems = items?.map((item) => ({
      sourcingRequired: item.sourcingRequired ?? true,
    }));

    // Before the client clock resolves there are no dates to add. The copy
    // below is identical either way, so hydration always matches.
    const estimate =
      orderDateMs === undefined
        ? null
        : scopedItems && scopedItems.length > 0
          ? getEstimateForItems(scopedItems, new Date(orderDateMs))
          : getDeliveryEstimate(new Date(orderDateMs), sourcingRequired ?? true);

    const readyBy = estimate
      ? ` — ready by ${DAY_FORMAT.format(estimate.preparedByMax)}`
      : "";
    const arrivalWindow = estimate
      ? ` — around ${DAY_FORMAT.format(estimate.arrivalMin)}–${DAY_FORMAT.format(
          estimate.arrivalMax,
        )}`
      : "";

    return [
      {
        key: "received",
        glyph: <CheckGlyph />,
        title: "Order received",
        detail: "today",
        complete: true,
      },
      {
        key: "preparing",
        glyph: <ClockGlyph />,
        title: "Preparing your order",
        detail: `usually ${PROCESSING_DAYS_IN_STOCK} days, up to ${PROCESSING_DAYS_SOURCED_MAX} for made-to-order items${readyBy}`,
        complete: false,
      },
      {
        key: "shipping",
        glyph: <TruckGlyph />,
        title: "On its way",
        detail: `tracked shipping, most orders arrive within ${SHIPPING_DAYS_MAX} days${arrivalWindow}`,
        complete: false,
      },
    ];
  }, [orderDateMs, sourcingRequired, items]);

  return (
    <div
      className={`border border-stone/10 bg-white p-5 shadow-card rounded-lg ${className}`}
    >
      <p className="eyebrow">Delivery estimate</p>

      <ol className="mt-4 space-y-3">
        {stages.map((stage) => (
          <li key={stage.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                stage.complete
                  ? "bg-moss text-white"
                  : "border border-stone/20 text-stone"
              }`}
            >
              {stage.glyph}
            </span>
            <span className="min-w-0">
              <span className="block font-sans text-sm font-medium text-ink">
                {stage.title}
              </span>
              <span className="block font-sans text-xs leading-relaxed text-stone">
                {stage.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-stone/10 pt-3 font-sans text-xs leading-relaxed text-stone">
        You&apos;ll get tracking by email the moment it ships. Rare delays from
        customs or weather aren&apos;t included above.
      </p>
    </div>
  );
}