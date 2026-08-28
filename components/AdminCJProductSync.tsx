"use client";

import { useState } from "react";

export default function AdminCJProductSync() {
  const [syncingVariants, setSyncingVariants] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSyncStock = async () => {
    setSyncingStock(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/stock-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sync CJ stock.");
      }

      const s = result.summary;
      setMessage(
        `Stock sync complete. ${s.total} product(s) checked, ${s.updated} updated, ${s.unchanged} unchanged, ${s.errors} errors. ${s.totalVariantsUpdated} variant(s) stock updated.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stock sync failed.");
    } finally {
      setSyncingStock(false);
    }
  };

  const handleSyncAllVariants = async () => {
    setSyncingVariants(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/variants/sync", {
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sync CJ variants.");
      }

      setMessage(
        `Synced variants for ${result.total} product(s). ${result.totalVariantsSynced} total variant(s) added/updated. ${result.failed} product(s) failed.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncingVariants(false);
    }
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-slate-100 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">CJ Product Sync</h2>
          <p className="mt-2 text-black/70">
            Products are imported from the CJ browser extension or webhook. Use the
            controls below to backfill variants and keep stock levels in sync with
            CJ&apos;s real inventory.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncAllVariants}
              disabled={syncingVariants}
              className="rounded-full bg-slate-700 px-6 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingVariants ? "Syncing..." : "Sync CJ Variants for All Products"}
            </button>
            <p className="text-xs text-black/60">
              Fetches variant IDs from CJ for all existing imported products. Required for
              auto-fulfillment to work correctly with size variants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncStock}
              disabled={syncingStock}
              className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncingStock ? "Syncing..." : "Sync Stock Now"}
            </button>
            <p className="text-xs text-black/60">
              Fetches current stock levels from CJ for all imported products and updates local
              variant stock. Imports now sync stock automatically; use this to re-sync manually.
            </p>
          </div>

          {message && <p className="text-sm text-black/70">{message}</p>}
        </div>
      </div>
    </div>
  );
}
