import Link from "next/link";

/**
 * Public shipping policy page.
 *
 * Written as a static route (like app/privacy and app/terms) rather than a CMS
 * page: "shipping-policy" is already listed in the staticSlugs allow-list in
 * app/[slug]/page.tsx, so this page owns the URL and no DB row is required.
 *
 * Deliberately free of day counts. The transit window for a destination is
 * computed live on the product page, in the cart and at checkout
 * (components/DeliveryEstimate.tsx -> lib/getDeliveryEstimate.ts), so quoting
 * numbers here would only duplicate a value that can change.
 */
type ShippingDestination = {
  region: string;
  detail: string;
  extra?: string;
};

const SHIPPING_DESTINATIONS: ShippingDestination[] = [
  {
    region: "Canada",
    detail: "FREE standard shipping, no minimum \u2014 limited-time offer.",
  },
  {
    region: "United States",
    detail: "FREE standard shipping, no minimum \u2014 limited-time offer.",
    extra: "US prices include import duties \u2014 nothing to pay on delivery.",
  },
  {
    region: "Rest of World",
    detail: "FREE standard shipping, no minimum, to every destination we serve \u2014 limited-time offer.",
    extra: "Delivery time depends on the country and customs clearance.",
  },
];

const SUPPORT_EMAIL = "info@veldicwear.com";

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Support
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Shipping Policy
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            <strong className="text-[#1C1917]">Last updated:</strong> September 26, 2026
          </p>
          <div className="mt-4 space-y-2 rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">ⓘ Delivery estimates:</strong> Your estimated arrival is calculated on
              the product page and shown again in your cart and at checkout. Every estimate starts when your order
              ships, not at the time of purchase.
            </p>
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">Free shipping — limited time:</strong> Standard shipping is{" "}
              <strong className="text-[#1C1917]">free on every order</strong>, to every country we ship to &mdash; no
              minimum spend, no threshold to reach, no code to enter. This offer is available for a limited time and may
              end without notice.
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="mt-10 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
            Table of Contents
          </h2>
          <ul className="mt-4 space-y-2">
            {[
              ["#processing", "Order Processing"],
              ["#rates", "Shipping Rates & Delivery"],
              ["#tracking", "Tracking"],
              ["#customs", "Customs, Duties & Import Taxes"],
              ["#lost-damaged", "Lost, Delayed, or Damaged Shipments"],
              ["#address", "Shipping Address"],
              ["#contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex items-center gap-2 font-sans text-sm text-[#1C1917] underline decoration-[#CA8A04]/30 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                >
                  <span className="h-1 w-1 rounded-full bg-[#CA8A04]" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="mt-10 space-y-12">
          {/* Order Processing */}
          <section id="processing">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Order Processing
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Orders are processed and shipped within{" "}
                <strong className="text-[#1C1917]">2&ndash;5 business days</strong>. When new designs launch, processing
                may take a little longer. You&rsquo;ll receive a confirmation email with tracking as soon as your order
                ships.
              </p>
            </div>
          </section>
          {/* Shipping Rates & Delivery */}
          <section id="rates">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Shipping Rates &amp; Delivery
            </h2>
            <div className="mt-4 space-y-5 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Standard shipping is <strong className="text-[#1C1917]">free on every order</strong> for a limited
                time, to every country we ship to, with no minimum spend. There is no threshold to reach and no code
                to enter &mdash; it is simply free while the offer lasts.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {SHIPPING_DESTINATIONS.map((option) => (
                  <div key={option.region} className="flex flex-col border border-[#1C1917]/10 bg-white p-5">
                    <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[#1C1917]">
                      {option.region}
                    </h3>
                    <p className="mt-3 font-display text-xl font-black uppercase tracking-tight text-[#CA8A04]">
                      Free
                    </p>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-[#44403C]">{option.detail}</p>
                    {option.extra && (
                      <p className="mt-2 font-sans text-xs leading-5 text-[#78716C]">{option.extra}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="font-sans text-sm text-[#78716C]">
                Every delivery window is an estimate, not a guarantee &mdash; customs clearance and carrier delays can
                extend it. The estimate that applies to your order is the one shown on the product page, in your cart
                and at checkout.
              </p>
            </div>
          </section>
          {/* Tracking */}
          <section id="tracking">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Tracking</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Once your order ships, you&rsquo;ll receive a{" "}
                <strong className="text-[#1C1917]">tracking number by email</strong>. Tracking can take 24&ndash;48
                hours to start updating.
              </p>
              <p>
                You can also check the latest status any time on our{" "}
                <Link
                  href="/track-order"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  Track Order
                </Link>{" "}
                page.
              </p>
            </div>
          </section>

          {/* Customs, Duties & Import Taxes */}
          <section id="customs">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Customs, Duties &amp; Import Taxes
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                <strong className="text-[#1C1917]">United States:</strong> import duties are included in our US prices
                and prepaid by us &mdash; you pay nothing on delivery.
              </p>
              <p>
                <strong className="text-[#1C1917]">Other countries:</strong> orders may be subject to import duties,
                taxes, and customs fees set by the destination country. These charges are not included in your order
                total or shipping fee and are the responsibility of the recipient. We are required to declare the full
                value of all shipments. If a package is refused due to unpaid duties, any return shipping and fees may
                be deducted from your refund.
              </p>
            </div>
          </section>
          {/* Lost, Delayed, or Damaged Shipments */}
          <section id="lost-damaged">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Lost, Delayed, or Damaged Shipments
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Until your parcel reaches you, it is <strong className="text-[#1C1917]">our responsibility</strong>{" "}
                &mdash; if it is lost or damaged in transit, we replace it or refund you. There is nothing to add at
                checkout and no carrier claim for you to file; we handle that side of it.
              </p>
              <p>
                Report damaged shipments within <strong className="text-[#1C1917]">7 days of delivery</strong> and lost
                packages within <strong className="text-[#1C1917]">45 days of the order date</strong> &mdash; 90 days
                outside Canada and the US, where customs clearance alone can run past the 45th day &mdash; by emailing{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                with your order number and photos where applicable. Wrong items, manufacturing defects, and anything
                that&rsquo;s our fault are always covered in full.
              </p>
              <p>
                If tracking shows delivered but the parcel isn&rsquo;t there, check with your building and your
                neighbours first, then email us within{" "}
                <strong className="text-[#1C1917]">7 days of the delivery scan</strong>. Theft after delivery sits
                outside what any carrier covers, but we&rsquo;ll replace one parcel per customer every 12 months &mdash;
                see our{" "}
                <Link
                  href="/returns-refund-policy"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  Return &amp; Refund Policy
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Shipping Address */}
          <section id="address">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Shipping Address
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Please double-check your shipping details at checkout &mdash; we&rsquo;re unable to take responsibility
                for orders shipped to an incorrect or incomplete address, or for delays caused by carriers. If you spot
                an address mistake, email us right away and we&rsquo;ll fix it if the order hasn&rsquo;t shipped.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Contact</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>For all shipping inquiries:</p>
              <div className="border border-[#1C1917]/10 bg-white p-5 font-sans text-sm">
                <p className="text-[#78716C]">Email</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-1 inline-block font-display text-base font-bold tracking-wide text-[#1C1917] underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
              <p>
                You can also reach us through our{" "}
                <Link
                  href="/contact"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  contact form
                </Link>
                .
              </p>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-[#1C1917]/15 pt-8 text-center">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-[0.15em] text-[#1C1917] transition-colors duration-200 hover:text-[#CA8A04] cursor-pointer"
          >
            VELDIC WEAR
          </Link>
          <p className="mt-3 font-sans text-xs text-[#78716C]">
            &copy; {new Date().getFullYear()} Veldic Wear. All rights reserved.
          </p>
        </div>

      </div>
    </main>
  );
}
