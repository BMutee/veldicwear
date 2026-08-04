"use client";

import { useEffect, useState } from "react";

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
    return <p className="text-sm text-black/60">Checking CJ Dropshipping connection…</p>;
  }

  if (!status) {
    return <p className="text-sm text-clay">CJ status unavailable.</p>;
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-slate-100 p-6">
      <h2 className="text-xl font-semibold">CJ Dropshipping Integration</h2>
      {status.connected ? (
        <div className="mt-4 space-y-3 text-black/75">
          <p>Connected to CJ Dropshipping API.</p>
          {status.accessTokenExpiryDate && (
            <p>Access token expires: {new Date(status.accessTokenExpiryDate).toLocaleString()}</p>
          )}
          {status.refreshTokenExpiryDate && (
            <p>Refresh token expires: {new Date(status.refreshTokenExpiryDate).toLocaleString()}</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 text-black/75">
          <p className="text-clay">CJ Dropshipping is not connected.</p>
          <p>{status.error ?? "Ensure CJ_API_KEY is set in your environment variables."}</p>
          <p>
            Create an API key in CJ Dropshipping and add it to <code>CJ_API_KEY</code> in your .env file.
          </p>
        </div>
      )}
    </div>
  );
}
