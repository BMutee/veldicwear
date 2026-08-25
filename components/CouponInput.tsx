"use client";

import { useState } from "react";
import { useViewerCurrency } from "@/lib/use-viewer-currency";

type Props = {
  subtotal: number;
  onApply: (discountAmount: number, code: string) => void;
  onRemove: () => void;
  appliedCode: string;
  discountAmount: number;
};

export default function CouponInput({ subtotal, onApply, onRemove, appliedCode, discountAmount }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Discount display in the browsing currency (same rounding as checkout).
  const vc = useViewerCurrency();
  const money = { format: (usd: number) => vc.fmt(vc.toDisplay(usd)) };

  const handleApply = async () => {
    if (loading || !code.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid coupon.");
        return;
      }

      onApply(data.discountAmount, data.code);
      setCode("");
    } catch {
      setError("Unable to validate coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="space-y-2 border-t border-stone/10 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone">Discount ({appliedCode})</span>
          <span className="font-semibold text-moss">-{money.format(discountAmount)}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs font-medium text-clay underline decoration-clay/40 underline-offset-2 transition-colors duration-150 hover:decoration-clay cursor-pointer"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-stone/10 pt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApply(); } }}
          placeholder="Coupon code"
className="flex-1 border border-stone/20 bg-white px-3 py-2 font-sans text-sm text-ink outline-none transition-colors duration-150 placeholder:text-stone focus:border-moss"
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className={`px-4 py-2 font-sans text-xs font-medium uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
            loading || !code.trim()
              ? "cursor-not-allowed bg-stone/5 text-stone"
              : "bg-moss text-white hover:bg-moss-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
          }`}
        >
          {loading ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1 font-sans text-xs text-clay">{error}</p>}
    </div>
  );
}