"use client";

import { useRouter } from "next/navigation";
import { CartItem } from "@/lib/cart";
import CouponInput from "./CouponInput";
import ShippingProtectionToggle from "./ShippingProtectionToggle";
import { SHIPPING_PROTECTION_PRICE } from "@/lib/shipping-protection";
import { useViewerCurrency } from "@/lib/use-viewer-currency";
import { EUR_ESTIMATE_DISCLAIMER } from "@/lib/currency-map";

type OrderSummaryProps = {
  cart: CartItem[];
  subtotal: number;
  onPlaceOrder: () => void;
  loading: boolean;
  disabled: boolean;
  couponCode: string;
  discountAmount: number;
  onCouponApply: (amount: number, code: string) => void;
  onCouponRemove: () => void;
  hasShippingProtection: boolean;
  onShippingProtectionChange: (checked: boolean) => void;
};

export default function OrderSummary({
  cart,
  subtotal,
  onPlaceOrder,
  loading,
  disabled,
  couponCode,
  discountAmount,
  onCouponApply,
  onCouponRemove,
  hasShippingProtection,
  onShippingProtectionChange,
}: OrderSummaryProps) {
  const router = useRouter();
  // Display conversion in the visitor's browsing currency (same rounding as
  // the checkout charge — displayed == charged).
  const vc = useViewerCurrency();
  const money = { format: (usd: number) => vc.fmt(vc.toDisplay(usd)) };
  const protectionCost = hasShippingProtection ? SHIPPING_PROTECTION_PRICE : 0;
  const total = subtotal - discountAmount + protectionCost;

  return (
    <aside className="sticky top-24 border border-stone/10 bg-white shadow-card rounded-lg">
      <div className="p-6">
        <h2 className="font-display text-lg font-semibold text-ink tracking-tight">
          Order summary
        </h2>

        {/* Cart items */}
        <div className="mt-6 space-y-4">
          {cart.map((item) => (
            <div key={`${item.id}-${item.size}`} className="flex items-start gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-stone/10 bg-white shadow-card rounded-lg">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-medium text-ink">
                  {item.name}
                </p>
                <p className="mt-0.5 font-sans text-xs text-stone">
                  Size: {item.size} × {item.quantity}
                </p>
                <p className="mt-1 font-mono text-sm text-ink">
                  {money.format(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 space-y-2 border-t border-stone/10 pt-4">
          <div className="flex items-center justify-between font-sans text-sm text-stone">
            <span>Subtotal</span>
            <span>{money.format(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between font-sans text-sm text-moss">
              <span>Discount ({couponCode})</span>
              <span>-{money.format(discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between font-sans text-sm text-stone">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex items-center justify-between border-t border-stone/10 pt-2 font-display text-base font-semibold text-ink">
            <span>Total</span>
            <span>{money.format(total)}</span>
          </div>
          {vc.currency === "EUR" && (
            <p className="mt-2 font-sans text-xs leading-relaxed text-stone">
              {EUR_ESTIMATE_DISCLAIMER}
            </p>
          )}
        </div>

        <ShippingProtectionToggle
          checked={hasShippingProtection}
          onChange={onShippingProtectionChange}
        />

        <CouponInput
          subtotal={subtotal}
          appliedCode={couponCode}
          discountAmount={discountAmount}
          onApply={onCouponApply}
          onRemove={onCouponRemove}
        />

        <button
          onClick={onPlaceOrder}
          disabled={disabled || loading}
          className={`mt-6 w-full py-3.5 font-sans text-sm font-medium uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
            disabled || loading
              ? "cursor-not-allowed bg-stone/5 text-stone"
              : "bg-moss text-white hover:bg-moss-hover"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Processing...
            </span>
          ) : (
            "Place order"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="mt-3 w-full border border-stone/20 py-2.5 font-sans text-xs font-medium uppercase tracking-wide text-ink transition-colors duration-150 hover:border-moss hover:text-moss cursor-pointer"
        >
          Back to cart
        </button>
      </div>
    </aside>
  );
}