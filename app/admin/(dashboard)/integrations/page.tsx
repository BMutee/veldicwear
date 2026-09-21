"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

type ApiKeyRow = {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
};

type GeneratedKey = { key: string; id: string };

export default function AdminIntegrationsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/extension-keys");
      if (res.status === 401 || res.status === 403) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as { keys: ApiKeyRow[] };
      setKeys(data.keys ?? []);
    } catch {
      setMessage({ type: "error", text: "Failed to load API keys." });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Deferred so the initial fetch doesn't set state synchronously in the
    // effect body (same macrotask pattern as the cart page's initial load).
    const timer = window.setTimeout(() => {
      void loadKeys();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadKeys]);

  const handleGenerate = async () => {
    setCreating(true);
    setMessage(null);
    setGenerated(null);
    setCopied(false);
    try {
      const res = await fetch("/api/admin/extension-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to generate key." });
        return;
      }
      setGenerated(data as GeneratedKey);
      setKeyName("");
      await loadKeys();
    } catch {
      setMessage({ type: "error", text: "An error occurred while generating the key." });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.key);
      setCopied(true);
    } catch {
      setMessage({ type: "error", text: "Clipboard copy failed — select the key text manually." });
    }
  };

  const handleRevoke = async (id: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/extension-keys/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to revoke key." });
        return;
      }
      await loadKeys();
      setMessage({ type: "success", text: "Key revoked." });
    } catch {
      setMessage({ type: "error", text: "An error occurred while revoking the key." });
    }
  };

  const activeKeys = keys.filter((k) => !k.revoked);
  const revokedKeys = keys.filter((k) => k.revoked);

  return (
    <main className="min-h-screen bg-bone px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="eyebrow">Integrations</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Extension API keys</h1>
          <p className="mt-2 text-sm text-stone">
            Machine keys for the browser extension, which calls{" "}
            <code className="font-mono text-xs text-ink">POST /api/extension/cj-import</code> with a
            Bearer token. Keys are stored hashed — the raw value is shown only once at creation.
          </p>
        </header>

        {message && (
          <div
            role="status"
            className={`rounded-lg border p-4 text-sm ${
              message.type === "success"
                ? "border-moss/30 bg-moss/5 text-moss"
                : "border-clay/30 bg-clay/5 text-clay"
            }`}
          >
            {message.text}
          </div>
        )}

        <section className="card cursor-default p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Generate a new key</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="key-name" className="sr-only">
              Key label (optional)
            </label>
            <input
              id="key-name"
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Label, e.g. Price-checker extension"
              maxLength={100}
              className="w-full rounded-lg border border-ink/25 bg-white px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-200 placeholder:text-stone focus:border-moss"
            />
            <button
              onClick={handleGenerate}
              disabled={creating}
              className="shrink-0 cursor-pointer rounded-lg bg-moss px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-moss-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? "Generating…" : "Generate key"}
            </button>
          </div>

          {generated && (
            <div className="mt-6 rounded-lg border border-clay/30 bg-clay/5 p-4">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-clay">
                Copy this key now — it will never be shown again
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="block w-full break-all rounded-lg border border-ink/10 bg-white px-3 py-2 font-mono text-xs text-ink">
                  {generated.key}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 cursor-pointer rounded-lg border border-ink px-4 py-2 text-sm text-ink transition-colors duration-200 hover:bg-ink hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card cursor-default p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-ink">Active keys</h2>
          {loading ? (
            <p className="mt-4 text-sm text-stone">Loading…</p>
          ) : activeKeys.length === 0 ? (
            <p className="mt-4 text-sm text-stone">No active keys. Generate one above.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone-border">
              {activeKeys.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{k.name || "Untitled key"}</p>
                    <p className="mt-0.5 font-mono text-xs text-stone">
                      Created {new Date(k.createdAt).toLocaleString()}
                      {k.lastUsedAt
                        ? ` · Last used ${new Date(k.lastUsedAt).toLocaleString()}`
                        : " · Never used"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(k.id)}
                    className="shrink-0 cursor-pointer rounded-lg border border-ink px-4 py-2 text-sm text-ink transition-colors duration-200 hover:bg-ink hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {revokedKeys.length > 0 && (
          <section className="card cursor-default p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-stone">Revoked keys</h2>
            <ul className="mt-4 divide-y divide-stone-border">
              {revokedKeys.map((k) => (
                <li key={k.id} className="py-4">
                  <p className="text-sm text-stone line-through">{k.name || "Untitled key"}</p>
                  <p className="mt-0.5 font-mono text-xs text-stone">
                    Created {new Date(k.createdAt).toLocaleString()} · Revoked
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
