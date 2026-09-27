"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type OrderItem = {
  id: string;
  name: string;
  size: string;
  color: string | null;
  quantity: number;
  price: number;
  costPrice: number | null;
};

type Order = {
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
  paymentMethod: string;
  total: number;
  status: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  hasShippingProtection: boolean;
  stripeSessionId: string | null;
  cjFulfillmentStatus: string | null;
  cjOrderId: string | null;
  cjCartReference: string | null;
  createdAt: string;
  deliveredAt: string | null;
  OrderItem: OrderItem[];
};

const VALID_STATUSES = ["Ordered", "Processing", "Shipped", "Delivered", "Cancelled"];

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

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cjActionLoading, setCjActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setOrder(data);
        setNewStatus(data.status);
        setTrackingNumber(data.trackingNumber || "");
        setTrackingCarrier(data.trackingCarrier || "");
      })
      .catch(() => router.push("/admin/orders"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber.trim() || null,
          trackingCarrier: trackingCarrier.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.details ? data.details : [data.error || "Failed to update."]);
        setSaving(false);
        return;
      }

      setOrder(data);
      setSuccessMsg("Order updated successfully.");
      setSaving(false);
    } catch {
      setErrors(["Network error."]);
      setSaving(false);
    }
  };

  const handleCjPay = async () => {
    setCjActionLoading(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/admin/orders/${params.id}/cj-pay`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors([data.error || "CJ payment failed."]);
      } else {
        setSuccessMsg("CJ payment completed. Order sent to supplier.");
        // Refresh order data
        const orderRes = await fetch(`/api/admin/orders/${params.id}`);
        if (orderRes.ok) {
          const updatedOrder = await orderRes.json();
          setOrder(updatedOrder);
        }
      }
    } catch {
      setErrors(["Network error during CJ payment."]);
    } finally {
      setCjActionLoading(false);
    }
  };

  const handleCjTrackingCheck = async () => {
    setCjActionLoading(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/admin/orders/${params.id}/cj-tracking`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors([data.error || "CJ tracking check failed."]);
      } else {
        if (data.result.updated) {
          setSuccessMsg(`Order shipped! Tracking: ${data.result.trackingNumber}${data.result.trackingCarrier ? ` (${data.result.trackingCarrier})` : ""}. Customer has been notified.`);
        } else {
          setSuccessMsg(data.result.message);
        }
        // Refresh order data
        const orderRes = await fetch(`/api/admin/orders/${params.id}`);
        if (orderRes.ok) {
          const updatedOrder = await orderRes.json();
          setOrder(updatedOrder);
        }
      }
    } catch {
      setErrors(["Network error during CJ tracking check."]);
    } finally {
      setCjActionLoading(false);
    }
  };

  const handleCjRetry = async () => {
    setCjActionLoading(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/admin/orders/${params.id}/cj-retry`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors([data.error || "CJ retry failed."]);
      } else {
        setSuccessMsg("CJ fulfillment retry completed.");
        // Refresh order data
        const orderRes = await fetch(`/api/admin/orders/${params.id}`);
        if (orderRes.ok) {
          const updatedOrder = await orderRes.json();
          setOrder(updatedOrder);
        }
      }
    } catch {
      setErrors(["Network error during CJ retry."]);
    } finally {
      setCjActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-8 text-black">
        <div className="mx-auto max-w-4xl">
          <p className="text-stone font-body">Loading order...</p>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const subtotal = order.OrderItem.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-black">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back + header */}
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-sm text-clay hover:text-[#D49A11] transition-colors font-body mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
            Order #{order.orderNumber}
          </h1>
          <p className="text-stone mt-1 font-body text-sm">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", year: "numeric",
            })}
          </p>
        </div>

        {successMsg && (
          <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss font-body">{successMsg}</div>
        )}

        {errors.length > 0 && (
          <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">
            {errors.map((msg, i) => <p key={i} className="text-sm text-red-700 font-body">{msg}</p>)}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer details */}
          <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">Customer</h2>
            <div className="space-y-2 text-sm font-body">
              <p><span className="text-stone">Name:</span> <span className="text-ink">{order.firstName} {order.lastName}</span></p>
              <p><span className="text-stone">Email:</span> <span className="text-ink">{order.email}</span></p>
              <p><span className="text-stone">Phone:</span> <span className="text-ink">{order.phone || "—"}</span></p>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">Shipping Address</h2>
            <div className="space-y-1 text-sm font-body">
              <p className="text-ink">{order.firstName} {order.lastName}</p>
              <p className="text-ink">{order.address}</p>
              <p className="text-ink">{order.city}, {order.country} {order.postalCode}</p>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-stone font-body">Current Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-700"}`}>
                    {order.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">Payment</h2>
            <div className="space-y-2 text-sm font-body">
              <p><span className="text-stone">Method:</span> <span className="text-ink">{order.paymentMethod}</span></p>
              <p><span className="text-stone">Stripe Session:</span> <span className="text-ink text-xs">{order.stripeSessionId || "—"}</span></p>
              <p><span className="text-stone">Ship Protection:</span> <span className={order.hasShippingProtection ? "text-moss" : "text-stone"}>
                {order.hasShippingProtection ? "Yes" : "No"}
              </span></p>
              {order.deliveredAt && (
                <p><span className="text-stone">Delivered:</span> <span className="text-ink">
                  {new Date(order.deliveredAt).toLocaleDateString()}
                </span></p>
              )}
            </div>
          </div>
        </div>

        {/* CJ Fulfillment Section */}
        <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">CJ Dropshipping Fulfillment</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone font-body">Status:</span>
              {order.cjFulfillmentStatus ? (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${CJ_STATUS_COLORS[order.cjFulfillmentStatus] || "bg-gray-50 text-gray-700"}`}>
                  {CJ_STATUS_LABELS[order.cjFulfillmentStatus] || order.cjFulfillmentStatus}
                </span>
              ) : (
                <span className="text-sm text-stone font-body">Not a CJ order</span>
              )}
            </div>

            {order.cjOrderId && (
              <p className="text-sm font-body">
                <span className="text-stone">CJ Order ID:</span>{" "}
                <span className="text-ink font-mono">{order.cjOrderId}</span>
              </p>
            )}

            {order.cjCartReference && order.cjFulfillmentStatus !== "failed" && (
              <div className="text-sm font-body space-y-1">
                {(() => {
                  // Structured shipment reference written by cjFulfillOrder.
                  try {
                    const parsed = JSON.parse(order.cjCartReference);
                    return (
                      <>
                        {parsed.logisticName && (
                          <p>
                            <span className="text-stone">Shipping method:</span>{" "}
                            <span className="text-ink">
                              {parsed.logisticName}
                              {parsed.shippingDays ? ` (${parsed.shippingDays} days)` : ""}
                            </span>
                            {typeof parsed.shippingCost === "number" && parsed.shippingCost > 0 && (
                              <span className="text-stone"> — CJ postage ${parsed.shippingCost.toFixed(2)}</span>
                            )}
                          </p>
                        )}
                        {typeof parsed.orderMoney === "number" && (
                          <p>
                            <span className="text-stone">Amount due to CJ:</span>{" "}
                            <span className="text-ink">${parsed.orderMoney.toFixed(2)}</span>
                          </p>
                        )}
                        {parsed.cjItemCount ? (
                          <p className="text-xs text-stone">{parsed.cjItemCount} item(s) sent to CJ.</p>
                        ) : null}
                        {parsed.nonCjItemNames && (
                          <p className="text-xs text-amber-600 font-medium">
                            ⚠ Non-CJ items need manual handling: {parsed.nonCjItemNames}
                          </p>
                        )}
                        <p className="text-xs text-stone break-all">
                          Shipment: <span className="font-mono">{parsed.shipmentsId}</span>
                        </p>
                      </>
                    );
                  } catch {
                    // Legacy plain-string reference.
                    return (
                      <p>
                        <span className="text-stone">CJ Cart Reference:</span>{" "}
                        <span className="text-ink font-mono text-xs">{order.cjCartReference}</span>
                      </p>
                    );
                  }
                })()}
              </div>
            )}

            {order.cjFulfillmentStatus === "ready_to_pay" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCjPay}
                  disabled={cjActionLoading}
                  className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50"
                >
                  {cjActionLoading ? "Processing..." : "Complete CJ Payment"}
                </button>
                <p className="text-xs text-stone mt-2 font-body">
                  This will deduct the order amount from your CJ account balance.
                </p>
              </div>
            )}

            {order.cjFulfillmentStatus === "sent" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCjTrackingCheck}
                  disabled={cjActionLoading}
                  className="cursor-pointer rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917]/40 disabled:opacity-50"
                >
                  {cjActionLoading ? "Checking..." : "Check CJ Tracking Now"}
                </button>
                <p className="text-xs text-stone mt-2 font-body">
                  Queries CJ for tracking info. If shipped, updates status and notifies customer automatically.
                </p>
                {order.cjOrderId && (
                  <p className="text-xs text-stone mt-1 font-body">
                    CJ Order ID: <span className="font-mono">{order.cjOrderId}</span>
                  </p>
                )}
              </div>
            )}

            {order.cjFulfillmentStatus === "failed" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCjRetry}
                  disabled={cjActionLoading}
                  className="cursor-pointer rounded-lg border border-clay text-clay px-6 py-2.5 text-sm font-semibold transition hover:bg-clay/10 focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50"
                >
                  {cjActionLoading ? "Processing..." : "Retry CJ Fulfillment"}
                </button>
                <p className="text-xs text-stone mt-2 font-body">
                  Re-runs add-cart + confirm-cart. Review the error above before retrying.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-xl border border-stone/20 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone/20">
            <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide">Items ({order.OrderItem.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone/20 bg-white">
                <th className="text-left px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Product</th>
                <th className="text-left px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Size</th>
                <th className="text-left px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Color</th>
                <th className="text-right px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Qty</th>
                <th className="text-right px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Price</th>
                <th className="text-right px-6 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {order.OrderItem.map((item) => (
                <tr key={item.id} className="hover:bg-white">
                  <td className="px-6 py-3 font-medium text-ink font-body">{item.name}</td>
                  <td className="px-6 py-3 text-stone font-body">{item.size}</td>
                  <td className="px-6 py-3 text-stone font-body">{item.color ?? "—"}</td>
                  <td className="px-6 py-3 text-right text-stone font-body">{item.quantity}</td>
                  <td className="px-6 py-3 text-right text-stone font-body">${item.price.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-medium text-ink font-body">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone/20 bg-white">
                <td colSpan={4} />
                <td className="px-6 py-3 text-right text-sm text-stone font-body">Subtotal</td>
                <td className="px-6 py-3 text-right font-medium text-ink font-body">${subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-white">
                <td colSpan={4} />
                <td className="px-6 py-3 text-right text-sm text-stone font-body">Shipping Protection</td>
                <td className="px-6 py-3 text-right font-medium text-ink font-body">{order.hasShippingProtection ? "$0.98" : "$0.00"}</td>
              </tr>
              <tr className="bg-white border-t border-stone/20">
                <td colSpan={4} />
                <td className="px-6 py-3 text-right font-semibold text-ink font-body">Total</td>
                <td className="px-6 py-3 text-right font-bold text-ink font-body">${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Profit Breakdown */}
        {(() => {
          const itemsWithCost = order.OrderItem.filter((item) => item.costPrice != null && item.costPrice > 0);
          const itemsWithoutCost = order.OrderItem.filter((item) => item.costPrice == null || item.costPrice <= 0);
          const knownProfit = itemsWithCost.reduce(
            (sum, item) => sum + (item.price - (item.costPrice ?? 0)) * item.quantity,
            0
          );
          const knownCost = itemsWithCost.reduce((sum, item) => sum + (item.costPrice ?? 0) * item.quantity, 0);
          const knownRevenue = itemsWithCost.reduce((sum, item) => sum + item.price * item.quantity, 0);

          return (
            <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide mb-4">Profit</h2>
              
              {itemsWithCost.length === 0 && itemsWithoutCost.length === 0 ? (
                <p className="text-sm text-stone font-body">No items in this order.</p>
              ) : (
                <div className="space-y-4">
                  {/* Per-item profit */}
                  {itemsWithCost.map((item) => {
                    const itemProfit = (item.price - (item.costPrice ?? 0)) * item.quantity;
                    const marginPct = (item.costPrice ?? 0) > 0 ? ((item.price - (item.costPrice ?? 0)) / (item.costPrice ?? 1)) * 100 : 0;
                    const colorClass = marginPct < 20 ? "text-clay" : marginPct < 40 ? "text-amber-600" : "text-emerald-600";
                    return (
                      <div key={item.id} className="flex items-center justify-between text-sm font-body border-b border-stone/20 pb-2 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-ink">{item.name} <span className="text-stone">({item.size}{item.color ? `, ${item.color}` : ""} × {item.quantity})</span></p>
                          <p className="text-xs text-stone">
                            Cost: ${(item.costPrice ?? 0).toFixed(2)} &middot; Sell: ${item.price.toFixed(2)} &middot; Margin: {marginPct >= 0 ? "+" : ""}{marginPct.toFixed(0)}%
                          </p>
                        </div>
                        <span className={`font-semibold ${colorClass}`}>
                          ${itemProfit.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Items with unknown cost */}
                  {itemsWithoutCost.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-800 font-body">
                        ⚠ {itemsWithoutCost.length} item(s) with unknown cost:
                      </p>
                      <ul className="mt-1 text-xs text-amber-700 font-body space-y-0.5">
                        {itemsWithoutCost.map((item) => (
                          <li key={item.id}>
                            {item.name} ({item.size}{item.color ? `, ${item.color}` : ""} × {item.quantity}) — ${(item.price * item.quantity).toFixed(2)} revenue, cost unknown
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-amber-600 font-body">
                        Set costPrice on the product variant to include these in profit calculations.
                      </p>
                    </div>
                  )}

                  {/* Totals */}
                  {itemsWithCost.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-stone/20">
                      <div className="flex justify-between text-sm font-body">
                        <span className="text-stone">Revenue (known cost items)</span>
                        <span className="text-ink">${knownRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-body">
                        <span className="text-stone">Cost</span>
                        <span className="text-ink">-${knownCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold font-body pt-1 border-t border-stone/20">
                        <span className="text-ink">Profit</span>
                        <span className={knownProfit >= 0 ? "text-emerald-600" : "text-clay"}>
                          ${knownProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Update form */}
        <div className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-ink font-display uppercase tracking-wide">Update Order</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Status
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              >
                {VALID_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Tracking Number
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Carrier
              <input
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                placeholder="e.g. UPS, FedEx, USPS"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>

          <p className="text-xs text-stone font-body">
            Changing status to &quot;Shipped&quot; will send a shipping notification email to the customer with tracking info if provided.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Order"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}