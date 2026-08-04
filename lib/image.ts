export function normalizeImageSrc(src: unknown): string {
  if (typeof src !== "string" || !src.trim()) {
    return "/products/hoodie.jpg";
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  if (src.startsWith("/")) {
    return src;
  }

  try {
    const url = new URL(src);
    return url.toString();
  } catch {
    return `/${src.replace(/^\/+/, "").trim()}` || "/products/hoodie.jpg";
  }
}
