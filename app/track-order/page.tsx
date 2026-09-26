import { Suspense } from "react";
import type { Metadata } from "next";
import TrackOrderClient from "./TrackOrderClient";

/**
 * Server shell for /track-order.
 *
 * The interactive half lives in TrackOrderClient because it reads `?token=`
 * through useSearchParams(), which must sit inside a Suspense boundary, and
 * because a client component cannot export route metadata. This mirrors the
 * app/checkout/success split in this repo.
 */
export const metadata: Metadata = {
  title: "Track Order | Veldic Wear",
  description:
    "Follow your Veldic Wear order from confirmation to delivery using the tracking link in your order confirmation email.",
};

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAFAF9]">
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="font-sans text-sm text-[#78716C]">Loading your order&hellip;</p>
          </div>
        </main>
      }
    >
      <TrackOrderClient />
    </Suspense>
  );
}
