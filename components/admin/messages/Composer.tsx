"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Textarea } from "@/components/admin-ui/primitives";
import { MAX_REPLY_LENGTH, type CannedResponse } from "./types";

/**
 * The composer at the foot of a conversation.
 *
 * Two modes, because "answer the customer" and "tell the team" are different
 * intents with very different consequences — a note is never emailed, and mixing
 * them in one box is how an internal thought reaches a customer's inbox.
 *
 * Keyboard: Enter sends, Shift+Enter inserts a newline. Auto-grows with the
 * content up to a cap so a long answer never pushes the timeline off screen.
 */
export default function Composer({
  customerName,
  sending,
  canned,
  onSend,
  onSaveCanned,
  onManageCanned,
}: {
  customerName: string;
  sending: boolean;
  canned: CannedResponse[];
  onSend: (body: string, mode: "reply" | "note") => void;
  onSaveCanned: (title: string, body: string) => Promise<void>;
  onManageCanned: () => void;
}) {
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [value, setValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !sending;
  const firstName = customerName.split(/\s+/)[0] || customerName;

  // Grow with the content, then stop: past the cap the box scrolls instead of
  // swallowing the conversation.
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [value]);

  // Switching mode must never carry a half-written email across, and the
  // transient panels belong to the mode they were opened in. Done in the click
  // handler rather than an effect: this is user intent, not a state sync.
  const switchMode = (next: "reply" | "note") => {
    setMode(next);
    setPickerOpen(false);
    setSaveOpen(false);
    setSaveError(null);
  };

  const submit = () => {
    if (!canSend) return;
    onSend(trimmed, mode);
    setValue("");
  };

  return (
    <div className="border-t border-stone/20 bg-white">
      <div className="flex items-center gap-2 px-4 pt-3">
        <div
          role="tablist"
          aria-label="Composer mode"
          className="inline-flex rounded-lg border border-stone/30 p-0.5"
        >
          {(["reply", "note"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50 ${
                mode === m ? "bg-moss text-white" : "text-stone hover:text-ink"
              }`}
            >
              {m === "reply" ? `Reply to ${firstName}` : "Internal note"}
            </button>
          ))}
        </div>

        {mode === "reply" && (
          <>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-moss transition-colors duration-150 hover:bg-moss/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50"
            >
              Saved replies
              {canned.length > 0 && <span className="ml-1 text-stone">({canned.length})</span>}
            </button>
            <button
              type="button"
              onClick={onManageCanned}
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-stone transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              Manage
            </button>
          </>
        )}
      </div>

      {pickerOpen && mode === "reply" && (
        <div className="mx-4 mt-2 rounded-lg border border-stone/25 bg-bone p-2">
          {canned.length === 0 ? (
            <p className="px-2 py-2 text-xs text-stone">
              No saved replies yet. Write one below and choose{" "}
              <span className="font-semibold">Save as saved reply</span> to reuse it.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {canned.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      // Append rather than replace: a saved reply is a starting
                      // point, and replacing would discard anything already typed.
                      setValue((prev) => (prev.trim() ? `${prev.trim()}\n\n${c.body}` : c.body));
                      setPickerOpen(false);
                    }}
                    className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left transition-colors duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"
                  >
                    <p className="text-xs font-semibold text-ink">{c.title}</p>
                    <p className="truncate text-[11px] text-stone">{c.body}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <label htmlFor="composer-body" className="sr-only">
          {mode === "reply" ? `Reply to ${customerName}` : "Internal note"}
        </label>
        <div
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter is a newline. Ignored mid-composition so
            // an IME candidate isn't swallowed.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        >
          <Textarea
            value={value}
            onChange={setValue}
            inputRef={taRef}
            rows={3}
            maxLength={MAX_REPLY_LENGTH}
            disabled={sending}
            placeholder={
              mode === "reply"
                ? `Write a reply to ${firstName}…`
                : "Add a note for your team — this is never sent to the customer…"
            }
            ariaLabel={mode === "reply" ? `Reply to ${customerName}` : "Internal note"}
            className="resize-none"
          />
        </div>
        <p className="mt-1 text-[11px] text-stone">
          <kbd className="rounded border border-stone/30 px-1 font-sans">Enter</kbd> to send ·{" "}
          <kbd className="rounded border border-stone/30 px-1 font-sans">Shift+Enter</kbd> for a
          new line
        </p>
      </div>

      {saveOpen && (
        <div className="mx-4 mb-3 rounded-lg border border-stone/25 bg-bone p-3">
          <label htmlFor="canned-title" className="block text-xs font-semibold text-ink">
            Name this saved reply
          </label>
          <input
            id="canned-title"
            value={saveTitle}
            onChange={(e) => {
              setSaveTitle(e.target.value);
              setSaveError(null);
            }}
            placeholder="e.g. Tracking number request"
            className="mt-1 w-full rounded-lg border border-ink/25 bg-white px-3 py-2 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          />
          {saveError && <p className="mt-1 text-xs text-red-700">{saveError}</p>}
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              disabled={!saveTitle.trim() || !trimmed}
              onClick={async () => {
                try {
                  await onSaveCanned(saveTitle.trim(), trimmed);
                  setSaveTitle("");
                  setSaveOpen(false);
                } catch (err) {
                  setSaveError(err instanceof Error ? err.message : "Couldn't save that reply.");
                }
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        <Button loading={sending} disabled={!canSend} onClick={submit}>
          {sending ? "Sending…" : mode === "reply" ? "Send reply" : "Save note"}
        </Button>

        {mode === "reply" && trimmed.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setSaveOpen(true)}>
            Save as saved reply
          </Button>
        )}

        <span className="ml-auto text-[11px] text-stone">
          {trimmed.length > 0 ? `${trimmed.length}/${MAX_REPLY_LENGTH}` : ""}
        </span>
      </div>
    </div>
  );
}

