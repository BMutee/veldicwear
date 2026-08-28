// Confirmation 1: pid regex vs real URL patterns + list-page rejection.
const CANONICAL = /\/product\/(?:[^?]*-)?p-(\d{10,25})\.html/;
const LEGACY = /[?&]id=(\d{10,25})(?:&|$)/;
const LIST = /\/list\/|\.html\?.*[?&]id=[0-9a-f-]{36}/i;

function extractPid(url) {
  const m = CANONICAL.exec(url) || LEGACY.exec(url);
  if (!m) return null;
  const pid = m[1];
  if (/^0+$/.test(pid)) return null;
  if (LIST.test(url)) return null;
  return pid;
}

const PID = "2508300653521615300";
const cases = [
  // Real canonical pattern (slug + -p-<pid>.html)
  [`https://cjdropshipping.com/product/2024-new-fold-sunglasses-p-${PID}.html`, PID],
  // www variant
  [`https://www.cjdropshipping.com/product/2024-new-fold-sunglasses-p-${PID}.html`, PID],
  // Slugless form
  [`https://cjdropshipping.com/product/p-${PID}.html`, PID],
  // Legacy ?id= pattern
  [`https://cjdropshipping.com/product-detail.html?id=${PID}`, PID],
  // Interstitial URL (captcha redirect keeps pid) — must still match
  [`https://cjdropshipping.com/product/whatever-p-${PID}.html?captchaToken=abc`, PID],
  // List/category page — reject
  ["https://cjdropshipping.com/list/kitchen-tools-l-0a2b3c4d-1111-2222-3333-444455556666.html", null],
  // list-style id inside a query string — reject
  ["https://cjdropshipping.com/product-detail.html?lid=0a2b3c4d-1111-2222-3333-444455556666&id=12345", null],
  // pid too short (9 digits) — reject
  ["https://cjdropshipping.com/product/x-p-123456789.html", null],
  // all-zero pid — reject
  ["https://cjdropshipping.com/product/x-p-0000000000.html", null],
  // homepage — reject
  ["https://cjdropshipping.com/", null],
];

let ok = true;
for (const [url, expected] of cases) {
  const got = extractPid(url);
  const pass = got === expected;
  ok = ok && pass;
  console.log(pass ? "PASS" : "FAIL", url.slice(0, 88), "->", got);
}
process.exit(ok ? 0 : 1);
