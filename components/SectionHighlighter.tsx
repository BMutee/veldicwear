"use client";

// ─── Preview runtime (design-mode only; injected into the storefront) ────────
// Rendered by the homepage ONLY when a valid preview token is present
// (request.design_mode equivalent — never ships to real visitors). Gives every
// [data-veldic-section] wrapper editor affordances and implements the
// preview side of the editor event bus:
//
//   hover / selected        → outline + section-name pill (Shopify-style)
//   [data-veldic-hidden]    → dimmed + dashed outline ("Hidden" state)
//   click                   → postMessage select → editor opens that section
//   veldic-editor-highlight → scroll to + outline the section being edited
//   veldic-editor-refresh   → router.refresh() (RSC re-render = DOM morph that
//                             preserves scroll & unrelated component state)
//
// Communication with the editor parent happens via postMessage (same-origin
// iframe). This module replaces the old highlighter-only runtime.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SectionHighlighter() {
  const router = useRouter();

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "veldic-editor-highlighter";
    style.textContent = `
      [data-veldic-section]{position:relative}
      [data-veldic-section]:hover{outline:2px solid #005bd3;outline-offset:-2px}
      [data-veldic-section].veldic-selected{outline:2px solid #005bd3;outline-offset:-2px}
      [data-veldic-section]:hover::after,[data-veldic-section].veldic-selected::after{
        content:attr(data-veldic-label);
        position:absolute;top:6px;left:6px;z-index:9999;
        background:#005bd3;color:#fff;font-size:11px;font-weight:500;line-height:1;
        padding:4px 10px;border-radius:9999px;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
      }
      [data-veldic-section][data-veldic-hidden]{
        opacity:0.4;outline:2px dashed #8a8a8a;outline-offset:-2px;
      }
      [data-veldic-section][data-veldic-hidden]::after{
        content:"Hidden — " attr(data-veldic-label);
        background:#616161;
      }
    `;
    document.head.appendChild(style);

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.("[data-veldic-section]") as HTMLElement | null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      document.querySelectorAll("[data-veldic-section].veldic-selected").forEach((el) => el.classList.remove("veldic-selected"));
      target.classList.add("veldic-selected");
      window.parent.postMessage(
        { type: "veldic-editor-select", id: target.getAttribute("data-veldic-section-id") },
        window.location.origin
      );
    };

    // Scroll-preserving refresh: router.refresh() re-renders server components
    // and React diffs the DOM (morph-equivalent), but programmatic scroll
    // restoration guards against layout shifts mid-commit.
    let pendingScrollY: number | null = null;
    const refresh = () => {
      pendingScrollY = window.scrollY;
      router.refresh();
      requestAnimationFrame(() => {
        if (pendingScrollY !== null) window.scrollTo(0, pendingScrollY);
      });
      setTimeout(() => {
        if (pendingScrollY !== null) window.scrollTo(0, pendingScrollY);
        pendingScrollY = null;
      }, 120);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const type = event.data?.type;
      if (type === "veldic-editor-highlight") {
        document.querySelectorAll("[data-veldic-section].veldic-selected").forEach((el) => el.classList.remove("veldic-selected"));
        const id = typeof event.data.id === "string" ? event.data.id : "";
        const target = id ? (document.querySelector(`[data-veldic-section-id="${id}"]`) as HTMLElement | null) : null;
        if (target) {
          target.classList.add("veldic-selected");
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (type === "veldic-editor-refresh") {
        refresh();
      }
    };
    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, [router]);

  return null;
}
