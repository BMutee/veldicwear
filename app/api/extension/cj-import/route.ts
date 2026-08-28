import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limiter";
import {
  EXTENSION_KEY_PREFIX,
  validateExtensionApiKey,
  touchExtensionKeyLastUsed,
} from "@/lib/extension-api-keys";
import { importCJProduct, syncProductVariantsByPid } from "@/lib/cj-import";

export const runtime = "nodejs";

/**
 * POST /api/extension/cj-import
 *
 * Machine-to-machine entry point for the browser extension. Auth is a Bearer
 * API key (hashed in the ExtensionApiKey table) — deliberately distinct from
 * the admin-session-guarded /api/admin routes.
 *
 * Body: { productId: "<CJ pid>" }
 *
 * - Product already imported -> variant/image refresh via
 *   syncProductVariantsByPid (lighter, doesn't touch product fields).
 * - New product -> full importCJProduct (creates product + variants + images).
 *
 * Rate limits:
 * - per key: 10 imports / minute (imports hit the CJ API and are expensive)
 * - per IP: 30 auth attempts / 5 min (slows key brute-forcing)
 */

const CJ_PID_PATTERN = /^\d{10,25}$/;

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  // Reject tokens that don't even look like our keys — saves a DB hit.
  if (!token.startsWith(EXTENSION_KEY_PREFIX) || token.length < 40) return null;
  return token;
}

export async function POST(request: Request) {
  // --- Auth ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const authLimit = checkRateLimit(`ext-auth:${ip}`, {
    maxAttempts: 30,
    windowSeconds: 300,
  });
  if (!authLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests. Try again later.",
        retryAfterSeconds: Math.max(1, Math.ceil((authLimit.resetAt - Date.now()) / 1000)),
      },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((authLimit.resetAt - Date.now()) / 1000))) } }
    );
  }

  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing or malformed Authorization header. Expected: Bearer <api key>." },
      { status: 401 }
    );
  }

  const apiKey = await validateExtensionApiKey(token);
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Invalid or revoked API key." },
      { status: 401 }
    );
  }

  // --- Per-key rate limit (after auth so the limit is attributable) ---
  const importLimit = checkRateLimit(`ext-import:${apiKey.id}`, {
    maxAttempts: 10,
    windowSeconds: 60,
  });
  if (!importLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((importLimit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded (10 imports per minute per key).", retryAfterSeconds: retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  // --- Body validation ---
  let productId: unknown;
  try {
    const body = (await request.json()) as { productId?: unknown };
    productId = body?.productId;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON: { productId: string }." },
      { status: 400 }
    );
  }

  if (typeof productId !== "string" || productId.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "Missing required field: productId (a CJ product ID string)." },
      { status: 400 }
    );
  }
  const pid = productId.trim();
  if (!CJ_PID_PATTERN.test(pid)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Malformed productId "${pid.slice(0, 40)}". Expected a numeric CJ product ID (10-25 digits), e.g. "2508300653521615300".`,
      },
      { status: 400 }
    );
  }

  // --- Import or refresh ---
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: pid },
      select: { id: true },
    });

    let action: "imported" | "refreshed";
    if (existingProduct) {
      const refreshed = await syncProductVariantsByPid(pid);
      if (!refreshed) {
        return NextResponse.json(
          { ok: false, error: "Product exists locally but could not be resolved for refresh." },
          { status: 500 }
        );
      }
      action = "refreshed";
    } else {
      await importCJProduct(pid);
      action = "imported";
    }

    await touchExtensionKeyLastUsed(apiKey.id);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: pid },
      include: { _count: { select: { images: true, variants: true } } },
    });

    return NextResponse.json({
      ok: true,
      action,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: product.image,
        videoUrl: product.videoUrl,
        imageCount: product._count.images,
        variantCount: product._count.variants,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error while importing from CJ.";
    console.error(`[extension/cj-import] Failed for pid ${pid}:`, err);
    return NextResponse.json(
      {
        ok: false,
        error: `CJ import failed: ${message}`,
        hint: "Verify the product ID exists on CJ Dropshipping and try again.",
      },
      { status: 502 }
    );
  }
}
