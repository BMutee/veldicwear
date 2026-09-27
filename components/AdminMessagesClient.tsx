"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, PageHeader, SearchInput, Tabs } from "@/components/admin-ui/primitives";
import { useToast } from "@/components/admin-ui/toast";
import CannedRepliesModal from "@/components/admin/messages/CannedRepliesModal";
import ConversationPane from "@/components/admin/messages/ConversationPane";
import ThreadList from "@/components/admin/messages/ThreadList";
import {
  MESSAGES_CHANGED_EVENT,
  notifyMessagesChanged,
  type Assignee,
  type CannedResponse,
  type InboxFilter,
  type MessageThread,
} from "@/components/admin/messages/types";

export type { MessageThread } from "@/components/admin/messages/types";

/** How often to pull new mail while the tab is visible. */
const POLL_MS = 15000;

const FILTER_TABS: { id: InboxFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "unread", label: "Unread" },
  { id: "archived", label: "Archived" },
  { id: "all", label: "All" },
];

/**
 * Admin inbox.
 *
 * Lists conversations (one per customer) and shows the selected one's history.
 * Replaces the old per-submission list: repeat contact from the same person used
 * to arrive as unrelated rows, which is the opposite of how a mailbox works.
 *
 * Live updates: a visibility-aware poll refreshes the list, and a window event
 * lets the sidebar badge react to anything this page changes.
 */
