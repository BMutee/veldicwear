"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  PageHeader,
  SearchInput,
  Spinner,
  Textarea,
} from "@/components/admin-ui/primitives";

export type ContactMessageReply = {
  id: string;
  body: string;
  adminName: string | null;
  createdAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  repliedAt: string | null;
  replies: ContactMessageReply[];
  createdAt: string;
};

/** Mirrors MAX_BODY_LENGTH in app/api/admin/messages/[id]/reply/route.ts. */
const MAX_REPLY_LENGTH = 5000;

export default function AdminMessagesClient() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

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
      const updated = (await res.json()) as Partial<ContactMessage>;
      // Merged, not replaced: the PATCH response is a bare row with no `replies`,
      // so swapping the whole object in would drop the thread from the pane.
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updated } : m)),
      );
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
    // A half-written reply belongs to the message that was open when it was
    // typed — clear it so it can't be sent to the wrong customer.
    setReplyBody("");
    setReplyError(null);
    setReplySent(false);
    if (!m.read) void setRead(m.id, true);
  };

  const sendReply = async () => {
    if (!selected) return;
    const body = replyBody.trim();
    if (!body || sending) return;

    setSending(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/admin/messages/${selected.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyError(data?.error ?? "We couldn't send that reply. Please try again.");
        return;
      }
      const reply = (data?.reply ?? null) as ContactMessageReply | null;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selected.id
            ? {
                ...m,
                read: true,
                repliedAt: reply?.createdAt ?? new Date().toISOString(),
                // Guard against a null replies array so the thread render stays safe.
                replies: reply ? [...(m.replies ?? []), reply] : (m.replies ?? []),
              }
            : m,
        ),
      );
      setReplyBody("");
      setReplySent(true);
    } catch {
      setReplyError("We couldn't send that reply. Please try again.");
    } finally {
      setSending(false);
    }
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
                    <div className="mt-1 flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-sm ${m.read ? "text-stone" : "font-semibold text-ink"}`}
                      >
                        {m.subject}
                      </p>
                      {m.repliedAt && (
                        <span className="shrink-0 rounded-full bg-clay/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-clay">
                          Replied
                        </span>
                      )}
                    </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    {selected.repliedAt && <Badge tone="accent">Replied</Badge>}
                    <Badge tone={selected.read ? "neutral" : "success"}>
                      {selected.read ? "Read" : "Unread"}
                    </Badge>
                  </div>
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

              {/* ── Sent replies ── */}
              {selected.replies.length > 0 && (
                <div className="border-t border-stone/20 px-5 py-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone">
                    Your replies
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {selected.replies.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-moss">
                            {r.adminName ?? "Admin"}
                          </p>
                          <p className="text-xs text-stone">
                            {new Date(r.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-ink">
                          {r.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ── Reply composer ── */}
              <div className="border-t border-stone/20 px-5 py-4">
                <label htmlFor="reply-body" className="block text-sm font-medium text-ink">
                  Reply to {selected.name}
                </label>
                <p className="mt-0.5 text-xs text-stone">
                  Sent from our support address to {selected.email}. If they reply, it lands back
                  in this inbox.
                </p>
                <Textarea
                  value={replyBody}
                  onChange={(v) => {
                    setReplyBody(v);
                    if (replySent) setReplySent(false);
                    if (replyError) setReplyError(null);
                  }}
                  rows={6}
                  maxLength={MAX_REPLY_LENGTH}
                  disabled={sending}
                  placeholder="Type your reply…"
                  ariaLabel={`Reply to ${selected.name}`}
                  className="mt-2 resize-y"
                />
                {replyError && (
                  <div className="mt-3">
                    <AlertBanner kind="error" onDismiss={() => setReplyError(null)}>
                      {replyError}
                    </AlertBanner>
                  </div>
                )}
                {replySent && !replyError && (
                  <div className="mt-3">
                    <AlertBanner kind="success" onDismiss={() => setReplySent(false)}>
                      Reply sent to {selected.email}.
                    </AlertBanner>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    loading={sending}
                    disabled={sending || replyBody.trim().length === 0}
                    onClick={() => void sendReply()}
                  >
                    {sending ? "Sending…" : "Send reply"}
                  </Button>
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-stone/30 transition-colors duration-200 hover:text-moss hover:ring-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50"
                  >
                    Open in mail app
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-stone/20 px-5 py-4">
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
