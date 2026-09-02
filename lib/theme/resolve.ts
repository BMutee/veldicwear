// ─── The universal settings resolver ─────────────────────────────────────────
// Horizon resolves settings identically at three scopes — global theme
// settings, section settings, and block settings:
//
//     schema defaults  ←  overridden by  ←  stored instance values
//
// with two live cross-cutting behaviors:
//   1. a control's `default` may reference another control's value via
//      `"{{ settings.other_id }}"` (dependency chain), and
//   2. a control's `visible_if` expression is re-evaluated against the CURRENT
//      (possibly unsaved) values every time anything changes.
//
// One function, three call-sites — global settings, section settings and
// block settings all resolve through `resolveSettings()`.

import type { SettingDef, SettingValue, SettingValues } from "./types";

// ── Default resolution ───────────────────────────────────────────────────────

/**
 * Resolve one control's default. Supports cross-setting references of the
 * form `"{{ settings.other_id }}"` which read the CURRENT value of another
 * control (falling back through the global settings object).
 */
export function resolveDefault(
  def: SettingDef,
  currentValues: SettingValues,
  globalSettings: SettingValues = {}
): SettingValue | undefined {
  const raw = def.default;
  if (typeof raw !== "string") return raw;
  const ref = /^\{\{\s*settings\.([\w-]+)\s*\}\}$/.exec(raw.trim());
  if (!ref) return raw;
  const id = ref[1];
  const local = currentValues[id];
  if (local !== undefined) return local;
  return globalSettings[id] ?? undefined;
}

/**
 * Merge schema defaults with stored values for a list of setting defs.
 *
 * - `stored` wins over `default` (the instance overlay).
 * - number-ish controls clamp to [min, max] and coerce numeric strings.
 * - `header`/`paragraph` defs produce no values.
 */
export function resolveSettings(
  defs: SettingDef[],
  stored: SettingValues | null | undefined,
  globalSettings: SettingValues = {}
): SettingValues {
  const out: SettingValues = {};
  const bag = stored ?? {};
  for (const def of defs) {
    if (def.type === "header" || def.type === "paragraph") continue;
    let value: SettingValue;
    if (bag[def.id] !== undefined && bag[def.id] !== null) {
      value = coerce(def, bag[def.id]);
    } else {
      const fallback = resolveDefault(def, bag, globalSettings);
      value = fallback === undefined ? "" : coerce(def, fallback);
    }
    out[def.id] = value;
  }
  return out;
}

