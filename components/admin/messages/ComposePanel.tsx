"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/admin-ui/primitives";
import { MAX_REPLY_LENGTH, type ComposeDraft } from "./types";

/**
 * "New message" — an admin starting a conversation rather than answering one.
 *
 * Deliberately a floating panel pinned to the corner rather than a centred
 * dialog: Outlook composes in a small window that leaves the mailbox visible
 * behind it, and being able to see the conversation you are replying to while
 * writing is the whole point of that layout.
 *
 * Nothing is sent until Send — closing discards, exactly like Outlook.
 */
export default function ComposePanel({
  draft,
  sending,
  onChange,
  onClose,
  onSend,
}: {
  draft: ComposeDraft;
  sending: boolean;
  onChange: (next: ComposeDraft) => void;
  onClose: () => void;
  onSend: () => void;
}) {
  const [minimised, setMinimised] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Re-measure on every keystroke so the window grows with the message, capped
  // so it can never cover the mailbox.
  useEffect(() => {
    const el = panelRef.current;
    if (!el || minimised) return;
    const body = el.querySelector<HTMLTextAreaElement>("[data-compose-body]");
    if (!body) return;
    body.style.height = "auto";
    body.style.height = `${Math.min(body.scrollHeight, 320)}px`;
  }, [draft.body, minimised]);

  const set = (patch: Partial<ComposeDraft>) => onChange({ ...draft, ...patch });

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="New message"
      className="fixed bottom-0 right-0 z-50 flex max-h-full w-full flex-col border-t-4 border-moss bg-white shadow-2xl sm:bottom-4 sm:right-4 sm:w-[30rem] sm:rounded-t-xl sm:border sm:border-stone/25"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 bg-ink px-4 py-2.5 text-white">
        <h2 className="flex-1 text-sm font-semibold">New message</h2>
        <button
          type="button"
          onClick={() => setMinimised((v) => !v)}
          aria-label={minimised ? "Expand" : "Minimise"}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          aria-label="Close without sending"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!minimised && (
        <>
          <div className="divide-y divide-stone/15">
            <label className="flex items-center gap-2 px-4 py-2.5">
              <span className="w-14 shrink-0 text-xs font-semibold text-stone">To</span>
              <input
                type="email"
                value={draft.to}
                onChange={(e) => set({ to: e.target.value })}
                placeholder="customer@example.com"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-stone/60"
              />
            </label>
            <label className="flex items-center gap-2 px-4 py-2.5">
              <span className="w-14 shrink-0 text-xs font-semibold text-stone">Name</span>
              <input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Optional"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-stone/60"
              />
            </label>
            <label className="flex items-center gap-2 px-4 py-2.5">
              <span className="w-14 shrink-0 text-xs font-semibold text-stone">Subject</span>
              <input
                value={draft.subject}
                onChange={(e) => set({ subject: e.target.value })}
                placeholder="Optional — defaults to your first line"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-stone/60"
              />
            </label>
          </div>

          <textarea
            data-compose-body
            value={draft.body}
            onChange={(e) => set({ body: e.target.value })}
            onKeyDown={(e) => {
              // Ctrl/Cmd+Enter sends, matching every mail client.
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={6}
            maxLength={MAX_REPLY_LENGTH}
            disabled={sending}
            placeholder="Write your message…"
            aria-label="Message body"
            className="min-h-[8rem] w-full resize-none border-t border-stone/15 px-4 py-3 text-sm leading-6 text-ink outline-none placeholder:text-stone/60"
          />

          <div className="flex items-center gap-2 border-t border-stone/15 px-4 py-3">
            <Button loading={sending} onClick={onSend}>
              {sending ? "Sending…" : "Send"}
            </Button>
            <Button size="sm" variant="ghost" disabled={sending} onClick={onClose}>
              Discard
            </Button>
            <span className="ml-auto text-[11px] text-stone">
              {draft.body.trim().length > 0 && `${draft.body.trim().length}/${MAX_REPLY_LENGTH}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

