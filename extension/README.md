# Veldic Store Import — Browser Extension (Manifest V3)

Adds a floating **“Import to Store”** button to CJ Dropshipping product
pages. Clicking it sends the product’s CJ ID to your store’s
`POST /api/extension/cj-import` endpoint, which imports/refreshes the
product server-side. The extension never reads CJ’s page content — the
product ID comes from the URL only.

Works in **Microsoft Edge** and **Google Chrome** (Manifest V3).

## Install (unpacked) in Edge

1. Open the extensions page: type `edge://extensions` in the address bar
   (Chrome: `chrome://extensions`).
2. Turn on **Developer mode** (toggle in the left/sidebar — bottom-left in
   Edge, top-right in Chrome).
3. Click **Load unpacked**.
4. Select this `extension/` folder (the one containing `manifest.json`).
5. (Optional) Pin the extension via the puzzle-piece/puzzle menu so the
   settings popup is one click away.

## Configure

1. In your store admin, go to **Admin → Integrations** and generate an
   Extension API key (starts with `vw_`). Copy it — it’s shown only once.
2. Click the extension’s icon to open the popup.
3. Enter:
   - **Store API base URL** — e.g. `https://your-store.com` (or
     `http://localhost:3000` during development).
   - **Extension API key** — the `vw_…` key from step 1.
4. Click **Save settings**. Edge will ask for permission to contact the
   store domain — allow it (this is a one-time, per-origin permission).
   The status line should read **Connected**.
   Keys are stored only in this browser’s local extension storage.

## Use

1. Open any CJ Dropshipping **product page**, e.g.
   `https://cjdropshipping.com/product/<name>-p-2508300653521615300.html`.
   A floating button appears in the bottom-right corner — including on
   pages where CJ shows a captcha/verification interstitial, as long as
   the product ID is in the URL.
2. Click **Import to Store**. The button shows progress, then
   **“Imported ✓”** (or **“Updated ✓”** if the product already existed) or
   an error message.
3. If no API key is configured, clicking the button tells you to open the
   popup (click the extension icon) and set it up first.

Category/list pages (`/list/…`) and other non-product pages get no button.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest: content-script URL patterns, host permissions, service worker |
| `content.js` | Extracts the product ID from the URL, injects/keeps alive the floating button |
| `background.js` | Service worker: performs the actual import call to the store API |
| `popup.html` / `popup.js` | Settings UI (store URL + API key), connection status |

## Security notes

- The API key is stored hashed server-side; the raw key lives only in
  this browser’s `chrome.storage.local` and is sent only as a Bearer
  token to your configured store domain.
- The extension makes **no requests to cjdropshipping.com** — it only
  reads `location.href`. All product data is fetched server-side by your
  store from CJ’s official API.
- Rate limiting (10 imports/minute per key) is enforced by the store API.
