/**
 * MV3 service worker — performs the actual import call so the content
 * script never talks to the network directly (keeps CJ page context clean
 * and avoids CORS/credential concerns).
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "cj-import" || !message.pid) return false;

  (async () => {
    try {
      const { storeBaseUrl, extensionApiKey } = await chrome.storage.local.get([
        "storeBaseUrl",
        "extensionApiKey",
      ]);
      if (!storeBaseUrl || !extensionApiKey) {
        sendResponse({ ok: false, error: "Not configured — set store URL and API key in the extension popup." });
        return;
      }

      const base = String(storeBaseUrl).replace(/\/+$/, "");
      const url = `${base}/api/extension/cj-import`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${extensionApiKey}`,
        },
        body: JSON.stringify({ productId: message.pid }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        sendResponse({ ok: false, error: "Rate limited — too many imports this minute. Try again shortly." });
        return;
      }
      if (res.status === 401) {
        sendResponse({ ok: false, error: "Invalid or revoked API key — generate a new one in Admin → Integrations." });
        return;
      }
      if (res.ok && data.ok) {
        sendResponse({ ok: true, action: data.action, product: data.product || {} });
      } else {
        sendResponse({ ok: false, error: data.error || `Store API returned HTTP ${res.status}` });
      }
    } catch (err) {
      sendResponse({ ok: false, error: `Network error: ${err && err.message ? err.message : err}` });
    }
  })();

  return true; // async sendResponse
});
