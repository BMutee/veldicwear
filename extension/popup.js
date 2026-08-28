/** Popup: manage store API base URL + extension API key in chrome.storage.local. */

const DEFAULT_BASE_URL = "http://localhost:3000";

const statusEl = document.getElementById("status");
const statusText = document.getElementById("status-text");
const form = document.getElementById("form");
const baseUrlInput = document.getElementById("base-url");
const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save");

function setStatus(kind, text) {
  statusEl.className = `status ${kind}`;
  statusText.textContent = text;
}

function normalizeBaseUrl(raw) {
  let url = (raw || "").trim().replace(/\/+$/, "");
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

async function loadAndRender() {
  const { storeBaseUrl, extensionApiKey } = await chrome.storage.local.get([
    "storeBaseUrl",
    "extensionApiKey",
  ]);

  baseUrlInput.value = storeBaseUrl || "";

  if (extensionApiKey && storeBaseUrl) {
    setStatus("ok", "Connected — settings saved.");
  } else if (extensionApiKey) {
    setStatus("bad", "API key saved, but no store URL set.");
  } else {
    setStatus("bad", "Not configured — enter your store URL and API key below.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const base = normalizeBaseUrl(baseUrlInput.value);
  const key = apiKeyInput.value.trim();

  if (!base) {
    setStatus("bad", "Store URL is required (e.g. https://your-store.com).");
    return;
  }
  if (!/^vw_[A-Za-z0-9_-]{20,}$/.test(key)) {
    setStatus("bad", 'That doesn\'t look like a valid key — it should start with "vw_".');
    return;
  }
  try {
    // Request (optional) host permission for the store origin. Must run in the
    // click gesture. The /* path wildcard covers any port on localhost.
    const granted = await chrome.permissions.request({ origins: [`${base}/*`] });
    if (!granted) {
      setStatus("bad", "Permission to contact the store URL was denied.");
      return;
    }

    // Validate reachability/shape before saving. The endpoint 401s without a
    // valid key but must not be a network error.
    const res = await fetch(`${base}/api/extension/cj-import`, { method: "HEAD" });
    if (res.status === 0) throw new Error("unreachable");
  } catch {
    setStatus("bad", `Could not reach ${base} — check the URL and that the store is running.`);
    return;
  }

  await chrome.storage.local.set({ storeBaseUrl: base, extensionApiKey: key });
  apiKeyInput.value = "";
  setStatus("ok", "Connected — settings saved.");
});

loadAndRender().catch((err) => {
  setStatus("bad", `Failed to load settings: ${err?.message ?? err}`);
});
