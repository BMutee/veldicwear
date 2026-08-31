import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { getCJOpenId } from "@/lib/cj";
import { importCJProduct, type CJImportResult } from "@/lib/cj-import";

type CJWebhookMessage = {
  messageId?: string;
  type?: string;
  messageType?: string;
  openId?: string | number;
  params?: Record<string, unknown>;
};

function computeSignature(openId: string, body: Buffer) {
  return crypto
    .createHmac("sha256", Buffer.from(openId, "utf-8"))
    .update(body)
    .digest("base64");
}

export async function POST(request: NextRequest) {
  const sign = request.headers.get("sign") ?? "";
  const openId = await getCJOpenId();
  const rawBody = await request.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);
  const expected = computeSignature(openId, bodyBuffer);

  if (!crypto.timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(sign, "utf-8"))) {
    return NextResponse.json({ code: 401, result: false, message: "Invalid signature." }, { status: 401 });
  }

  let parsedBody: CJWebhookMessage;
  try {
    parsedBody = JSON.parse(bodyBuffer.toString("utf-8")) as CJWebhookMessage;
  } catch {
    return NextResponse.json({ code: 400, result: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const type = parsedBody.type;
  const messageType = parsedBody.messageType;
  const params = parsedBody.params ?? {};

  // "List to store" on the CJ website fires a PRODUCT message when a product
  // is created or updated for this store. Auto-import the product so it
  // appears in the store catalog without manual admin import.
  if (type === "PRODUCT") {
    const pid = typeof params.pid === "string" ? params.pid : "";
    if (!pid) {
      return NextResponse.json({ code: 200, result: true, message: "ok" });
    }

    try {
      const result: CJImportResult = await importCJProduct(pid);
      console.log(
        `[CJ webhook] PRODUCT ${messageType} pid=${pid} ${result.existed ? "updated existing" : "imported new"} (${result.variantsSynced} variants)`
      );
    } catch (error) {
      console.error(`[CJ webhook] Failed to import product pid=${pid}:`, error);
      // Return ok so CJ does not retry forever; the error is logged for review.
    }
  }

  // Keep product data fresh when CJ pushes product/variant/stock updates.
  if (type === "VARIANT" || type === "STOCK") {
    const pid = typeof params.pid === "string" ? params.pid : "";
    if (pid) {
      try {
        const result: CJImportResult = await importCJProduct(pid);
        console.log(
          `[CJ webhook] ${type} ${messageType} pid=${pid} refreshed (${result.variantsSynced} variants)`
        );
      } catch (error) {
        console.error(`[CJ webhook] Failed to refresh product pid=${pid}:`, error);
      }
    }
  }

  return NextResponse.json({ code: 200, result: true, message: "ok" });
}
