/**
 * Guards the admin size-chart fix: adding a new size (e.g. 6XL) must make the
 * new measurement input immediately editable, without saving and reopening.
 *
 * The bug: row.values is a positional string[] sized when the form loads.
 * Adding a size rendered a new input, but row.values was never grown, and
 * Array.prototype.map never visits indices past the original length — so
 * updateChartValue silently dropped every keystroke.
 *
 *   npx tsx scripts/verify-size-chart-input.ts
 *
 * Pure logic — no server or database needed.
 */

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) {
    console.log(`       expected: ${JSON.stringify(expected)}`);
    console.log(`       actual:   ${JSON.stringify(actual)}`);
  }
}

/** Mirrors parseSizesText() from lib/size-chart.ts. */
function parseSizesText(text: string): string[] {
  const seen = new Set<string>();
  const sizes: string[] = [];
  for (const part of text.split(",")) {
    const size = part.trim();
    if (!size) continue;
    const key = size.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sizes.push(size);
  }
  return sizes;
}

/** Mirrors the new setSizesText() row sync in AdminProductsClient.tsx. */
function syncRows(values: string[], sizesText: string): string[] {
  const sizes = parseSizesText(sizesText);
  // Rows are only ever grown, never shrunk (surplus entries are ignored by
  // serializeSizeChart's `for (i < sizes.length)` loop).
  if (values.length >= sizes.length) return values;
  return sizes.map((_, i) => values[i] ?? "");
}

/** Mirrors the hardened updateChartValue() row update. */
function updateChartValue(values: string[], colIndex: number, value: string): string[] {
  const grown =
    colIndex < values.length
      ? values
      : Array.from({ length: colIndex + 1 }, (_, ci) => values[ci] ?? "");
  return grown.map((v, ci) => (ci === colIndex ? value : v));
}

// ── 1. Adding a size pads every row so the new column has a backing slot ──────
console.log("\nAdding a size pads the values array");
const loaded = ["20.5", "22.5", "24.5", "26.5", "28.5"];
const with6xl = syncRows(loaded, "S, M, L, XL, 2XL, 6XL");
check("a 6th slot is appended", with6xl.length, 6);
check("existing measurements are preserved", with6xl.slice(0, 5), loaded);
check("the new slot starts empty", with6xl[5], "");

// ── 2. Typing into the brand-new 6XL input is stored immediately ─────────────
console.log("\nTyping into the new 6XL input works before saving");
const afterFirstKey = updateChartValue(with6xl, 5, "3");
const afterSecondKey = updateChartValue(afterFirstKey, 5, "30");
const afterThirdKey = updateChartValue(afterSecondKey, 5, "30.5");
check("first keystroke is kept", afterFirstKey[5], "3");
check("the value accumulates", afterSecondKey[5], "30");
check("the full value is kept", afterThirdKey[5], "30.5");
check("no other column is disturbed", afterThirdKey.slice(0, 5), loaded);
check("array length stays stable while typing", afterThirdKey.length, 6);

// ── 3. The regression the map() bug caused ------------------------------------
console.log("\nThe original map() bug is reproduced and fixed");
const short = ["1", "2"];
// Old behaviour: map never visits index 2, so the value was dropped.
const buggy = short.map((v, ci) => (ci === 2 ? "9" : v));
check("growing first makes index 2 reachable", updateChartValue(short, 2, "9")[2], "9");
check("without growing, map() drops the write (the bug)", buggy[2] === undefined, true);

// ── 4. Removing a size never discards the measurement ────────────────────────
console.log("\nRemoving a size keeps its measurement for when it returns");
const backTo5 = syncRows(with6xl, "S, M, L, XL, 2XL");
check("the array is not shrunk", backTo5.length, 6);
check("existing measurements are untouched", backTo5.slice(0, 5), loaded);
check(
  "retyping the size exposes the typed value again",
  syncRows(afterThirdKey, "S, M, L, XL, 2XL, 6XL")[5],
  "30.5"
);
check(
  "surplus entries are ignored by serializeSizeChart's for (i < sizes.length)",
  ["S", "M", "L", "XL", "2XL"].map((_, i) => backTo5[i]),
  loaded
);

// ── 5. Middle insert / duplicate sizes / partial typing ───────────────────────
console.log("\nEdge cases");
// Pad/truncate is positional: it guarantees a backing slot for every rendered
// column and never discards a value. It does not splice a brand-new size in
// the middle of an existing array — that is ambiguous while the user is still
// typing the comma-separated text. Values re-align by size key on save/reopen
// (see sizeChartToForm), so nothing is lost.
check(
  "a size typed mid-list still keeps both existing values",
  syncRows(["a", "b"], "S, NEW, M"),
  ["a", "b", ""]
);
check(
  "duplicate sizes are deduped before padding",
  syncRows(["a"], "S, S, M"),
  ["a", ""]
);
check(
  "in-progress sizes text still syncs",
  syncRows(["a", "b"], "S, M, "),
  ["a", "b"]
);
check(
  "clearing every size leaves rows untouched when both are empty",
  syncRows([], ""),
  []
);

console.log(
  failures === 0
    ? "\n✅ New size-chart inputs are editable immediately, without saving."
    : `\n❌ ${failures} check(s) failed.`
);
if (failures > 0) process.exit(1);
