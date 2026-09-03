"use client";

import { useState } from "react";
import { Button, Card, CardHeader } from "@/components/admin-ui/primitives";
import { useToast } from "@/components/admin-ui/toast";

export default function AdminCJProductSync() {
  const { toast } = useToast();
  const [syncingVariants, setSyncingVariants] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);

  const handleSyncStock = async () => {
    setSyncingStock(true);

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
      toast(
        "success",
        `Stock sync complete. ${s.total} product(s) checked, ${s.updated} updated, ${s.unchanged} unchanged, ${s.errors} errors. ${s.totalVariantsUpdated} variant(s) stock updated.`
      );
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Stock sync failed.");
    } finally {
      setSyncingStock(false);
    }
  };

  const handleSyncAllVariants = async () => {
    setSyncingVariants(true);

    try {
      const response = await fetch("/api/admin/cj/variants/sync", {
        method: "POST",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to sync CJ variants.");
      }

      toast(
        "success",
        `Synced variants for ${result.total} product(s). ${result.totalVariantsSynced} total variant(s) added/updated. ${result.failed} product(s) failed.`
      );
    } catch (error) {
      toast("error", error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncingVariants(false);
    }
  };

  return (
    <Card>
      <CardHeader title="CJ Product Sync" />
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <Button type="button" onClick={handleSyncAllVariants} loading={syncingVariants}>
          Sync CJ Variants for All Products
        </Button>
        <Button type="button" variant="secondary" onClick={handleSyncStock} loading={syncingStock}>
          Sync Stock Now
        </Button>
      </div>
    </Card>
  );
}
