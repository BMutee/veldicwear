"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ESTIMATE_REGIONS,
  PACKING_DAYS_MAX,
  PACKING_DAYS_MIN,
  REGION_LABELS,
  getDeliveryEstimate,
  regionFromCountry,
  type EstimateRegion,
} from "@/lib/getDeliveryEstimate";

type Props = {
  /** When the order was (or will be) placed. Defaults to right now. */
  orderDate?: Date;
  /**
   * Destination country as free text ("Canada", "United States") or an ISO-2
   * code. Selects the initially active tab; the customer can switch regions.
   */
  country?: string;
  /** Fixed region (skips the country lookup). */
  region?: EstimateRegion;
  className?: string;
};

// Built once at module scope: creating formatters during render is unnecessary
// work, and date formatting must be deterministic between renders.
const DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export default function DeliveryEstimate({
  orderDate,
  country,
  region,
  className = "",
}: Props) {
  const activeRegion = region ?? regionFromCountry(country);

  // Defaulting to "now" must not happen during render: the server and the
  // client would compute different dates on the hydration pass. `undefined`
  // until the effect runs keeps the first render deterministic on both sides.
  // The update is deferred through a timeout (the same pattern the cart page
  // uses for its initial load) so no state is set synchronously in the effect.
  const [clientNow, setClientNow] = useState<number | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<EstimateRegion>(activeRegion);

  useEffect(() => {
    if (orderDate !== undefined) return;
    const timer = window.setTimeout(() => setClientNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [orderDate]);

  // Re-sync when the caller's destination changes (e.g. the confirmation page
  // resolving its order). Deferred via timeout so the effect never sets state
  // synchronously in its body.
  useEffect(() => {
    const timer = window.setTimeout(() => setSelectedRegion(activeRegion), 0);
    return () => window.clearTimeout(timer);
  }, [activeRegion]);

  // `orderDate.getTime()` keeps the dependency stable across equal Date objects.
  const orderDateMs = orderDate?.getTime() ?? clientNow;

  const stages = useMemo(() => {
    // Before the client clock resolves there are no dates to add. The copy
    // below is identical either way, so hydration always matches.
    const estimate =
      orderDateMs === undefined
        ? null
        : getDeliveryEstimate(new Date(orderDateMs), selectedRegion);

    const arrivalWindow = estimate
      ? `${DAY_FORMAT.format(estimate.arrivalMin)} – ${DAY_FORMAT.format(
          estimate.arrivalMax,
        )}`
      : "– –";

    return [
      {
        key: "ordered",
        title: "Ordered",
        detail: "Today",
      },
      {
        key: "packed",
        title: "Packed & shipped",
        detail: `${PACKING_DAYS_MIN}–${PACKING_DAYS_MAX} days`,
      },
      {
        key: "home",
        title: "Home",
        detail: arrivalWindow,
      },
    ];
  }, [orderDateMs, selectedRegion]);

  const headline = stages[2].detail;

  return (
    <div
      className={`border border-stone/10 bg-white p-5 shadow-card rounded-lg ${className}`}
    >
      <p className="eyebrow">Estimated arrival</p>

      {/* Region tabs */}
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Shipping destination">
        {ESTIMATE_REGIONS.map((regionKey) => {
          const isActive = regionKey === selectedRegion;
          return (
            <button
              key={regionKey}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedRegion(regionKey)}
              className={`px-3.5 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
                isActive
                  ? "border border-ink bg-ink text-white"
                  : "border border-stone/20 bg-transparent text-ink hover:border-ink"
              }`}
            >
              {REGION_LABELS[regionKey]}
            </button>
          );
        })}
      </div>

      {/* Headline window */}
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">
        {headline}
        <span className="ml-2 align-middle font-sans text-xs font-medium uppercase tracking-wide text-stone">
          est.
        </span>
      </p>

      {/* Staged timeline */}
      <ol className="mt-5 grid grid-cols-3 gap-3">
        {stages.map((stage) => (
          <li key={stage.key} className="min-w-0">
            <span
              className={`block h-1 w-full ${stage.key === "ordered" ? "bg-ink" : "bg-stone/20"}`}
              aria-hidden="true"
            />
            <span className="mt-2.5 block font-display text-xs font-bold uppercase tracking-wide text-ink">
              {stage.title}
            </span>
            <span className="mt-1 block font-sans text-xs leading-relaxed text-stone">
              {stage.detail}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-stone/10 pt-3 font-sans text-xs leading-relaxed text-stone">
        Ships from Canada in {PACKING_DAYS_MIN}–{PACKING_DAYS_MAX} days.
        Arrival is the carrier&apos;s estimate and can move a day or two. Tracking
        lands in your inbox the moment it ships.
      </p>
    </div>
  );
}