import type { Metadata } from "next";
import ReturnsClient from "./ReturnsClient";
import { RETURN_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/returns";

/**
 * /returns — the "Start a return" portal.
 *
 * This URL used to be a redirect to the Return & Refund Policy (the seeded
 * footer link pointed here long before either page existed). The policy still
 * lives at /returns-refund-policy and is linked from here; what lives here now
 * is the thing a customer actually wants when something doesn't fit: a form.
 *
 * The interactive half is ReturnsClient because it owns the order it looks up.
 * No search params are read, so unlike /track-order it needs no Suspense
 * boundary.
 */

export const metadata: Metadata = {
  title: "Start a Return | Veldic Wear",
  description: `Start a return on a Veldic Wear order. ${RETURN_WINDOW_DAYS} days from delivery, unworn and tagged, full refund to your original payment method.`,
};

export default function ReturnsPage() {
  return (
    <>
      <ReturnsClient />
      {/* For crawlers and for anyone who would rather read the rules first. */}
      <noscript>
        <p className="mx-auto max-w-3xl px-4 pb-16 font-sans text-sm text-[#44403C] sm:px-6 lg:px-8">
          Starting a return needs JavaScript. You can email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your order number instead, and we
          will take it from there.
        </p>
      </noscript>
    </>
  );
}

