"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  SearchInput,
  Spinner,
} from "@/components/admin-ui/primitives";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function AdminMessagesClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showUnreadOnly) params.set("unread", "true");
      const res = await fetch(`/api/admin/messages?${params.toString()}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [showUnreadOnly]);

  useEffect(() => {
    // Deferred so the initial fetch doesn't set state synchronously in the
    // effect body (same macrotask pattern as the cart page's initial load).
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = messages.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const selected = messages.find((m) => m.id === selectedId) ?? null;
  const unreadCount = messages.filter((m) => !m.read).length;

  const setRead = async (id: string, read: boolean) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (!res.ok) throw new Error("update failed");
      const updated = (await res.json()) as ContactMessage;
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } finally {
      setActionId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    } finally {
      setActionId(null);
    }
  };

  const openMessage = (m: ContactMessage) => {
    setSelectedId(m.id);
    if (!m.read) void setRead(m.id, true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description={
          loading
            ? "Loading…"
            : `${messages.length} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search messages…"
              className="w-full max-w-xs"
            />
            <Button
              variant={showUnreadOnly ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowUnreadOnly((v) => !v)}
            >
              {showUnreadOnly ? "Showing unread" : "Show unread only"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ── List ── */}
        <Card className="overflow-hidden">
          {loading ? (
            <p className="flex items-center gap-2 px-5 py-8 text-sm text-stone">
              <Spinner className="h-4 w-4" /> Loading messages…
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone">
              {messages.length === 0
                ? "No messages yet. Contact form submissions will appear here."
                : "No messages match your search."}
            </p>
          ) : (
            <ul className="divide-y divide-stone/15">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => openMessage(m)}
                    className={`block w-full cursor-pointer px-5 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 ${
                      selectedId === m.id ? "bg-moss/5" : "hover:bg-ink/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-sm ${m.read ? "font-medium text-ink" : "font-bold text-ink"}`}
                      >
                        {!m.read && (
                          <span
                            aria-label="Unread"
                            className="mr-2 inline-block h-2 w-2 rounded-full bg-moss align-middle"
                          />
                        )}
                        {m.name}
                      </p>
                      <span className="shrink-0 text-xs text-stone">
                        {new Date(m.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone">{m.email}</p>
                    <p
                      className={`mt-1 truncate text-sm ${m.read ? "text-stone" : "font-semibold text-ink"}`}
                    >
                      {m.subject}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {/* ── Detail ── */}
        <Card className="h-fit lg:sticky lg:top-6">
          {!selected ? (
            <p className="px-5 py-8 text-sm text-stone">
              Select a message to read it. Opening an unread message marks it as read.
            </p>
          ) : (
            <div>
              <div className="border-b border-stone/20 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-ink">{selected.subject}</h2>
                  <Badge tone={selected.read ? "neutral" : "success"}>
                    {selected.read ? "Read" : "Unread"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-ink">
                  {selected.name}{" "}
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-moss underline underline-offset-2 hover:text-ink"
                  >
                    {selected.email}
                  </a>
                </p>
                <p className="mt-1 text-xs text-stone">
                  {new Date(selected.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-6 text-ink">
                {selected.message}
              </p>
              <div className="flex flex-wrap items-center gap-2 border-t border-stone/20 px-5 py-4">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#37472C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50"
                >
                  Reply by email
                </a>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionId === selected.id}
                  onClick={() => setRead(selected.id, !selected.read)}
                >
                  {selected.read ? "Mark as unread" : "Mark as read"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={actionId === selected.id}
                  onClick={() => remove(selected.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
