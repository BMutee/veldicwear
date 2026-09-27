"use client";

import { useState } from "react";
import { Button, ModalShell, Textarea } from "@/components/admin-ui/primitives";
import { MAX_REPLY_LENGTH, type CannedResponse } from "./types";

/**
 * Manage saved replies.
 *
 * Fully controlled: the page owns the list and hands changes back through
 * onChanged, so there is no local copy to keep in sync with the prop.
 */
export default function CannedRepliesModal({
  responses,
  onClose,
  onChanged,
  onToast,
}: {
  responses: CannedResponse[];
  onClose: () => void;
  onChanged: (next: CannedResponse[]) => void;
  onToast: (kind: "success" | "error" | "info", message: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = async () => {
    if (!title.trim() || !body.trim()) return;
    const res = await fetch("/api/admin/canned-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      onToast("error", data?.error ?? "Couldn't save that reply.");
      return;
    }
    onChanged([data.response, ...responses]);
    setTitle("");
    setBody("");
    onToast("success", "Saved reply added.");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this saved reply?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/canned-responses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      onChanged(responses.filter((c) => c.id !== id));
      onToast("success", "Saved reply deleted.");
    } catch {
      onToast("error", "Couldn't delete that reply.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ModalShell
      title="Saved replies"
      description="Reusable answers for the questions you get most. Pick one from the composer to drop it in."
      onClose={onClose}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="rounded-lg border border-stone/25 p-3">
          <label htmlFor="canned-new-title" className="block text-sm font-medium text-ink">
            New saved reply
          </label>
          <input
            id="canned-new-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name it — e.g. Order status check"
            className="mt-2 w-full rounded-lg border border-ink/25 bg-white px-3 py-2 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          />
          <Textarea
            value={body}
            onChange={setBody}
            rows={4}
            maxLength={MAX_REPLY_LENGTH}
            placeholder="The message to send…"
            ariaLabel="Saved reply message"
            className="mt-2"
          />
          <Button
            size="sm"
            className="mt-2"
            disabled={!title.trim() || !body.trim()}
            onClick={() => void create()}
          >
            Save reply
          </Button>
        </div>

        {responses.length === 0 ? (
          <p className="px-1 text-sm text-stone">Nothing saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {responses.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-stone/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{c.title}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs leading-5 text-stone">
                    {c.body}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={busyId === c.id}
                  onClick={() => void remove(c.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}
