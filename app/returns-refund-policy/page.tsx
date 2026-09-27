import Link from "next/link";

/**
 * Public Return & Refund Policy page.
 *
 * Static route like app/privacy, app/terms and app/shipping-policy:
 * "returns-refund-policy" is already listed in the staticSlugs allow-list in
 * app/[slug]/page.tsx, so this page owns the URL with no DB row.
 *
 * The terms here are written to agree with the other customer-facing promises:
 *   - 30-day return window and refund "within 30 days after we receive and
 *     inspect" (app/terms/page.tsx, section 5).
 *   - Our fault = covered in full, 7-day damage report, 45/90-day lost-package
 *     window, one theft replacement per 12 months, duties-included US pricing
 *     (app/shipping-policy/page.tsx).
 *
 * The day counts kept here are POLICY deadlines (how long you have to tell us),
 * not delivery estimates — delivery windows live on the product page via
 * components/DeliveryEstimate.tsx.
 */
const SUPPORT_EMAIL = "info@veldicwear.com";

export default function ReturnsRefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Support
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Return &amp; Refund Policy
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            <strong className="text-[#1C1917]">Last updated:</strong> September 26, 2026
          </p>
          <div className="mt-4 rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">⚠ Draft:</strong> This Return &amp; Refund Policy was drafted
              for development purposes. It does not constitute legal advice and may not comply with the consumer
              protection laws that apply to you. Have a qualified legal professional review and finalize it before
              making this page publicly accessible.
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
              ["#overview", "Overview"],
              ["#eligibility", "Return Eligibility"],
              ["#start-return", "How to Start a Return"],
              ["#return-shipping", "Return Shipping Costs"],
              ["#refunds", "Refunds"],
              ["#faulty", "Wrong, Faulty, or Damaged Items"],
              ["#lost-in-transit", "Lost or Stolen in Transit"],
              ["#duties", "Duties, Taxes & Refused Packages"],
              ["#cancellations", "Cancellations"],
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
          {/* Overview */}
          <section id="overview">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Overview</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                We want you to be happy with your Veldic Wear order. If something isn&rsquo;t right, you can request a
                return within <strong className="text-[#1C1917]">30 days of delivery</strong> &mdash; and if a parcel
                arrives damaged, faulty, or incorrect, we cover it in full.
              </p>
              <p>
                This policy explains what can be returned, how to start a return, and how and when refunds are issued.
                Nothing in it limits any rights you have under the consumer protection laws that apply where you live.
              </p>
            </div>
          </section>

          {/* Return Eligibility */}
          <section id="eligibility">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Return Eligibility
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>An item qualifies for a return when all of the following are true:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    You contact us within <strong className="text-[#1C1917]">30 days of delivery</strong>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    The item is <strong className="text-[#1C1917]">unworn, unwashed, and unused</strong>, exactly as it
                    arrived.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    All original tags are still attached and the item is returned in its original packaging where
                    possible.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    You have your <strong className="text-[#1C1917]">order number</strong> from your confirmation email.
                  </span>
                </li>
              </ul>
              <p>We&rsquo;re unable to accept a return when:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>More than 30 days have passed since delivery.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>The item has been worn, washed, altered, or damaged after delivery.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Tags or original packaging are missing.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    The item is sent back without contacting us first &mdash; we can&rsquo;t match an unannounced parcel
                    to your order.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* How to Start a Return */}
          <section id="start-return">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              How to Start a Return
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                The quickest route is the{" "}
                <Link
                  href="/returns"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  returns page
                </Link>
                : enter your order number and the email on the order, choose the items, and we&rsquo;ll email you
                a return address and label.
              </p>
              <p>
                Prefer email? Write to{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                with your order number and the reason for the return. If an item arrived damaged, faulty, or incorrect,
                attach a photo &mdash; it often lets us sort things out without a return at all.
              </p>
              <p>
                We&rsquo;ll reply with return instructions and the address to send the item to. Please don&rsquo;t ship
                anything back before you hear from us.
              </p>
            </div>
          </section>
          {/* Return Shipping Costs */}
          <section id="return-shipping">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Return Shipping Costs
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Where the return is because of something we did &mdash; a wrong item, a manufacturing defect, or damage
                in transit &mdash; <strong className="text-[#1C1917]">we cover it in full</strong>, including the cost of
                sending it back to us.
              </p>
              <p>
                For everything else, you&rsquo;re responsible for the cost of shipping the item back. Please use a
                tracked service: we can&rsquo;t refund items that go missing on the way back to us.
              </p>
              <p>
                Standard shipping is free on every order, so there is no shipping fee for us to refund on a return.
              </p>
            </div>
          </section>

          {/* Refunds */}
          <section id="refunds">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Refunds</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Once your return reaches us, we inspect it and refund the price of the returned item(s) to your original
                payment method.
              </p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    Refunds are processed within <strong className="text-[#1C1917]">30 days after we receive and inspect</strong>{" "}
                    the returned item &mdash; in practice, usually much sooner.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>We email you as soon as the refund has been issued.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>How quickly the money appears after that depends on your bank or card issuer.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    Refunds are issued in the currency you were charged. Any conversion or foreign-transaction fee your
                    bank applies is outside our control.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>
                    If an item doesn&rsquo;t meet the eligibility conditions when it arrives, we&rsquo;ll email you to
                    explain and arrange to send it back to you.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Wrong, Faulty, or Damaged Items */}
          <section id="faulty">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Wrong, Faulty, or Damaged Items
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Wrong items, manufacturing defects, and anything else that&rsquo;s our fault are{" "}
                <strong className="text-[#1C1917]">always covered in full</strong> &mdash; we replace the item or refund
                you, and we cover the return shipping.
              </p>
              <p>
                Tell us within <strong className="text-[#1C1917]">7 days of delivery</strong> so we can sort it out
                quickly, and include photos where you can &mdash; they often let us approve the fix without a return at
                all. This sits outside the change-of-mind rules above: if it&rsquo;s our mistake, it&rsquo;s our cost.
              </p>
            </div>
          </section>
          {/* Lost or Stolen in Transit */}
          <section id="lost-in-transit">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Lost or Stolen in Transit
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Until your parcel reaches you, it&rsquo;s <strong className="text-[#1C1917]">our responsibility</strong>.
                If it&rsquo;s lost or damaged in transit, we replace it or refund you &mdash; there&rsquo;s no carrier
                claim for you to file.
              </p>
              <p>
                Report a lost package within{" "}
                <strong className="text-[#1C1917]">45 days of the order date</strong> &mdash; 90 days outside Canada and
                the US, where customs clearance alone can run past the 45th day.
              </p>
              <p>
                If tracking shows delivered but the parcel isn&rsquo;t there, check with your building and your
                neighbours first, then email us within{" "}
                <strong className="text-[#1C1917]">7 days of the delivery scan</strong>. Theft after delivery sits
                outside what any carrier covers, but we&rsquo;ll replace one parcel per customer every 12 months.
              </p>
            </div>
          </section>

          {/* Duties, Taxes & Refused Packages */}
          <section id="duties">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              Duties, Taxes &amp; Refused Packages
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                <strong className="text-[#1C1917]">United States:</strong> import duties are included in our prices and
                prepaid by us &mdash; you pay nothing on delivery.
              </p>
              <p>
                <strong className="text-[#1C1917]">Other countries:</strong> import duties, taxes, and customs fees are
                set by the destination country, are not included in your order total or shipping fee, and are the
                recipient&rsquo;s responsibility. We are required to declare the full value of every shipment.
              </p>
              <p>
                If a parcel is refused or returned to us because those charges weren&rsquo;t paid, the return shipping
                and any fees may be deducted from your refund. Duties and taxes are paid to your government rather than
                to us, so they can&rsquo;t be refunded by us.
              </p>
            </div>
          </section>

          {/* Cancellations */}
          <section id="cancellations">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Cancellations</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                If you need to cancel or change an order, email us as soon as you can with your order number. We can
                usually make changes while your order is still being prepared; once it has shipped, please use the return
                process above.
              </p>
              <p>
                If we have to cancel an item &mdash; for example, if it sells out before your order is packed &mdash; we
                refund that item in full.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">Contact</h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                For a return, a refund, or anything else about your order, email us with your order number and
                we&rsquo;ll help.
              </p>
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
                . For delivery timelines, tracking, and customs questions, see our{" "}
                <Link
                  href="/shipping-policy"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  Shipping Policy
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
