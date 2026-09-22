/**
 * Delivery-estimate math for Veldic Wear fulfillment (ships from Canada).
 *
 * EVERY window below is in CALENDAR days — weekends included, no business-day
 * skipping anywhere. That is deliberate and matches the carrier's quotes:
 *   - Packing ("Packed & shipped") ... 2–5 calendar days, identical for every
 *     destination.
 *   - Fastest transit ................ 4 / 5 / 7 calendar days once packed, per
 *     destination region (CA / US / Elsewhere).
 *   - Total door-to-door cap ......... 12 / 17 / 19 calendar days from the order
 *     date, per region. This is the hard worst case.
 *
 * So arrivalMin = fastest packing + fastest transit, and arrivalMax = order
 * date + the regional cap — the headline range can never promise beyond 12 /
 * 17 / 19 days, exactly as specified.
 *
 * `regionFromCountry()` bridges the free-text country collected at checkout
 * ("Canada", "United States", …) onto those three regions, reusing the same
 * resolver the CJ fulfillment code uses.
 */

import { toIso2CountryCode } from "@/lib/country-codes";

export const PACKING_DAYS_MIN = 2;
export const PACKING_DAYS_MAX = 5;

export type EstimateRegion = "CA" | "US" | "ELSEWHERE";

export const ESTIMATE_REGIONS: readonly EstimateRegion[] = [
  "CA",
  "US",
  "ELSEWHERE",
];

/**
 * Hard cap on the total door-to-door window (packing + transit), in calendar
 * days from the order date. Per destination region.
 */
export const TOTAL_DAYS_MAX: Record<EstimateRegion, number> = {
  CA: 12,
  US: 17,
  ELSEWHERE: 19,
};

/** Fastest transit (calendar days) once the order is packed. */
export const TRANSIT_DAYS_MIN: Record<EstimateRegion, number> = {
  CA: 4,
  US: 5,
  ELSEWHERE: 7,
};

export const REGION_LABELS: Record<EstimateRegion, string> = {
  CA: "Canada",
  US: "US",
  ELSEWHERE: "Elsewhere",
};

export type DeliveryEstimate = {
  /** Earliest the order can be packed and handed to the carrier. */
  packedByMin: Date;
  /** Latest the order can be packed and handed to the carrier. */
  packedByMax: Date;
  /** Earliest possible arrival at the customer. */
  arrivalMin: Date;
  /** Latest expected arrival (order date + regional cap). */
  arrivalMax: Date;
};

/** Add whole calendar days while keeping the time of day. Weekends included. */
function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Map a free-text country (or ISO-2 code) onto an estimate region. Falls back
 * to ELSEWHERE, the conservative default, for anything unresolvable.
 */
export function regionFromCountry(value: string | null | undefined): EstimateRegion {
  const iso2 = toIso2CountryCode(value);
  if (iso2 === "CA") return "CA";
  if (iso2 === "US") return "US";
  return "ELSEWHERE";
}

/**
 * Estimate the packing and arrival windows for a destination region.
 *
 * Best case: fastest packing (2 calendar days) + fastest transit. Worst case:
 * the regional door-to-door cap (12 / 17 / 19 calendar days), applied directly
 * to the order date so the headline can never over-promise.
 */
export function getDeliveryEstimate(
  orderDate: Date,
  region: EstimateRegion,
): DeliveryEstimate {
  const packedByMin = addCalendarDays(orderDate, PACKING_DAYS_MIN);
  const packedByMax = addCalendarDays(orderDate, PACKING_DAYS_MAX);

  return {
    packedByMin,
    packedByMax,
    // Best case: fastest packing + fastest transit.
    arrivalMin: addCalendarDays(
      packedByMin,
      TRANSIT_DAYS_MIN[region],
    ),
    // Worst case: the regional door-to-door cap, straight from the order date.
    arrivalMax: addCalendarDays(orderDate, TOTAL_DAYS_MAX[region]),
  };
}