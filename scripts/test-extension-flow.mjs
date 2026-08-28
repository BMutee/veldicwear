/**
 * Confirmations 2 + 4: run the REAL extension/content.js and extension/background.js
 * under stubbed browser APIs (real Node fetch) against the live dev server.
 *
 * Usage: npx tsx --env-file=.env scripts/test-extension-flow.mjs <rawApiKey> [baseUrl]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE_URL = process.argv[3] ?? "http://localhost:3000";
const RAW_KEY = process.argv[2];
if (!RAW_KEY) {
  console.error("usage: node test-extension-flow.mjs <rawApiKey> [baseUrl]");
  process.exit(1);
}

const PID = "2508300653521615300";
const PRODUCT_URL = `https://cjdropshipping.com/product/2024-new-fold-sunglasses-p-${PID}.html`;

/* ---------- minimal DOM/browser stubs ---------- */

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.style = {};
    this.dataset = {};
    this.textContent = "";
    this.disabled = false;
    this.listeners = {};
    this.children = [];
    this.attached = false;
    this.id = "";
  }
  setAttribute(k, v) {
    if (k === "id") this.id = v;
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  dispatch(type, event) {
    for (const fn of this.listeners[type] ?? []) fn.call(this, event);
  }
  appendChild(child) {
    this.children.push(child);
    child.attached = true;
    scheduleMutation();
    return child;
  }
}

class FakeDocument extends FakeElement {
  constructor() {
    super("#document");
    this.documentElement = new FakeElement("html");
    this.readyState = "complete";
    this.created = [];
  }
  createElement(tag) {
    const el = new FakeElement(tag);
    this.created.push(el);
    return el;
  }
  getElementById(id) {
    return this.documentElement.children.find((c) => c.id === id && c.attached) ?? null;
  }
}

const doc = new FakeDocument();
let locationHref = PRODUCT_URL;

class FakeMutationObserver {
  constructor(cb) {
    this.cb = cb;
    FakeMutationObserver.instances.push(this);
  }
  observe() {}
  static instances = [];
}
function scheduleMutation() {
  // Fire observers async, like a real browser.
  queueMicrotask(() => FakeMutationObserver.instances.forEach((o) => o.cb([], o)));
}

let stored = { storeBaseUrl: BASE_URL, extensionApiKey: RAW_KEY };
const chrome = {
  storage: {
    local: {
      async get(keys) {
        const out = {};
        for (const k of keys) out[k] = stored[k];
        return out;
      },
      async set(obj) {
        stored = { ...stored, ...obj };
      },
    },
  },
  runtime: {
    listeners: [],
    onMessage: {
      addListener(fn) {
        chrome.runtime.listeners.push(fn);
      },
    },
    // Content script side: route message to the background listener.
    async sendMessage(message) {
      return new Promise((resolve) => {
        let settled = false;
        const sendResponse = (v) => {
          if (!settled) {
            settled = true;
            resolve(v);
          }
        };
        for (const fn of chrome.runtime.listeners) fn(message, {}, sendResponse);
      });
    },
  },
};

Object.assign(globalThis, {
  document: doc,
  location: { get href() { return locationHref; } },
  MutationObserver: FakeMutationObserver,
  chrome,
  queueMicrotask,
});

/* ---------- load the REAL extension scripts ---------- */

vm.runInThisContext(readFileSync(join(root, "extension/background.js"), "utf8"), {
  filename: "background.js",
});
vm.runInThisContext(readFileSync(join(root, "extension/content.js"), "utf8"), {
  filename: "content.js",
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(10); // content script init (readyState=complete => sync, plus microtasks)

const networkLog = []; // every fetch made by the extension code under test
const realFetch = globalThis.fetch;
globalThis.fetch = (...args) => {
  networkLog.push(String(args[0]));
  return realFetch(...args);
};

const results = [];
function assert(cond, label) {
  results.push([cond, label]);
  console.log(cond ? "PASS" : "FAIL", label);
  if (!cond) process.exitCode = 1;
}

/* ---- 2a. reliable injection: button present right after script load ---- */
const findBtn = () => doc.documentElement.children.find((c) => c.id === "veldic-import-btn");
assert(!!findBtn(), "2a: button injected immediately on product page load");
doc.documentElement.appendChild(doc.createElement("div")); // SPA hydrates late — must not duplicate
await sleep(20);
const btnCount = doc.documentElement.children.filter((c) => c.id === "veldic-import-btn").length;
assert(btnCount === 1, `2a: late SPA mount does not duplicate the button (count=${btnCount})`);

/* ---- 2b. node removal => MutationObserver re-injection ---- */
const fireObservers = () => FakeMutationObserver.instances.forEach((o) => o.cb([], o));
findBtn().attached = false; // SPA re-render wipes the node
doc.documentElement.children = doc.documentElement.children.filter((c) => c !== findBtn());
fireObservers(); // real browser fires the observer on the mutation
await sleep(50);
assert(!!findBtn() && findBtn().attached, "2b: button re-injected after removal");

/* ---- 3. zero network requests to cjdropshipping.com so far ---- */
const cjRequests = networkLog.filter((u) => /cjdropshipping\.com/.test(u));
assert(cjRequests.length === 0, "3: zero fetches to cjdropshipping.com (only location.href read)");

/* ---- 4. full click -> background -> Step 2 endpoint (existing pid => refreshed) ---- */
const btn = findBtn();
btn.dispatch("click", { currentTarget: btn });
await sleep(20000); // real fetch to dev server (first-compile) + CJ API round-trip
assert(/Refreshed ✓|Imported ✓/.test(btn.textContent), `4: button shows success state (got: "${btn.textContent.slice(0, 60)}")`);

/* ---- no-key graceful handling: clear key, click => guidance, not silent ---- */
const saved = stored.extensionApiKey;
delete stored.extensionApiKey;
await sleep(5000); // let the first click's 4s self-reset timer fully expire
btn.dispatch("click", { currentTarget: btn });
await sleep(500); // check before the no-key hint's own 4s reset fires
assert(/popup|icon|configure|key/i.test(btn.textContent), `graceful no-key handling (got: "${btn.textContent.slice(0, 60)}")`);
stored.extensionApiKey = saved;

/* ---- 5. legacy ?id= URL also works (fresh page load => fresh DOM + re-run) ---- */
networkLog.length = 0;
doc.documentElement.children = []; // fresh page load => fresh DOM
locationHref = `https://cjdropshipping.com/product-detail.html?id=${PID}`;
vm.runInThisContext(readFileSync(join(root, "extension/content.js"), "utf8"), {
  filename: "content.js (legacy-url load)",
});
await sleep(50);
assert(!!findBtn() && /Import/.test(findBtn().textContent), "5: legacy ?id= URL shows button");
assert(networkLog.filter((u) => /cjdropshipping\.com/.test(u)).length === 0, "3b: still zero CJ fetches on legacy URL");

console.log(results.every(([c]) => c) ? "ALL FLOW CHECKS PASS" : "FLOW CHECKS FAILED");

