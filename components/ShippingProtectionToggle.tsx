"use client";

import { SHIPPING_PROTECTION_PRICE, SHIPPING_PROTECTION_DESCRIPTION } from "@/lib/shipping-protection";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ShippingProtectionToggle({ checked, onChange }: Props) {
  return (
    <div className="border-t border-stone/10 pt-4">
      <label className="flex cursor-pointer items-start gap-3 group">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-5 w-5 border border-stone/40 bg-white transition-colors duration-150 peer-checked:border-moss peer-checked:bg-moss peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-moss" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="pointer-events-none absolute inset-0 h-5 w-5 text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-ink">
            Shipping protection{" "}
            <span className="font-semibold text-moss">— {money.format(SHIPPING_PROTECTION_PRICE)}</span>
          </p>
          <p className="mt-1 font-sans text-xs leading-relaxed text-stone">
            {SHIPPING_PROTECTION_DESCRIPTION}
          </p>
        </div>
      </label>
    </div>
  );
}