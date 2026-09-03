"use client";

import { useState, useEffect } from "react";
import {
  Badge,
  LinkButton,
  PageHeader,
  SearchInput,
  Spinner,
} from "@/components/admin-ui/primitives";
import { DataTable, type Column } from "@/components/admin-ui/DataTable";

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

const CJ_STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  ready_to_pay: "warning",
  sent: "success",
  failed: "danger",
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
    // Async IIFE keeps setState calls out of the effect's synchronous body
    // (react-hooks/set-state-in-effect) while preserving reload-on-filter.
    void (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      try {
        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        const data = await res.json();
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter, debouncedSearch]);

  const columns: Column<OrderSummary>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => <span className="font-medium text-ink">#{order.orderNumber}</span>,
      sortValue: (order) => order.orderNumber,
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) => (
        <div>
          <p className="font-medium text-ink">{order.firstName} {order.lastName}</p>
          <p className="text-xs text-stone">{order.email}</p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      hideOnMobile: true,
      render: (order) => (
        <span className="text-stone">
          {new Date(order.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
      sortValue: (order) => new Date(order.createdAt).getTime(),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => <Badge tone={pillTone(order.status)}>{order.status}</Badge>,
      sortValue: (order) => order.status,
    },
    {
      key: "cj",
      header: "CJ Fulfillment",
      hideOnMobile: true,
      render: (order) =>
        order.cjFulfillmentStatus ? (
          <Badge tone={CJ_STATUS_TONE[order.cjFulfillmentStatus] ?? "neutral"}>
            {CJ_STATUS_LABELS[order.cjFulfillmentStatus] || order.cjFulfillmentStatus}
          </Badge>
        ) : (
          <span className="text-stone">—</span>
        ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      headerClassName: "text-right",
      render: (order) => <span className="font-medium text-ink">${order.total.toFixed(2)}</span>,
      sortValue: (order) => order.total,
    },
    {
      key: "items",
      header: "Items",
      className: "text-right",
      headerClassName: "text-right",
      hideOnMobile: true,
      render: (order) => <span className="text-stone">{order._count.items}</span>,
      sortValue: (order) => order._count.items,
    },
    {
      key: "protection",
      header: "Protection",
      hideOnMobile: true,
      render: (order) =>
        order.hasShippingProtection ? (
          <span className="text-xs font-medium text-moss">Yes</span>
        ) : (
          <span className="text-xs text-stone">No</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (order) => (
        <LinkButton href={`/admin/orders/${order.id}`} size="sm">
          View
        </LinkButton>
      ),
    },
  ];

  // __PART2__
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={`${orders.length} total`}
      />

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(order) => order.id}
        searchPlaceholder="Search by email or order #…"
        emptyState={
          loading ? (
            <span className="inline-flex items-center gap-2 text-stone">
              <Spinner className="h-4 w-4" /> Loading orders…
            </span>
          ) : (
            "No orders found."
          )
        }
        toolbar={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by email or order #…"
              className="w-full max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 ${
                    statusFilter === s
                      ? "bg-ink text-bone"
                      : "border border-stone/30 bg-white text-stone hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}

function pillTone(status: string): "neutral" | "success" | "warning" | "danger" | "accent" {
  switch (status.toLowerCase()) {
    case "ordered":
    case "paid":
      return "success";
    case "processing":
      return "warning";
    case "shipped":
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}