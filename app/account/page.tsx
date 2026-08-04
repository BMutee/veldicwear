"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  hasShippingProtection: boolean;
  items: {
    id: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
  }[];
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? []);
        }
      } catch {
        // silently fail — orders section will show empty state
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FAFAF9]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex items-center justify-center py-20">
            <p className="font-sans text-sm text-[#78716C]">Loading…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Profile */}
        <section className="border border-[#1C1917]/10 bg-white p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black uppercase tracking-tight text-[#1C1917] sm:text-4xl">
                My Account
              </h1>
              <div className="mt-4 space-y-1 font-sans text-sm text-[#1C1917]">
                <p>
                  <span className="text-[#78716C]">Name: </span>
                  {user.firstName} {user.lastName}
                </p>
                <p>
                  <span className="text-[#78716C]">Email: </span>
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-[#1C1917]/20 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-[0.14em] text-[#1C1917] transition-colors duration-200 hover:border-[#B91C1C] hover:text-[#B91C1C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#CA8A04] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </section>

        {/* Order History */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
            Order History
          </h2>

          {ordersLoading ? (
            <div className="mt-6 flex items-center justify-center py-12 border border-[#1C1917]/10 bg-white">
              <p className="font-sans text-sm text-[#78716C]">Loading orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="mt-6 flex flex-col items-center border border-[#1C1917]/10 bg-white px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1C1917]/20 bg-[#1C1917]/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6 text-[#78716C]">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-[#1C1917]">
                No orders yet
              </p>
              <p className="mt-2 max-w-sm font-sans text-sm leading-6 text-[#78716C]">
                When you place an order, it will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-[#1C1917]/10 bg-white p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-bold uppercase tracking-tight text-[#1C1917]">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-[#78716C]">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded px-2.5 py-0.5 font-display text-xs font-bold uppercase tracking-wider ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Paid"
                              ? "bg-[#CA8A04]/10 text-[#CA8A04]"
                              : "bg-[#1C1917]/5 text-[#78716C]"
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.hasShippingProtection && (
                        <p className="mt-0.5 font-sans text-xs text-[#78716C]">
                          Shipping Protection included
                        </p>
                      )}
                      <p className="mt-1 font-display text-lg font-black text-[#1C1917]">
                        {money.format(order.total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 divide-y divide-[#1C1917]/5 border-t border-[#1C1917]/10 pt-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-sans font-medium text-[#1C1917] truncate">
                            {item.name}
                          </p>
                          <p className="font-sans text-xs text-[#78716C]">
                            Size {item.size} &times; {item.quantity}
                          </p>
                        </div>
                        <p className="font-sans font-semibold text-[#1C1917]">
                          {money.format(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}