// lib/stripe.ts
import Stripe from "stripe";

declare global {
   
  var __stripeClient: Stripe | undefined;
}

/**
 * Lazily construct the Stripe SDK client on first access.
 *
 * Why lazy:
 * - During `next build`, Next.js imports route modules to collect page data.
 *   If we eagerly construct Stripe with `new Stripe(process.env.STRIPE_SECRET_KEY ?? "")`
 *   AND that env var is missing, the Stripe SDK throws — which kills the build
 *   when the runtime secret is not exposed to the build worker.
 * - Defer construction to first property access so the module loads cleanly
 *   during build. The first actual API call at runtime still throws a clear
 *   error if STRIPE_SECRET_KEY is missing.
 */
function getStripe(): Stripe {
  if (globalThis.__stripeClient) return globalThis.__stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable. Set it in your deployment environment variables.",
    );
  }

  const client = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__stripeClient = client;
  }

  return client;
}

/**
 * Drop-in proxy that defers Stripe client construction until the first property
 * access. Existing call sites like `stripe.checkout.sessions.create(...)` continue
 * to work unchanged because the proxy forwards every property access to the real
 * client instance.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = client[prop as keyof Stripe];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
