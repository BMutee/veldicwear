/**
 * HTML → plain text for product descriptions.
 *
 * CJ Dropshipping (and most supplier feeds) deliver descriptions as rich HTML.
 * Veldic stores and edits them as plain text — Admin → Products uses a plain
 * textarea and the storefront renders the string as text — so the markup is
 * converted by htmlToPlainText() when a description enters the app and when a
 * legacy description is displayed.
 *
 * The converter keeps the *meaning* of the markup:
 *   - block boundaries (<p>, <div>, <h1>…, </tr>, …) become line breaks
 *   - <br> becomes a line break and <li> becomes a "• " bullet
 *   - table cells keep their columns, separated by " | "
 *   - <img>, <script>, <style>, … are dropped (they carry no readable text)
 *   - HTML entities (&nbsp;, &amp;, &#39;, …) are decoded
 *   - runs of spaces and blank lines are collapsed
 *
 * No DOM is used, so it works in route handlers, client components and the
 * seed/import scripts alike. The conversion is stable for normal plain text:
 * feeding an already-converted description back returns the same string.
 */

/** Tags whose whole content is invisible (never readable text). */
const INVISIBLE_TAGS = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "embed",
  "video",
  "audio",
  "form",
  "select",
  "textarea",
];

/** Replaced elements — markup only, never any readable text inside. */
const MEDIA_TAGS = [
  "img",
  "picture",
  "source",
  "track",
  "input",
  "button",
  "link",
  "meta",
  "base",
  "area",
  "col",
  "param",
  "map",
];