export default function AdminMessagesClient() {
  const { toast } = useToast();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<InboxFilter>("open");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [canned, setCanned] = useState<CannedResponse[]>([]);
  const [cannedOpen, setCannedOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (opts?.quiet) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ filter });
        if (debouncedSearch) params.set("search", debouncedSearch);
        const res = await fetch(`/api/admin/messages?${params.toString()}`);
        const data = await res.json();
        setThreads(Array.isArray(data) ? (data as MessageThread[]) : []);
      } catch {
        if (!opts?.quiet) setThreads([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, debouncedSearch],
  );

  // `load` is memoised on [filter, debouncedSearch] — the debounce above keeps
  // that stable while typing, so the poll below only re-arms on a real change.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Poll for new mail, but never in a hidden tab — a background inbox does not
  // need to keep hammering the API.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void load({ quiet: true });
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  // A message arriving elsewhere in the app should still land here.
  useEffect(() => {
    const onChanged = () => void load({ quiet: true });
    window.addEventListener(MESSAGES_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(MESSAGES_CHANGED_EVENT, onChanged);
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/messages/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.assignees) setAssignees(json.assignees as Assignee[]);
      })
      .catch(() => {});
    fetch("/api/admin/canned-responses")
      .then((r) => (r.ok ? r.json() : []))
      .then((json) => setCanned(Array.isArray(json) ? (json as CannedResponse[]) : []))
      .catch(() => {});
  }, []);

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId],
  );

  /** Opening a conversation is the read receipt. */
  const selectThread = useCallback((id: string) => {
    setSelectedId(id);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t)));
    void fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markRead: true }),
    }).then(() => notifyMessagesChanged());
  }, []);

  /**
   * Re-read one thread after a mutation, so the pane and the list can never
   * drift apart — a reply also bumps lastReplyAt, which the client can't derive.
   */
  const refreshThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/messages/${id}`);
    if (!res.ok) return;
    const fresh = (await res.json()) as MessageThread;
    setThreads((prev) => prev.map((t) => (t.id === id ? fresh : t)));
  }, []);

  const patchThread = useCallback(
    async (id: string, payload: Record<string, unknown>, successMessage?: string) => {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", data?.error ?? "That change didn't save.");
        return;
      }
      setThreads((prev) => prev.map((t) => (t.id === id ? ({ ...t, ...data } as MessageThread) : t)));
      notifyMessagesChanged();
      if (successMessage) toast("success", successMessage);
    },
    [toast],
  );

  const sendReplyOrNote = useCallback(
    async (body: string, mode: "reply" | "note") => {
      if (!selected || sending) return;
      setSending(true);
      try {
        const url =
          mode === "reply"
            ? `/api/admin/messages/${selected.id}/reply`
            : `/api/admin/messages/${selected.id}/notes`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast("error", data?.error ?? "We couldn't send that. Please try again.");
          return;
        }
        await refreshThread(selected.id);
        notifyMessagesChanged();
        toast("success", mode === "reply" ? `Reply sent to ${selected.email}.` : "Note saved.");
      } catch {
        toast("error", "We couldn't send that. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [selected, sending, refreshThread, toast],
  );

  const saveCanned = useCallback(
    async (title: string, body: string) => {
      const res = await fetch("/api/admin/canned-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Couldn't save that reply.");
      setCanned((prev) => [data.response as CannedResponse, ...prev]);
      toast("success", "Saved reply added.");
    },
    [toast],
  );


  const removeThread = useCallback(async () => {
    if (!selected) return;
    const ok = window.confirm(
      `Delete this conversation with ${selected.customerName}? This can't be undone.`,
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/messages/${selected.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("error", "Couldn't delete that conversation.");
      return;
    }
    setThreads((prev) => prev.filter((t) => t.id !== selected.id));
    setSelectedId(null);
    notifyMessagesChanged();
    toast("success", "Conversation deleted.");
  }, [selected, toast]);

  // Arrow keys move through the list like a mail client, and Escape closes the
  // open conversation. Both are ignored while typing so the caret still works.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const typing =
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "INPUT" ||
      target?.isContentEditable;

    if (e.key === "Escape" && !typing) {
      setSelectedId(null);
      return;
    }
    if (typing || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    if (threads.length === 0) return;

    e.preventDefault();
    const index = threads.findIndex((t) => t.id === selectedId);
    if (index === -1) {
      selectThread(threads[0].id);
      return;
    }
    const next =
      e.key === "ArrowDown"
        ? Math.min(index + 1, threads.length - 1)
        : Math.max(index - 1, 0);
    selectThread(threads[next].id);
  };

  const unreadTotal = threads.reduce((sum, t) => sum + t.unreadCount, 0);


  return (
    <div className="space-y-6" onKeyDown={onKeyDown}>
      <PageHeader
        title="Messages"
        description={
          loading
            ? "Loading…"
            : `${threads.length} conversation${threads.length === 1 ? "" : "s"}${
                unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""
              }${refreshing ? " · refreshing" : ""}`
        }
        action={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, email or text…"
            className="w-full max-w-xs"
          />
        }
      />

      <Tabs
        tabs={FILTER_TABS}
        active={filter}
        onChange={(id) => {
          setFilter(id as InboxFilter);
          setSelectedId(null);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <Card className="overflow-hidden lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
          <ThreadList
            threads={threads}
            selectedId={selectedId}
            loading={loading}
            onSelect={selectThread}
          />
        </Card>

        <Card className="overflow-hidden lg:sticky lg:top-6 lg:max-h-[calc(100vh-16rem)]">
          {selected ? (
            <ConversationPane
              thread={selected}
              assignees={assignees}
              canned={canned}
              sending={sending}
              onSend={(body, mode) => void sendReplyOrNote(body, mode)}
              onAssign={(id) => void patchThread(selected.id, { assignedToId: id })}
              onToggleArchive={() =>
                void patchThread(
                  selected.id,
                  { status: selected.status === "archived" ? "open" : "archived" },
                  selected.status === "archived" ? "Moved back to Open." : "Conversation archived.",
                )
              }
              onDelete={() => void removeThread()}
              onSaveCanned={saveCanned}
              onManageCanned={() => setCannedOpen(true)}
            />
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-ink">Select a conversation</p>
              <p className="mt-1 text-sm text-stone">
                Use the arrow keys to move through the list. Opening a conversation marks it read.
              </p>
            </div>
          )}
        </Card>
      </div>

      {cannedOpen && (
        <CannedRepliesModal
          responses={canned}
          onClose={() => setCannedOpen(false)}
          onChanged={setCanned}
          onToast={toast}
        />
      )}
    </div>
  );
}

