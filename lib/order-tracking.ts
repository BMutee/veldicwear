import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;

type TrackingPayload = {
  orderId: string;
  expiresAt: number;
};

function trackingSecret() {
  const secret = process.env.ORDER_TRACKING_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Order tracking is not configured.");
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", trackingSecret()).update(payload).digest("base64url");
}

export function createOrderTrackingToken(orderId: string) {
  const payload = Buffer.from(
    JSON.stringify({ orderId, expiresAt: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyOrderTrackingToken(token: string): string | null {
  const [payload, suppliedSignature, ...extra] = token.split(".");
  if (!payload || !suppliedSignature || extra.length) return null;

  const expectedSignature = sign(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TrackingPayload;
    if (!decoded.orderId || !Number.isInteger(decoded.expiresAt) || decoded.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded.orderId;
  } catch {
    return null;
  }
}

export function getOrderTrackingUrl(token: string) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl}/track-order?token=${encodeURIComponent(token)}`;
}
