"use client";

import { useEffect, useState } from "react";
import { convertPrice } from "@/lib/exchange-rates";

/**
 * Client-side viewer-currency context for cart / checkout display.
 *
 * Fetches GET /api/currency/context once and exposes:
 *   - currency      : the browsing currency ("USD" | "CAD" | "EUR")
 *   - chargeCurrency: what checkout will actually charge ("USD" | "CAD");
 *                     EUR shoppers see "USD" here (display-only decision).
 *   - rate          : USD->currency display multiplier (null = stale ->
 *                     fall back to USD rendering).
 *   - fmt(n)        : Intl formatter for the DISPLAY currency.
 *   - toDisplay(usd): convert a USD price into a display amount using the
 *                     SAME convertPrice()/whole-unit rounding used at
 *                     checkout, so displayed == charged for CAD.
 */
export interface ViewerCurrency {
  currency: "USD" | "CAD" | "EUR";
  chargeCurrency: "USD" | "CAD";
  rate: number;
  fallbackToUsd: boolean;
  notice: string | null;
  loaded: boolean;
  fmt: (n: number) => string;
  toDisplay: (usdPrice: number) => number;
}

export function useViewerCurrency(): ViewerCurrency {
  const [state, setState] = useState({
    currency: "USD" as "USD" | "CAD" | "EUR",
    chargeCurrency: "USD" as "USD" | "CAD",
    rate: 1,
    fallbackToUsd: false,
    notice: null as string | null,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/currency/context", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setState({
          currency: ["USD", "CAD", "EUR"].includes(data.displayCurrency)
            ? data.displayCurrency
            : "USD",
          chargeCurrency: data.chargeCurrency === "CAD" ? "CAD" : "USD",
          // Stale/missing rate -> render plain USD rather than broken prices.
          rate:
            typeof data.rate === "number" && data.rate > 0 ? data.rate : 1,
          fallbackToUsd: !!data.fallbackToUsd,
          notice: data.notice ?? null,
          loaded: true,
        });
      })
      .catch(() => {
        if (!cancelled)
          setState((s) => ({ ...s, loaded: true })); // stay USD on failure
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: state.rate === 1 && state.chargeCurrency === "USD"
      ? "USD"
      : state.currency,
  });

  return {
    ...state,
    fmt: (n: number) => fmt.format(n),
    toDisplay: (usdPrice: number) =>
      state.rate === 1 ? usdPrice : convertPrice(usdPrice, state.rate),
  };
}
