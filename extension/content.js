/**
 * Content script — CJ Dropshipping product pages.
 *
 * Design notes (from the CJ page audit):
 * - CJ is an unstable Vue SPA: never anchor into CJ's DOM structure. The
 *   button is a fixed-position overlay owned entirely by us.
 * - The pid is extracted from location.href ONLY (regex, no DOM parsing,
 *   no fetching from cjdropshipping.com — see anti-bot findings).
 * - If a pid is extractable, show the button even on captcha/login-gate
 *   interstitials: the backend imports from CJ's API, so the page content
 *   is irrelevant.
 */

(() => {
  "use strict";

  const BUTTON_ID = "veldic-import-btn";
  const MAX_PIDS = 9007199254740991n; // sanity upper bound; pids are 10-25 digits

  // Current canonical: /product/<title-slug>-p-<pid>.html (slug optional)
  const CANONICAL_RE = /\/product\/(?:[^?]*-)?p-(\d{10,25})\.html/;
  // Legacy: /product-detail.html?id=<pid>
  const LEGACY_RE = /[?&]id=(\d{10,25})(?:&|$)/;
  // Explicit exclusions: category/list pages use -l-<uuid>.html
  const LIST_PAGE_RE = /\/list\/|\.html\?.*[?&]id=[0-9a-f-]{36}/i;

  function extractPid(url) {
    const m = CANONICAL_RE.exec(url) || LEGACY_RE.exec(url);
    if (!m) return null;
    const pid = m[1];
    // Guard against absurd values (all zeros, or > Number.MAX_SAFE_INTEGER
    // is fine for a string id, but reject all-zero).
    if (/^0+$/.test(pid) || BigInt(pid) > MAX_PIDS * 1000000n) return null;
    return pid;
  }

  function injectButton(pid) {
    if (document.getElementById(BUTTON_ID)) return; // already present
    if (LIST_PAGE_RE.test(location.href)) return; // safety: never on list pages

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.dataset.pid = pid;
    btn.textContent = `Import to Store (PID ${pid})`;
    btn.setAttribute("aria-live", "polite");
    Object.assign(btn.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "2147483647",
      padding: "12px 18px",
      border: "none",
      borderRadius: "10px",
      background: "#4a5d43", // store moss color
      color: "#fff",
      font: "600 14px/1.2 system-ui, sans-serif",
      cursor: "pointer",
      boxShadow: "0 4px 14px rgba(0,0,0,.28)",
      maxWidth: "280px",
      wordBreak: "break-word",
      transition: "background .2s ease, opacity .2s ease",
    });
    btn.addEventListener("mouseenter", () => {
      if (!btn.disabled) btn.style.background = "#3c4d37";
    });
    btn.addEventListener("mouseleave", () => {
      if (!btn.disabled) btn.style.background = "#4a5d43";
    });
    btn.addEventListener("click", onImportClick);

    document.documentElement.appendChild(btn);
  }

  function setState(btn, text, { disabled = false, bg = "#4a5d43", done = false } = {}) {
    btn.textContent = text;
    btn.disabled = disabled;
    btn.style.background = bg;
    btn.style.cursor = disabled ? "default" : "pointer";
    btn.style.opacity = done ? "0.85" : "1";
  }

  async function onImportClick(event) {
    const btn = event.currentTarget;
    const pid = btn.dataset.pid;

    let cfg;
    try {
      cfg = await chrome.storage.local.get(["storeBaseUrl", "extensionApiKey"]);
    } catch {
      setState(btn, "Storage unavailable — reload page", { disabled: true, bg: "#a05a3c" });
      return;
    }

    if (!cfg.storeBaseUrl || !cfg.extensionApiKey) {
      // Graceful: prompt the user to open the popup to configure, then fail
      // silently no more — brief hint on the button, which self-resets.
      setState(btn, "Not configured — click the toolbar icon to set your store URL & key", {
        disabled: true,
        bg: "#a05a3c",
      });
      setTimeout(() => setState(btn, `Import to Store (PID ${pid})`), 4000);
      return;
    }

    setState(btn, "Importing…", { disabled: true, bg: "#6b7a64" });

    let response;
    try {
      response = await chrome.runtime.sendMessage({ type: "cj-import", pid });
    } catch {
      setState(btn, "Extension error — reload the page and retry", { disabled: true, bg: "#a05a3c" });
      return;
    }

    if (!response) {
      setState(btn, "No response from background worker — retry", { bg: "#a05a3c" });
      return;
    }

    if (response.ok) {
      const p = response.product || {};
      const label = p.action === "refreshed" ? "Refreshed ✓" : "Imported ✓";
      const detail = [p.variantCount != null ? `${p.variantCount} variants` : null, p.imageCount != null ? `${p.imageCount} images` : null]
        .filter(Boolean)
        .join(" · ");
      setState(btn, `${label} ${p.name ? "— " + String(p.name).slice(0, 40) : ""}${detail ? " (" + detail + ")" : ""}`, {
        disabled: true,
        bg: "#4a5d43",
        done: true,
      });
      // Allow a re-import after a while (e.g. CJ data changed).
      setTimeout(() => setState(btn, `Import to Store (PID ${pid})`), 8000);
    } else {
      const err = String(response.error || "Unknown error").slice(0, 90);
      setState(btn, `Failed: ${err}`, { disabled: true, bg: "#8c3b2e" });
      setTimeout(() => setState(btn, `Import to Store (PID ${pid})`), 8000);
    }
  }

  function init() {
    const pid = extractPid(location.href);
    if (!pid) return; // not a product page (covers /list/ and everything else)
    injectButton(pid);

    // SPA re-render guard: re-inject whenever our node disappears, while the
    // URL still matches a product page. Cheap check on each mutation batch.
    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID) && extractPid(location.href)) {
        injectButton(extractPid(location.href));
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
