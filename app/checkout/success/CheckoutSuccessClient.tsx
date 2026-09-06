"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearCart } from "@/lib/cart";

type OrderItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderData = {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  total: number;
  status: string;
  hasShippingProtection: boolean;
  items: OrderItem[];
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const missingSessionId = !sessionId;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!missingSessionId);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<boolean | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Unable to confirm order.");
          setLoading(false);
          return;
        }

        if (data.order) {
          setOrder(data.order);
          clearCart(); // Clear the cart after successful order confirmation
        }
        setTrackingToken(typeof data.trackingToken === "string" ? data.trackingToken : null);
        setSent(data.sent ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete confirmation.");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F3F7FC]">
        <div className="flex items-center justify-center py-32">
          <p className="font-sans text-sm text-[#5B6B85]">Confirming your order…</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#F3F7FC]">
        <div className="mx-auto max-w-lg px-4 py-24">
          <div className="border border-[#DC2626]/30 bg-[#DC2626]/5 p-8 text-center">
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-[#DC2626]">
              Order Confirmation Failed
            </h1>
            <p className="mt-3 font-sans text-sm text-[#44403C]">{error || (missingSessionId ? "No checkout session ID was provided." : "Something went wrong.")}</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 bg-[#1B2737] px-6 py-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#F3F7FC] transition-colors duration-200 hover:bg-[#2563EB] cursor-pointer"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = order.total;
  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F3F7FC]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Success header */}
        <div className="border-b border-[#1B2737]/15 pb-8 text-center sm:text-left">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-600/20 bg-green-50 sm:mx-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-green-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-[#1B2737] sm:text-4xl">
            Order Confirmed
          </h1>
          <p className="mt-2 font-sans text-sm text-[#5B6B85]">
            Thank you for your order!{sent === true ? ` A confirmation email has been sent to ${order.email}.` : sent === false ? ` A confirmation email could not be sent to ${order.email}, but your order is still confirmed.` : ""}
          </p>
        </div>

        {/* Order summary card */}
        <div className="mt-8 border border-[#1B2737]/10 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#2563EB]">
                Order Number
              </p>
              <p className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-[#1B2737]">
                {order.orderNumber}
              </p>
            </div>
            <p className="font-sans text-sm text-[#5B6B85]">
              Placed on <span className="font-semibold text-[#1B2737]">{orderDate}</span>
            </p>
          </div>

          {/* Items */}
          <div className="mt-6 divide-y divide-[#1B2737]/10 border-t border-[#1B2737]/10">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-sans font-medium text-[#1B2737] truncate">{item.name}</p>
                  <p className="mt-0.5 font-sans text-xs text-[#5B6B85]">
                    Size: {item.size} &times; {item.quantity}
                  </p>
                </div>
                <p className="ml-4 font-sans font-semibold text-[#1B2737]">
                  {money.format(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-[#1B2737]/10 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[#5B6B85]">Subtotal</span>
              <span className="text-[#1B2737]">{money.format(subtotal)}</span>
            </div>
            {order.hasShippingProtection && (
              <div className="flex justify-between">
                <span className="text-[#5B6B85]">Shipping Protection</span>
                <span className="text-[#1B2737]">$0.99</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#1B2737]/10 pt-2 font-display text-lg font-bold">
              <span className="text-[#1B2737]">Total</span>
              <span className="text-[#1B2737]">{money.format(total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="mt-6 border border-[#1B2737]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1B2737]">
            Shipping Address
          </h2>
          <div className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">
            <p className="font-semibold text-[#1B2737]">{order.firstName} {order.lastName}</p>
            <p>{order.address}</p>
            <p>{order.city}, {order.country} {order.postalCode}</p>
            <p className="mt-1 text-[#5B6B85]">{order.email} &middot; {order.phone}</p>
          </div>
        </div>

        {/* Delivery estimate */}
        <div className="mt-6 border border-[#2563EB]/20 bg-[#2563EB]/5 p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1B2737]">
            Estimated Delivery
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">
            Your order is being prepped. Here is the estimated timeline:
          </p>
          <ul className="mt-3 space-y-1 font-sans text-sm text-[#44403C]">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <strong className="text-[#1B2737]">Processing & quality check:</strong> 1–4 business days
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <strong className="text-[#1B2737]">In transit:</strong> 4–11 business days
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              <strong className="text-[#1B2737]">Total delivery window:</strong> 7–15 business days
            </li>
          </ul>
          <p className="mt-3 font-sans text-xs text-[#5B6B85]">
            These are estimates, not guarantees. Carrier delays or customs clearance may extend the window.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
          <Link
            href={trackingToken ? `/track-order?token=${encodeURIComponent(trackingToken)}` : "/track-order"}
            className="inline-flex items-center gap-2 bg-[#1B2737] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#F3F7FC] transition-colors duration-200 hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Track Order
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-[#1B2737]/30 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-[#1B2737] transition-colors duration-200 hover:border-[#2563EB] hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
