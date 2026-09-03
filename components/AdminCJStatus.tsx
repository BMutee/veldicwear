"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge } from "@/components/admin-ui/primitives";
import { Spinner } from "@/components/admin-ui/primitives";

type CJStatus = {
  connected: boolean;
  accessTokenExpiryDate?: string;
  refreshTokenExpiryDate?: string;
  error?: string;
};

export default function AdminCJStatus() {
  const [status, setStatus] = useState<CJStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/admin/cj");
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        setStatus({
          connected: false,
          error: error instanceof Error ? error.message : "Unable to fetch CJ status.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader title="CJ Dropshipping Integration" />
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-stone">
          <Spinner className="h-4 w-4" /> Checking CJ Dropshipping connection…
        </p>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader title="CJ Dropshipping Integration" />
        <p className="px-5 py-4 text-sm text-clay">CJ status unavailable.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="CJ Dropshipping Integration"
        action={
          <Badge tone={status.connected ? "success" : "danger"}>
            {status.connected ? "Connected" : "Not connected"}
          </Badge>
        }
      />
      <div className="space-y-2 px-5 py-4 text-sm text-stone">
        {status.connected ? (
          <>
            <p>Connected to the CJ Dropshipping API.</p>
            {status.accessTokenExpiryDate && (
              <p>
                Access token expires:{" "}
                <span className="font-medium text-ink">
                  {new Date(status.accessTokenExpiryDate).toLocaleString()}
                </span>
              </p>
            )}
            {status.refreshTokenExpiryDate && (
              <p>
                Refresh token expires:{" "}
                <span className="font-medium text-ink">
                  {new Date(status.refreshTokenExpiryDate).toLocaleString()}
                </span>
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-clay">CJ Dropshipping is not connected.</p>
            <p>{status.error ?? "Ensure CJ_API_KEY is set in your environment variables."}</p>
            <p>
              Create an API key in CJ Dropshipping and add it to{" "}
              <code className="rounded bg-bone px-1.5 py-0.5 font-mono text-xs text-ink">CJ_API_KEY</code>{" "}
              in your .env file.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
