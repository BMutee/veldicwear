"use client";

import { useState, FormEvent } from "react";

/**
 * Inline "email gate" offer shown under the product price, mirroring the
 * reference pattern: a discounted price unlocked when the shopper joins the
 * list. Subscribes through the existing newsletter endpoint.
 */
export default function EmailGateOffer({
  price,
  discountPercent = 10,
}: {
  price: number;
  discountPercent?: number;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "open" | "error">("idle");

  const gatedPrice = price * (1 - discountPercent / 100);
  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "product-email-gate" }),
      });
      setStatus(res.ok ? "open" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "open") {
    return (
      <div className="mt-4 border border-moss/30 bg-moss/5 p-4">
        <p className="font-sans text-sm font-medium text-moss">
          Your gate is open — use code <span className="font-mono font-bold">VELDIC10</span> at
          checkout for {discountPercent}% off.
        </p>
        <p className="mt-1 font-sans text-xs text-stone">
          The code is also waiting in your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-stone/10 bg-white p-4 shadow-card rounded-lg">
      <p className="font-sans text-sm text-ink">
        <span className="font-mono font-semibold">{fmt(gatedPrice)}</span> with your email
        <span className="mx-2 text-stone">·</span>
        <span className="text-stone">Free shipping worldwide — limited time</span>
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder="Your email"
          aria-label="Email address"
          required
          className="flex-1 border border-ink/15 bg-white px-4 py-2.5 font-sans text-sm text-ink outline-none transition-colors placeholder:text-stone/70 focus:border-moss"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="border border-ink bg-ink px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-moss hover:border-moss disabled:cursor-wait disabled:opacity-70 cursor-pointer"
        >
          {status === "submitting" ? "Opening…" : "Open yours"}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 font-sans text-xs text-clay">
          That didn&apos;t work — please try again.
        </p>
      )}
    </div>
  );
}
