"use client";

import { useEffect, useState } from "react";
import { Badge, Spinner, StatusPill } from "@/components/admin-ui/primitives";
import type { CustomerContext } from "./types";

/**
 * What this customer has bought, shown beside the conversation.
 *
 * Support usually needs the answer to "which order is this about?" before they
 * can reply usefully. Loaded on demand for the open thread only, so the inbox
 * list stays cheap.
 */
export default function CustomerContextPanel({ threadId }: { threadId: string }) {
  // The fetched context is stored together with the thread it belongs to, so
  // "is this still the right data?" is answered during render. Resetting
  // `loading`/`data` inside the effect instead would be a synchronous setState
  // in the effect body, which cascades a render on every thread switch.
  const [state, setState] = useState<{
    threadId: string;
    context: CustomerContext | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/admin/messages/${threadId}/customer`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        // Only setState inside the async callback, never synchronously.
        if (!cancelled) setState({ threadId, context: (json as CustomerContext) ?? null });
      })
      .catch(() => {
        /* context is a nicety — never block the conversation on it */
      });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  if (state?.threadId !== threadId) {
    return (
      <p className="flex items-center gap-2 px-4 py-3 text-xs text-stone">
        <Spinner className="h-3.5 w-3.5" /> Loading order history…
      </p>
    );
  }

  const data = state.context;
  if (!data) return null;

  return (
    <div className="border-b border-stone/20 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone">
          Order history
        </h3>
        {data.totalOrders > 0 && (
          <Badge tone="accent">
            {data.totalOrders} order{data.totalOrders === 1 ? "" : "s"} · $
            {data.lifetimeValue.toFixed(2)}
          </Badge>
        )}
      </div>

      {data.orders.length === 0 ? (
        <p className="mt-2 text-xs text-stone">
          No orders on this email address — this customer hasn&apos;t bought anything yet.
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {data.orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone/20 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink">
                  {order.orderNumber}
                </p>
                <p className="text-[11px] text-stone">
                  {order._count.items} item{order._count.items === 1 ? "" : "s"} · $
                  {order.total.toFixed(2)} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StatusPill status={order.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