function coerce(def: SettingDef, value: SettingValue): SettingValue {
  switch (def.type) {
    case "number":
    case "range": {
      const n = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(n)) return def.min ?? 0;
      return clamp(n, def.min ?? -Infinity, def.max ?? Infinity);
    }
    case "breakpoint_range": {
      const v = value as Partial<{ mobile: unknown; desktop: unknown }> | null;
      const min = def.min ?? 0;
      const max = def.max ?? Infinity;
      const pick = (raw: unknown, fb: number) => {
        const n = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(n) ? clamp(n, min, max) : fb;
      };
      const fbDef = def.default as Partial<{ mobile: number; desktop: number }> | undefined;
      return {
        mobile: pick(v?.mobile, fbDef?.mobile ?? Math.min(min, 24)),
        desktop: pick(v?.desktop, fbDef?.desktop ?? Math.max(min, 48)),
      };
    }
    case "checkbox":
      return value === true || value === "true";
    case "product_picker":
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
    case "repeater":
      return Array.isArray(value) ? value : [];
    default:
      return typeof value === "string" ? value : value === null ? "" : value;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// ── visible_if expression evaluation ─────────────────────────────────────────
// Tiny safe expression language (no eval):
//   expr   := and ( "or" and )*
//   and    := atom ( "and" atom )*
//   atom   := "(" expr ")" | comparison | ref
//   comparison := ref ("==" | "!=") operand
//   operand := "blank" | quoted | number | true | false | ref
//   ref    := "settings.x" | "x"
// Blank means undefined / null / "" (Liquid-style: 0 and false are truthy).

export function evaluateVisibleIf(
  expression: string | undefined,
  values: SettingValues,
  globalSettings: SettingValues = {}
): boolean {
  if (!expression || !expression.trim()) return true;
  const source = expression.replace(/^\s*\{\{/, "").replace(/\}\}\s*$/, "").trim();
  try {
    return parseOr(tokenize(source), (path) => lookup(values, globalSettings, path));
  } catch {
    // A malformed expression must never break the editor — fail visible.
    return true;
  }
}

function lookup(values: SettingValues, globalSettings: SettingValues, path: string): SettingValue {
  const id = path.startsWith("settings.") ? path.slice("settings.".length) : path;
  if (values[id] !== undefined) return values[id];
  return globalSettings[id] ?? null;
}

type Tokens = string[];

function tokenize(src: string): Tokens {
  const tokens: string[] = [];
  const re = /\s*(\(|\)|==|!=|&&|\|\||"[^"]*"|'[^']*'|[^\s()]+)/g;
  let match: RegExpExecArray | null;
  let last = 0;
  while ((match = re.exec(src)) !== null) {
    if (match.index > last && src.slice(last, match.index).trim()) {
      throw new Error(`Unexpected token near "${src.slice(last, match.index)}"`);
    }
    last = re.lastIndex;
    tokens.push(match[1]);
  }
  return tokens;
}

type Lookup = (path: string) => SettingValue;

function parseOr(tokens: Tokens, lookupFn: Lookup): boolean {
  let result = parseAnd(tokens, lookupFn);
  while (tokens.length && tokens[0].toUpperCase() === "OR") {
    tokens.shift();
    const rhs = parseAnd(tokens, lookupFn);
    result = result || rhs;
  }
  return result;
}

function parseAnd(tokens: Tokens, lookupFn: Lookup): boolean {
  let result = parseAtom(tokens, lookupFn);
  while (tokens.length && tokens[0].toUpperCase() === "AND") {
    tokens.shift();
    const rhs = parseAtom(tokens, lookupFn);
    result = result && rhs;
  }
  return result;
}

function parseAtom(tokens: Tokens, lookupFn: Lookup): boolean {
  if (!tokens.length) throw new Error("Unexpected end of expression");
  if (tokens[0] === "(") {
    tokens.shift();
    const inner = parseOr(tokens, lookupFn);
    if (tokens.shift() !== ")") throw new Error("Missing )");
    return inner;
  }
  const ref = tokens.shift()!;
  if (tokens[0] === "==" || tokens[0] === "!=") {
    const op = tokens.shift()!;
    const operand = parseOperand(tokens, lookupFn);
    const equal = compareValues(lookupFn(ref), operand);
    return op === "==" ? equal : !equal;
  }
  if (tokens[0] === "&&") {
    tokens.shift();
    const rhs = parseAtom(tokens, lookupFn);
    return isTruthy(lookupFn(ref)) && rhs;
  }
  if (tokens[0] === "||") {
    tokens.shift();
    const rhs = parseAtom(tokens, lookupFn);
    return isTruthy(lookupFn(ref)) || rhs;
  }
  return isTruthy(lookupFn(ref));
}
function parseOperand(tokens: Tokens, lookupFn: Lookup): SettingValue {
  if (!tokens.length) throw new Error("Missing operand");
  const token = tokens.shift()!;
  if (token === "blank" || token === "empty") return null;
  if (/^".*"$/.test(token) || /^'.*'$/.test(token)) return token.slice(1, -1);
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  if (token === "true") return true;
  if (token === "false") return false;
  return lookupFn(token);
}

function isBlank(v: SettingValue): boolean {
  return v === null || v === undefined || v === "";
}

function isTruthy(v: SettingValue): boolean {
  return !isBlank(v) && v !== false;
}

function compareValues(a: SettingValue, b: SettingValue): boolean {
  if (isBlank(a) && isBlank(b)) return true;
  if (typeof a === "number" && typeof b === "number") return a === b;
  return String(a) === String(b);
}

/** Convenience: which defs are currently visible given live values. */
export function visibleDefs(
  defs: SettingDef[],
  values: SettingValues,
  globalSettings: SettingValues = {}
): SettingDef[] {
  return defs.filter((def) => evaluateVisibleIf(def.visible_if, values, globalSettings));
}

