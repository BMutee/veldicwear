"use client";

// ─── Preview section highlighter (Shopify theme editor behavior) ─────────────
// Injected into the homepage ONLY in preview mode (?preview=1&t=…). Gives every
// [data-veldic-section] wrapper Shopify-editor affordances:
//   hover / selected → blue outline + section-name pill
//   click            → selects the section in the editor sidebar
// Communication with the editor parent happens via postMessage, because the
// preview lives in a same-origin iframe.

import { useEffect } from "react";

export default function SectionHighlighter() {
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
    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
      style.remove();
    };
  }, []);

  return null;
}
