"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCY_INFO,
  SUPPORTED_CURRENCIES,
  disclaimerForCurrency,
  type SupportedCurrency,
} from "@/lib/currency-map";

/**
 * Navbar currency icon + dropdown.
 *
 * A globe icon button (styled to match the cart/account icons: bone -> bone on
 * hover, 20px stroke icon) opens a dropdown of USD/CAD/EUR. Selecting one
 * persists a MANUAL preference via POST /api/currency (writes
 * currency_source=manual) and refreshes the page so the new currency is
 * reflected server-side.
 *
 * The disclaimer is BRANCHED PER CURRENCY (checkout phase): EUR shows the
 * estimate notice (checkout completes in USD); CAD is a real charge currency
 * so it prints no charge disclaimer; USD prints nothing. Origin-independent.
 */
export default function CurrencyPicker({
  initialCurrency,
  variant = "icon",
}: {
  initialCurrency?: string;
  variant?: "icon" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<SupportedCurrency>(() =>
    SUPPORTED_CURRENCIES.includes(
      (initialCurrency ?? "") as SupportedCurrency
    )
      ? (initialCurrency as SupportedCurrency)
      : "USD",
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = async (code: SupportedCurrency) => {
    if (code === currency) {
      setOpen(false);
      return;
    }
    try {
      await fetch("/api/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: code }),
      });
    } catch {
      // Persisting failed silently — keep the local selection anyway so the UI
      // is never broken by a transient network issue.
    }
    setCurrency(code);
    setOpen(false);
    // new currency reflects server-side after router.refresh() re-renders the
    // layout, which republishes <html data-currency/...> from the cookie.
    window.dispatchEvent(new CustomEvent("currency:changed", { detail: code }));
    router.refresh();
  };

  const info = CURRENCY_INFO[currency];

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          variant === "mobile"
            ? "flex items-center gap-3 font-sans text-sm text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
            : "relative flex items-center text-bone/80 transition-colors duration-150 hover:text-bone cursor-pointer"
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change currency (current: ${info.label})`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {variant === "mobile" && (
          <span>
            Currency <span className="font-mono text-xs text-stone">{info.code}</span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Currency"
          className={`absolute z-50 mt-2 w-56 rounded-lg border border-stone/20 bg-white p-1 shadow-[0_4px_12px_rgba(23,21,18,0.12)] ${
            variant === "mobile" ? "left-0" : "right-0"
          }`}
        >
          <p className="px-3 pb-1 pt-2 font-mono text-[10px] font-medium uppercase tracking-wide text-stone">
            Currency
          </p>
          {SUPPORTED_CURRENCIES.map((codeOption) => {
            const option = CURRENCY_INFO[codeOption];
            const selected = codeOption === currency;
            return (
              <button
                key={codeOption}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(codeOption)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 cursor-pointer ${
                  selected ? "bg-moss/10 text-ink" : "text-ink hover:bg-moss/5"
                }`}
              >
                <span className="font-mono text-xs text-stone">
                  {option.symbol}
                </span>
                <span className="font-medium">{option.label}</span>
                <span className="ml-auto text-xs text-stone">{option.name}</span>
                {selected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-4 w-4 text-moss"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
          {disclaimerForCurrency(currency) && (
            <p className="mt-1 border-t border-stone/10 px-3 py-2 text-xs leading-relaxed text-stone">
              {disclaimerForCurrency(currency)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}