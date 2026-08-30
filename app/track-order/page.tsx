"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TrackingOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  // Must match /api/orders/track, which selects the Order.items relation.
  items: { name: string; size: string; quantity: number }[];
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#FAFAF9]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="font-sans text-sm text-[#78716C]">Loading...</p>
        </div>
      </main>
    }>
      <TrackOrderPageInner />
    </Suspense>
  );
}

function TrackOrderPageInner() {
  const token = useSearchParams().get("token");
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }
    (async () => {
      try {
        const response = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setOrder(data.order);
      } catch {
        setError("This tracking link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">Track Order</h1>
        {loading && <p className="mt-6 font-sans text-sm text-[#78716C]">Loading your order…</p>}
        {(error || !token) && <p className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4 font-sans text-sm text-[#DC2626]">{error || "Use the tracking link from your order confirmation email."}</p>}
        {order && <section className="mt-8 border border-[#1C1917]/10 bg-white p-6">
          <p className="font-display text-xl font-bold text-[#1C1917]">{order.orderNumber}</p>
          <p className="mt-2 font-sans text-sm text-[#44403C]">Status: <strong>{order.status}</strong></p>
          <p className="mt-1 font-sans text-sm text-[#44403C]">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
          {order.deliveredAt && <p className="mt-1 font-sans text-sm text-[#44403C]">Delivered {new Date(order.deliveredAt).toLocaleDateString()}</p>}
          <h2 className="mt-6 font-display text-sm font-bold uppercase text-[#1C1917]">Items</h2>
          <ul className="mt-3 space-y-2 font-sans text-sm text-[#44403C]">{(order.items ?? []).map((item, index) => <li key={`${item.name}-${item.size}-${index}`}>{item.quantity} × {item.name} ({item.size})</li>)}</ul>
        </section>}
        <Link href="/shop" className="mt-8 inline-block font-sans text-sm font-semibold text-[#1C1917] underline decoration-[#CA8A04] underline-offset-4">Continue shopping</Link>
      </div>
    </main>
  );
}
