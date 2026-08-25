/**
 * Sanitize HTML for safe rendering via dangerouslySetInnerHTML.
 * Removes script tags, event handlers, javascript: URLs, and other XSS vectors.
 */
export function sanitizeHtml(dirty: string): string {
  let clean = dirty;
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Attribute values may be quoted or unquoted.  Handle both forms so that
  // href=javascript:... cannot bypass the rich-text sanitizer.
  clean = clean.replace(/\s(href|src)\s*=\s*(?:"\s*(?:javascript|data):[^"]*"|'\s*(?:javascript|data):[^']*'|(?:javascript|data):[^\s>]+)/gi, ' $1=""');
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

/** Allow safe internal or HTTP(S) destinations for editor-managed CTA links. */
export function sanitizeCtaUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

export function parseCtaFields(
  labelRaw: unknown,
  urlRaw: unknown
): { ctaLabel: string | null; ctaUrl: string | null; error?: string } {
  const ctaLabel = typeof labelRaw === "string" ? labelRaw.trim() : "";
  const rawUrl = typeof urlRaw === "string" ? urlRaw.trim() : "";
  const hasLabel = Boolean(ctaLabel);
  const hasUrl = Boolean(rawUrl);

  if (hasLabel !== hasUrl) {
    return {
      ctaLabel: null,
      ctaUrl: null,
      error: "Button text and Button link must both be provided or both left empty.",
    };
  }
  if (!hasLabel) return { ctaLabel: null, ctaUrl: null };

  const ctaUrl = sanitizeCtaUrl(rawUrl);
  if (!ctaUrl) {
    return {
      ctaLabel: null,
      ctaUrl: null,
      error: "Button link must be an internal path or a valid http(s) URL.",
    };
  }
  return { ctaLabel, ctaUrl };
}