/** Tags that start a new line (or end one) in the plain-text output. */
const BLOCK_TAGS = [
  "p",
  "div",
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "main",
  "nav",
  "figure",
  "figcaption",
  "blockquote",
  "pre",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "ul",
  "ol",
  "dl",
  "dt",
  "dd",
  "fieldset",
  "address",
  "details",
  "summary",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

const RE_COMMENT = /<!--[\s\S]*?-->/g;
/**
 * A value is treated as HTML only when it actually contains markup: a real tag,
 * a comment, or a *recognized* HTML entity. This is what lets ordinary plain
 * text such as "Material & care" or "fits sizes < 40" pass through untouched
 * instead of being normalized on every save.
 */
const RE_RECOGNIZED_ENTITY_SOURCE = "&(?:#x[0-9a-f]+;|#\\d+;|(?:amp|lt|gt|quot|apos|nbsp|ensp|emsp|thinsp|ndash|mdash|hellip|lsquo|rsquo|ldquo|rdquo|laquo|raquo|bull|middot|times|divide|deg|plusmn|trade|reg|copy|euro|pound|yen|cent|frac12|frac14|sup2|sup3);)";
const RE_PLAIN_TEXT_MARKUP = new RegExp(
  `<!--[\\s\\S]*?-->|<\\/?[a-zA-Z][a-z0-9]*(?:\\s[^<>]*)?/?>|${RE_RECOGNIZED_ENTITY_SOURCE}`
);
/** `<style>…</style>` and friends — tag *and* content go away. */
const RE_INVISIBLE_BLOCK = new RegExp(
  `<\\s*(${INVISIBLE_TAGS.join("|")})\\b[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`,
  "gi"
);
/** Any leftover invisible/media tag, opened or closed, self-closing or not. */
const RE_INVISIBLE_TAG = new RegExp(
  `<\\s*\\/?(?:${[...INVISIBLE_TAGS, ...MEDIA_TAGS].join("|")})\\b[^>]*>`,
  "gi"
);
const RE_BR = /<\s*br\b[^>]*>/gi;
const RE_HR = /<\s*hr\b[^>]*>/gi;
/** Table cells: the opening tag contributes nothing, the closing tag a column separator. */
const RE_CELL_OPEN = /<\s*t[hd]\b[^>]*>/gi;
const RE_CELL_CLOSE = /<\s*\/\s*t[hd]\b[^>]*>/gi;
/** A table row ends one output line; its opening tag contributes nothing. */
const RE_ROW_OPEN = /<\s*tr\b[^>]*>/gi;
const RE_ROW_CLOSE = /<\s*\/\s*tr\b[^>]*>/gi;
/** List items read as bullet lines rather than bare newlines. */
const RE_LIST_OPEN = /<\s*li\b[^>]*>/gi;
const RE_LIST_CLOSE = /<\s*\/\s*li\b[^>]*>/gi;
const RE_BLOCK_CLOSE = new RegExp(`<\\s*\\/\\s*(?:${BLOCK_TAGS.join("|")})\\s*>`, "gi");
const RE_BLOCK_OPEN = new RegExp(`<\\s*(?:${BLOCK_TAGS.join("|")})\\b[^>]*>`, "gi");
/** Anything tag-shaped that survived the passes above (inline <b>, <span>, …). */
const RE_ANY_TAG = /<\/?[a-zA-Z][a-z0-9]*[^>]*>|<![^>]*>/g;
/** Named entity → character. Numeric entities (&#39; / &#x27;) are handled below. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  bull: "•",
  middot: "·",
  times: "×",
  divide: "÷",
  deg: "°",
  plusmn: "±",
  trade: "™",
  reg: "®",
  copy: "©",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  frac12: "½",
  frac14: "¼",
  sup2: "²",
  sup3: "³",
};

const RE_ENTITY = /&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi;

/** Decode every entity in a single left-to-right pass (so "&amp;lt;" stays "&lt;"). */
function decodeEntities(value: string): string {
  return value.replace(RE_ENTITY, (match, body: string) => {
    if (body.startsWith("#")) {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/**
 * One line of output: single spaces, no table separators hanging off the edges
 * ("| 64 | 42.8 |" → "64 | 42.8").
 */
function cleanLine(line: string): string {
  return line
    .replace(/[\t\f\v\u00a0]+/g, " ")
    .replace(/ {2,}/g, " ")
    .trim()
    .replace(/^[|]+/, "")
    .replace(/[|]+$/, "")
    .trim();
}

/** Drop runs of blank lines and any padding at the start/end of the text. */
function collapseBlankLines(text: string): string {
  const kept: string[] = [];
  for (const line of text.split("\n")) {
    if (!line) {
      if (kept.length > 0 && kept[kept.length - 1] !== "") kept.push("");
      continue;
    }
    kept.push(line);
  }
  while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();
  return kept.join("\n").trim();
}

/**
 * Convert a stored description to readable plain text.
 * Text that is already plain comes back unchanged (edges trimmed).
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";

  // Plain text is only trimmed, never rewrapped. This keeps repeated admin saves
  // from collapsing intentional blank lines, and leaves lone "<", ">" and "&"
  // characters in ordinary copy alone.
  if (!RE_PLAIN_TEXT_MARKUP.test(html)) return html.trim();

  let text = html.replace(RE_COMMENT, " ");
  text = text.replace(RE_INVISIBLE_BLOCK, " ");
  text = text.replace(RE_BR, "\n");
  text = text.replace(RE_HR, "\n");
  text = text.replace(RE_INVISIBLE_TAG, " ");
  text = text.replace(RE_CELL_CLOSE, " | ");
  text = text.replace(RE_CELL_OPEN, "");
  text = text.replace(RE_ROW_CLOSE, "\n");
  text = text.replace(RE_ROW_OPEN, "");
  text = text.replace(RE_LIST_OPEN, "\n• ");
  text = text.replace(RE_LIST_CLOSE, "");
  text = text.replace(RE_BLOCK_CLOSE, "\n");
  text = text.replace(RE_BLOCK_OPEN, "\n");
  text = text.replace(RE_ANY_TAG, "");
  text = decodeEntities(text);

  return collapseBlankLines(text.split(/\r?\n/).map(cleanLine).join("\n"));
}

