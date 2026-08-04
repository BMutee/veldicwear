/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Removes script tags, event handlers, javascript: URLs, and other XSS vectors.
 */
export function sanitizeHtml(dirty: string): string {
  let clean = dirty;
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/\s(?:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, ' $1=""');
  clean = clean.replace(/\s(?:href|src)\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi, ' $1=""');
  clean = clean.replace(/<\/?(?:iframe|embed|object|frame|frameset|applet|form|input|textarea|select|button|link|meta|style)[^>]*>/gi, "");
  return clean;
}

// HTML entity references — defined via char codes to prevent auto-encoding
const AMP = String.fromCharCode(38) + "amp;";
const LT = String.fromCharCode(38) + "lt;";
const GT = String.fromCharCode(38) + "gt;";
const QUOT = String.fromCharCode(38) + "quot;";
const APOS = String.fromCharCode(38) + "#x27;";

/**
 * Escape text for safe embedding in HTML (prevents XSS in rendered content).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/[&]/g, AMP)
    .replace(/[<]/g, LT)
    .replace(/[>]/g, GT)
    .replace(/["]/g, QUOT)
    .replace(/[']/g, APOS);
}