import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatCard } from "@/components/admin-ui/StatCard";
import { AreaChart, DonutChart, BarList, ChartLegend } from "@/components/admin-ui/charts";
import {
  PageHeader,
  Card,
  CardHeader,
  Badge,
  LinkButton,
} from "@/components/admin-ui/primitives";

/* Veldic Admin — Dashboard
   Server-rendered overview: KPIs, 30-day revenue trend, order status
   mix, top products and recent orders. Charts are pure SVG (no JS). */

const DAY_MS = 24 * 60 * 60 * 1000;

function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type StatusTone = "neutral" | "success" | "warning" | "danger" | "accent";

const STATUS_META: Record<string, { label: string; color: string; tone: StatusTone }> = {
  pending: { label: "Pending", color: "#D97706", tone: "warning" },
  processing: { label: "Processing", color: "#B5602E", tone: "accent" },
  paid: { label: "Paid", color: "#455A38", tone: "success" },
  shipped: { label: "Shipped", color: "#7A8B6F", tone: "success" },
  delivered: { label: "Delivered", color: "#2E4125", tone: "success" },
  cancelled: { label: "Cancelled", color: "#DC2626", tone: "danger" },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status.toLowerCase()] ?? {
      label: status,
      color: "#8C8677",
      tone: "neutral" as StatusTone,
    }
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS);

  const [
    productCount,
    lowStockCount,
    orderCount,
    ordersLast60Days,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lte: 3 } } }),
    prisma.order.count(),
    prisma.order.findMany({
      where: { createdAt: { gte: sixtyDaysAgo } },
      include: { items: { include: { product: { include: { variants: true } } } } },
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const last30 = ordersLast60Days.filter((o) => o.createdAt >= thirtyDaysAgo);
  const prev30 = ordersLast60Days.filter((o) => o.createdAt < thirtyDaysAgo);

  const revenue30 = last30.reduce((s, o) => s + o.total, 0);
  const revenuePrev30 = prev30.reduce((s, o) => s + o.total, 0);
  const revenueDelta =
    revenuePrev30 > 0 ? ((revenue30 - revenuePrev30) / revenuePrev30) * 100 : undefined;

  /* ── Profit (existing business logic) ── */
  let cost30 = 0;
  let trackedRevenue30 = 0;
  let missingCostItems = 0;
  for (const order of last30) {
    for (const item of order.items) {
      const variant = item.product.variants.find(
        (v: { size: string; costPrice: number | null }) => v.size === item.size
      );
      const costPrice = variant?.costPrice ?? null;
      const itemRevenue = item.price * item.quantity;
      if (costPrice != null && costPrice > 0) {
        trackedRevenue30 += itemRevenue;
        cost30 += costPrice * item.quantity;
      } else {
        missingCostItems++;
      }
    }
  }
  const profit30 = trackedRevenue30 - cost30;

  /* ── Daily revenue series (last 30 days) ── */
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of last30) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }
  const revenueSeries = [...byDay.entries()].map(([iso, value]) => ({
    label: new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value,
  }));

  /* ── Status mix ── */
  const statusCounts = new Map<string, number>();
  for (const o of last30) {
    const key = o.status.toLowerCase();
    statusCounts.set(key, (statusCounts.get(key) ?? 0) + 1);
  }
  const statusSegments = [...statusCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, value]) => ({ ...statusMeta(status), value }));

  /* ── Top products by units sold ── */
  const productSales = new Map<string, { qty: number; revenue: number }>();
  for (const o of last30) {
    for (const item of o.items) {
      const entry = productSales.get(item.name) ?? { qty: 0, revenue: 0 };
      entry.qty += item.quantity;
      entry.revenue += item.price * item.quantity;
      productSales.set(item.name, entry);
    }
  }
  const topProducts = [...productSales.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([label, v]) => ({ label, value: v.qty, sub: `${money(v.revenue)} revenue` }));

  const statsIcon = (d: string) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 sm:p-8">
      <PageHeader
        title="Dashboard"
        description="Store overview at a glance"
        action={<LinkButton href="/admin/cj">Import products</LinkButton>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (30d)"
          value={money(revenue30)}
          delta={revenueDelta != null ? { value: revenueDelta } : undefined}
          sub={`${last30.length} orders`}
          href="/admin/orders"
          icon={statsIcon("M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941")}
        />
        <StatCard
          label="Orders (30d)"
          value={String(last30.length)}
          sub={`${orderCount} all-time`}
          href="/admin/orders"
          icon={statsIcon("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z")}
        />
        <StatCard
          label="Profit (30d)"
          value={money(profit30)}
          sub={
            trackedRevenue30 > 0
              ? `${((profit30 / trackedRevenue30) * 100).toFixed(0)}% margin on tracked items`
              : "Set variant cost prices to track"
          }
          icon={statsIcon("M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z")}
        />
        <StatCard
          label="Products"
          value={String(productCount)}
          sub={lowStockCount > 0 ? `${lowStockCount} low on stock (≤3)` : "Stock levels healthy"}
          href="/admin/products"
          icon={statsIcon("M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z")}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue — last 30 days"
            action={<span className="text-xs text-stone">Daily totals</span>}
          />
          <div className="p-5">
            <AreaChart
              data={revenueSeries}
              chartId="dash-revenue"
              ariaLabel="Daily revenue for the last 30 days"
              formatValue={(v) => `$${Math.round(v)}`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Orders by status" />
          <div className="flex flex-col gap-4 p-5">
            <DonutChart
              segments={statusSegments}
              centerValue={String(last30.length)}
              centerLabel="orders"
              chartId="dash-status"
            />
            {statusSegments.length > 0 && (
              <ChartLegend
                items={statusSegments.map((s) => ({
                  label: s.label,
                  value: s.value,
                  color: s.color,
                }))}
              />
            )}
          </div>
        </Card>
      </div>

      {/* Top products + recent orders */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Top products"
            action={<span className="text-xs text-stone">Units sold · 30d</span>}
          />
          <div className="p-5">
            <BarList data={topProducts} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            action={
              <Link href="/admin/orders" className="text-sm font-medium text-clay hover:underline">
                View all
              </Link>
            }
          />
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone/20 bg-bone/60">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone">Order</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone">Customer</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-stone">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(
                    (order: {
                      id: string;
                      orderNumber: string;
                      firstName: string;
                      lastName: string;
                      status: string;
                      total: number;
                    }) => {
                      const meta = statusMeta(order.status);
                      return (
                        <tr
                          key={order.id}
                          className="border-b border-stone/15 last:border-0 transition-colors duration-150 hover:bg-bone/70"
                        >
                          <td className="px-5 py-3 font-medium text-ink">#{order.orderNumber}</td>
                          <td className="px-5 py-3 text-stone">
                            {order.firstName} {order.lastName}
                          </td>
                          <td className="px-5 py-3">
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-ink">{money(order.total)}</td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <p className="rounded-xl border border-dashed border-stone/30 px-6 py-10 text-center text-sm text-stone">
                No orders yet.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Missing cost-price nudge */}
      {missingCostItems > 0 && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          {missingCostItems} item{missingCostItems === 1 ? "" : "s"} sold without a variant cost price —
          set <code className="font-mono">costPrice</code> on product variants to include them in profit.
        </p>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Quick actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard href="/admin/products" label="Manage products" desc="Add, edit, or remove products" />
          <QuickActionCard href="/admin/cj" label="CJ import" desc="Import products from CJ Dropshipping" />
          <QuickActionCard href="/admin/editor" label="Theme editor" desc="Edit hero, banner, and homepage sections" />
        </div>
      </div>

    </div>
  );
}

function QuickActionCard({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group cursor-pointer rounded-xl border border-stone/20 bg-white p-5 shadow-sm transition-colors duration-200 hover:border-moss/50"
    >
      <h3 className="font-display font-semibold text-ink transition-colors duration-200 group-hover:text-moss">
        {label}
      </h3>
      <p className="mt-1 text-sm text-stone">{desc}</p>
    </Link>
  );
}
