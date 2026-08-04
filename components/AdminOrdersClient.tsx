"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type OrderSummary = {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  total: number;
  status: string;
  hasShippingProtection: boolean;
  cjFulfillmentStatus: string | null;
  createdAt: string;
  _count: { items: number };
};

const STATUS_OPTIONS = ["all", "Ordered", "Processing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS: Record<string, string> = {
  Ordered: "bg-blue-50 text-blue-700",
  Paid: "bg-moss/5 text-green-700",
  Processing: "bg-yellow-50 text-yellow-700",
  Shipped: "bg-indigo-50 text-indigo-700",
  Delivered: "bg-green-100 text-moss",
  Cancelled: "bg-clay/5 text-red-700",
};

const CJ_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  ready_to_pay: "bg-orange-50 text-orange-700",
  sent: "bg-moss/5 text-green-700",
  failed: "bg-clay/5 text-red-700",
};

const CJ_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ready_to_pay: "Ready to Pay",
  sent: "Sent to Supplier",
  failed: "Failed - Needs Attention",
};

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    fetch(`/api/admin/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [statusFilter, debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">Orders</h1>
          <p className="text-stone mt-1 font-body text-sm">{orders.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email or order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone/20 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-stone outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                statusFilter === s
                  ? "bg-ink text-white"
                  : "bg-white border border-stone/20 text-stone hover:bg-white"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-stone font-body">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-stone font-body">
              {debouncedSearch || statusFilter !== "all" ? "No orders match your filters." : "No orders yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone/20 bg-white">
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">CJ Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Items</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Protection</th>
                  <th className="text-right px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 font-medium text-ink font-body">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink font-body">{order.firstName} {order.lastName}</p>
                      <p className="text-xs text-stone font-body">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-stone font-body text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-700"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.cjFulfillmentStatus ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CJ_STATUS_COLORS[order.cjFulfillmentStatus] || "bg-gray-50 text-gray-700"}`}>
                          {CJ_STATUS_LABELS[order.cjFulfillmentStatus] || order.cjFulfillmentStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-stone">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink font-body">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-stone font-body">
                      {order._count.items}
                    </td>
                    <td className="px-4 py-3">
                      {order.hasShippingProtection ? (
                        <span className="text-xs text-moss font-medium">Yes</span>
                      ) : (
                        <span className="text-xs text-stone">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="cursor-pointer inline-flex items-center rounded-lg border border-stone/20 bg-white px-3 py-1.5 text-xs font-medium text-stone transition hover:bg-white hover:border-clay focus:outline-none focus:ring-2 focus:ring-ink/20"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}