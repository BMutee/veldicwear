import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    productCount,
    orderCount,
    recentOrders,
    totalRevenue,
    ordersLast30Days,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.aggregate({ _sum: { total: true } }),
    // Fetch orders from last 30 days with items and their product's variants
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: {
        items: {
          include: {
            product: {
              include: { variants: true },
            },
          },
        },
      },
    }),
  ]);

  // ── Calculate 30-day profit ──
  let totalRevenue30 = 0;
  let totalCost30 = 0;
  let totalProfit30 = 0;
  let revenueWithoutCost30 = 0;
  let itemsWithCostCount = 0;
  let itemsWithoutCostCount = 0;

  for (const order of ordersLast30Days) {
    for (const item of order.items) {
      const matchingVariant = item.product.variants.find(
        (v: { size: string; costPrice: number | null }) => v.size === item.size
      );
      const costPrice = matchingVariant?.costPrice ?? null;
      const itemRevenue = item.price * item.quantity;

      if (costPrice != null && costPrice > 0) {
        totalRevenue30 += itemRevenue;
        totalCost30 += costPrice * item.quantity;
        itemsWithCostCount++;
      } else {
        revenueWithoutCost30 += itemRevenue;
        itemsWithoutCostCount++;
      }
    }
  }

  totalProfit30 = totalRevenue30 - totalCost30;

  const stats = [
    { label: "Total Products", value: productCount, href: "/admin/products" },
    { label: "Total Orders", value: orderCount, href: "/admin/orders" },
    { label: "Revenue", value: `$${(totalRevenue._sum.total ?? 0).toFixed(2)}`, href: "/admin/orders" },
  ];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="text-stone mt-1 font-body">
          Store overview at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-stone/20 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <p className="text-sm font-medium text-stone font-body">{stat.label}</p>
            <p className="text-3xl font-bold font-display text-ink mt-1">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Profit Summary (30 Days) */}
      {ordersLast30Days.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold font-display text-ink mb-3">Profit Summary (Last 30 Days)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-stone/20 p-6">
              <p className="text-sm font-medium text-stone font-body">Revenue</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">${totalRevenue30.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone/20 p-6">
              <p className="text-sm font-medium text-stone font-body">Cost</p>
              <p className="text-2xl font-bold font-display text-ink mt-1">-${totalCost30.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-stone/20 p-6">
              <p className="text-sm font-medium text-stone font-body">Profit</p>
              <p className={`text-2xl font-bold font-display mt-1 ${totalProfit30 >= 0 ? "text-emerald-600" : "text-clay"}`}>
                ${totalProfit30.toFixed(2)}
              </p>
            </div>
          </div>
          {revenueWithoutCost30 > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700 font-body">
                ⚠ ${revenueWithoutCost30.toFixed(2)} in revenue ({itemsWithoutCostCount} item{itemsWithoutCostCount !== 1 ? "s" : ""}) excluded — cost price not set.
              </p>
              <p className="text-xs text-amber-600 mt-1 font-body">
                Set costPrice on product variants to include these in profit calculations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold font-display text-ink mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard href="/admin/products" label="Manage Products" desc="Add, edit, or remove products" />
          <QuickActionCard href="/admin/cj" label="CJ Import" desc="Import products from CJ Dropshipping" />
          <QuickActionCard href="/admin/homepage" label="Homepage Content" desc="Edit hero, banner, and sections" />
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold font-display text-ink">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-clay hover:underline">
            View All
          </Link>
        </div>
        {recentOrders.length > 0 ? (
          <div className="bg-white rounded-xl border border-stone/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone/20 bg-white">
                  <th className="text-left px-4 py-3 font-semibold text-stone font-body">Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-body">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-body">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-stone font-body">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-stone/20 last:border-0 hover:bg-white transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">#{order.orderNumber}</td>
                    <td className="px-4 py-3 text-stone">{order.firstName} {order.lastName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-clay/10 text-clay">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink">${order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-stone text-sm bg-white rounded-xl border border-stone/20 p-6">
            No orders yet.
          </p>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-stone/20 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <h3 className="font-semibold font-display text-ink group-hover:text-clay transition-colors">
        {label}
      </h3>
      <p className="text-sm text-stone mt-1 font-body">{desc}</p>
    </Link>
  );
}