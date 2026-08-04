import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Legal
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            <strong className="text-[#1C1917]">Last updated:</strong> July 21, 2026
          </p>
          <div className="mt-4 rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">⚠ Disclaimer:</strong> This is a placeholder Terms of Service
              document generated for development purposes. It does not constitute legal advice and may not comply with
              applicable laws. You <strong className="text-[#1C1917]">must</strong> have a qualified legal professional
              review and finalize your actual Terms of Service before launching or making this page publicly accessible.
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
              ["#acceptance", "1. Acceptance of Terms"],
              ["#changes", "2. Changes to Terms"],
              ["#account", "3. Account Registration"],
              ["#orders", "4. Orders & Payment"],
              ["#shipping", "5. Shipping & Returns"],
              ["#intellectual", "6. Intellectual Property"],
              ["#prohibited", "7. Prohibited Uses"],
              ["#disclaimers", "8. Disclaimers & Limitation of Liability"],
              ["#termination", "9. Termination"],
              ["#governing", "10. Governing Law"],
              ["#contact", "11. Contact Us"],
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
          {/* Section 1 */}
          <section id="acceptance">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              1. Acceptance of Terms
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                By accessing or using the Veldic Wear website (the &ldquo;Site&rdquo;), you agree to be bound by these
                Terms of Service (&ldquo;Terms&rdquo;). If you do not agree with any part of these Terms, you must not
                access or use the Site.
              </p>
              <p>
                These Terms apply to all visitors, users, and customers who access or use the Site. If you are using the
                Site on behalf of a business or other entity, you represent that you have the authority to bind that entity
                to these Terms.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="changes">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              2. Changes to Terms
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                We reserve the right to modify or replace these Terms at any time. Changes will be effective immediately
                upon posting to the Site. Your continued use of the Site after any changes constitutes acceptance of the
                new Terms.
              </p>
              <p>
                We will make reasonable efforts to notify you of material changes, such as by updating the &ldquo;Last
                updated&rdquo; date at the top of this page. We encourage you to review these Terms periodically.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="account">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              3. Account Registration
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                When you create an account on our Site, you agree to provide accurate, current, and complete information.
                You are responsible for maintaining the confidentiality of your account credentials and for all activities
                that occur under your account.
              </p>
              <p>You agree not to:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Create an account using false or misleading information.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Share your account credentials with any third party.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Use another person&rsquo;s account without permission.</span>
                </li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate these Terms or applicable law.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="orders">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              4. Orders & Payment
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                By placing an order through our Site, you agree to provide accurate payment and shipping information. All
                orders are subject to availability and acceptance by Veldic Wear.
              </p>
              <p><strong className="text-[#1C1917]">Pricing:</strong> All prices are listed in the currency specified on the
                Site and are subject to change without notice. We reserve the right to correct any pricing errors that may
                occur.</p>
              <p><strong className="text-[#1C1917]">Payment:</strong> Payments are processed securely through Stripe. By
                providing your payment information, you authorize Stripe to charge the applicable amount. We do not store
                your full payment card details.</p>
              <p><strong className="text-[#1C1917]">Order Confirmation:</strong> Your receipt of an order confirmation does
                not constitute our acceptance of the order. We reserve the right to cancel or refuse any order at our
                discretion, including if we suspect fraud or inaccuracies.</p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="shipping">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              5. Shipping & Returns
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <div className="rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
                <p className="font-sans text-xs leading-5 text-[#78716C]">
                  <strong className="text-[#CA8A04]">ⓘ Estimate:</strong> The shipping timelines below are estimates, not
                  guarantees. While we make every effort to meet these windows, Veldic Wear is not responsible for delays
                  caused by carriers, customs processing, or other factors outside our reasonable control.
                </p>
              </div>
              <p>
                <strong className="text-[#1C1917]">Processing:</strong> Orders are typically processed within 1&ndash;4
                business days. During this time, each item undergoes quality checking before being packed and handed to the
                carrier.
              </p>
              <p>
                <strong className="text-[#1C1917]">Transit:</strong> After processing, delivery takes approximately 4&ndash;11
                days depending on the destination and shipping method selected at checkout.
              </p>
              <p>
                <strong className="text-[#1C1917]">Total Delivery Window:</strong> From the moment you place your order to
                delivery at your door, you can expect a total timeline of approximately <strong className="text-[#1C1917]">7&ndash;15
                days</strong>. This is an estimate, not a guarantee — carrier delays, customs clearance, and other
                unforeseen circumstances may extend this window.
              </p>
              <p>
                <strong className="text-[#1C1917]">Returns:</strong> We accept returns of unworn, unwashed, and unused items
                within 30 days of delivery, subject to our Return Policy. Items must be in their original condition with
                all tags attached. Customers are responsible for return shipping costs unless the item is defective or
                incorrect.
              </p>
              <p>
                To initiate a return, please contact us at the email address in Section 11. Refunds will be processed to
                the original payment method within 30 days after we receive and inspect the returned item.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="intellectual">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              6. Intellectual Property
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                All content on the Site, including but not limited to text, graphics, logos, images, product designs,
                taglines, and software (&ldquo;Content&rdquo;), is the property of Veldic Wear or its licensors and is
                protected by applicable intellectual property laws.
              </p>
              <p>You may not:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Reproduce, distribute, modify, or create derivative works from the Content without our prior written consent.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Use any of our trademarks, trade names, or branding without our express permission.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Remove or alter any copyright, trademark, or other proprietary notices on the Content.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section id="prohibited">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              7. Prohibited Uses
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>You agree not to use the Site for any unlawful purpose or in violation of these Terms. Prohibited uses
                include, but are not limited to:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Engaging in fraudulent, abusive, or deceptive activity.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Attempting to gain unauthorized access to our systems or user accounts.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Interfering with the proper functioning of the Site, including introducing malware or conducting
                    denial-of-service attacks.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Scraping or extracting data from the Site without our authorization.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Violating any applicable local, state, national, or international law.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section id="disclaimers">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              8. Disclaimers & Limitation of Liability
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                <strong className="text-[#1C1917]">Disclaimer of Warranties:</strong> The Site and all products, content,
                and services provided through the Site are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
                basis, without any warranties of any kind, either express or implied, including but not limited to implied
                warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p>
                We do not warrant that the Site will be uninterrupted, error-free, secure, or free of viruses or other
                harmful components.
              </p>
              <p>
                <strong className="text-[#1C1917]">Limitation of Liability:</strong> To the fullest extent permitted by
                applicable law, in no event shall Veldic Wear, its officers, directors, employees, or agents be liable for
                any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use
                of the Site, including but not limited to lost profits, data loss, or business interruption, even if advised
                of the possibility of such damages.
              </p>
              <p>
                Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for
                certain damages. If you reside in such a jurisdiction, some of the above exclusions or limitations may not
                apply to you.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="termination">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              9. Termination
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                We may terminate or suspend your access to the Site immediately, without prior notice or liability, for any
                reason, including if you breach these Terms.
              </p>
              <p>
                Upon termination, your right to use the Site will cease immediately. Provisions of these Terms that by their
                nature should survive termination (including but not limited to intellectual property provisions,
                disclaimers, and limitations of liability) shall survive.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue using the Site or contact us to request
                account deletion.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="governing">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              10. Governing Law
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Province of Alberta,
                Canada, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising out of or relating to these Terms or your use of the Site shall be resolved exclusively
                in the courts located in Edmonton, Alberta, Canada, and you consent to the personal jurisdiction of
                those courts.
              </p>
              <div className="mt-4 border border-[#1C1917]/10 bg-white p-5 font-sans text-sm">
                <p className="text-[#1C1917]">
                  <strong>Business Address:</strong> 7720 38A Avenue NW, Edmonton, AB T6K 2M1, Canada
                </p>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section id="contact">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              11. Contact Us
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                If you have any questions about these Terms, please{" "}
                <Link
                  href="/contact"
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                >
                  contact us through our website
                </Link>
                .
              </p>
              <div className="mt-4 border border-[#1C1917]/10 bg-white p-5 font-sans text-sm">
                <p className="text-[#1C1917]">
                  <strong>Address:</strong> 7720 38A Avenue NW, Edmonton, AB T6K 2M1, Canada
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-[#1C1917]/15 pt-8 text-center">
          <Link href="/" className="font-display text-lg font-bold tracking-[0.15em] text-[#1C1917] transition-colors duration-200 hover:text-[#CA8A04] cursor-pointer">
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