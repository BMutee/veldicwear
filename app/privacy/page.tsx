import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Legal
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            <strong className="text-[#1C1917]">Last updated:</strong> July 21, 2026
          </p>
          <div className="mt-4 rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">⚠ Disclaimer:</strong> This is a placeholder Privacy Policy generated for
              development purposes. It does not constitute legal advice and may not comply with applicable laws (including
              GDPR, CCPA, or others). You <strong className="text-[#1C1917]">must</strong> have a qualified legal professional
              review and finalize your actual Privacy Policy before launching or making this page publicly accessible.
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
              ["#introduction", "1. Introduction"],
              ["#data-collected", "2. Information We Collect"],
              ["#how-we-use", "3. How We Use Your Information"],
              ["#third-party", "4. Third-Party Services"],
              ["#cookies", "5. Cookies & Tracking"],
              ["#data-sharing", "6. Data Sharing & Disclosure"],
              ["#your-rights", "7. Your Rights & Choices"],
              ["#data-security", "8. Data Security"],
              ["#changes", "9. Changes to This Policy"],
              ["#contact", "10. Contact Us"],
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
          <section id="introduction">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              1. Introduction
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Veldic Wear (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
                visit our website or make a purchase.
              </p>
              <p>
                By using the Site, you agree to the collection and use of information in accordance with this policy. If you
                do not agree with the terms of this Privacy Policy, please do not access the Site.
              </p>
              <p>
                We reserve the right to update this policy at any time. Changes will be posted on this page with an updated
                &ldquo;Last updated&rdquo; date.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="data-collected">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              2. Information We Collect
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>We collect the following categories of information when you use our Site:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Personal Identification Information:</strong> Name, email address, phone number, shipping address, and billing address provided at checkout or account registration.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Payment Information:</strong> We do <em className="font-semibold">not</em> collect or store credit/debit card numbers. All payment processing is handled securely by <strong className="text-[#1C1917]">Stripe</strong>. Stripe receives your payment details directly and is PCI-DSS compliant. We only receive a payment confirmation token and the last four digits of the card.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Account Credentials:</strong> If you create an account, we store your email and a securely hashed password (never plain text).</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Device & Usage Data:</strong> IP address, browser type, pages visited, time spent on pages, and referring URLs collected via cookies and analytics tools.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="how-we-use">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              3. How We Use Your Information
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>To process and fulfill orders, including sending order confirmations and shipping updates.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>To communicate with you regarding your account, orders, and customer support inquiries.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>To send marketing communications (with your consent where required by law), including newsletters and promotions.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>To improve our website, products, and customer experience through analytics.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>To detect, prevent, and address technical issues, fraud, or violations of our Terms of Service.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="third-party">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              4. Third-Party Services
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>We use the following third-party service providers to operate our business:</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse font-sans text-sm">
                  <thead>
                    <tr className="border-b border-[#1C1917]/15">
                      <th className="py-2 pr-4 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">Service</th>
                      <th className="py-2 pr-4 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">Purpose</th>
                      <th className="py-2 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C1917]/10">
                    <tr>
                      <td className="py-3 pr-4 font-medium text-[#1C1917]">Stripe</td>
                      <td className="py-3 pr-4 text-[#44403C]">Payment processing</td>
                      <td className="py-3 text-[#44403C]">Payment details (directly, not via us), billing info</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-[#1C1917]">Resend</td>
                      <td className="py-3 pr-4 text-[#44403C]">Transactional & marketing emails</td>
                      <td className="py-3 text-[#44403C]">Email address, order information</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-[#1C1917]">Google Analytics</td>
                      <td className="py-3 pr-4 text-[#44403C]">Site analytics & usage tracking</td>
                      <td className="py-3 text-[#44403C]">Anonymized usage data, IP address</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-[#1C1917]">Cloudinary</td>
                      <td className="py-3 pr-4 text-[#44403C]">Image hosting & optimization</td>
                      <td className="py-3 text-[#44403C]">Product images (no personal data)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="pt-2 text-sm text-[#78716C]">
                Each third-party service provider has its own privacy policy governing the use of your data. We encourage you
                to review them. Stripe&rsquo;s privacy policy is available at{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer">stripe.com/privacy</a>.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="cookies">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              5. Cookies & Tracking
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                Our Site uses cookies and similar tracking technologies to enhance your browsing experience, analyze site
                traffic, and understand where our visitors come from.
              </p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Essential Cookies:</strong> Required for the Site to function (e.g., session management, cart persistence).</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Analytics Cookies:</strong> Used by Google Analytics to collect anonymized data about how visitors use the Site.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Functionality Cookies:</strong> Remember your preferences and settings for future visits.</span>
                </li>
              </ul>
              <p>
                You can control cookie preferences through your browser settings. Disabling certain cookies may affect the
                functionality of the Site.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="data-sharing">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              6. Data Sharing & Disclosure
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>We do not sell your personal information. We may share your data in the following circumstances:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Service Providers:</strong> With third parties who perform services on our behalf (payment processing, email delivery, analytics).</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Legal Compliance:</strong> If required by law, regulation, or legal process (e.g., court order or subpoena).</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section id="your-rights">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              7. Your Rights & Choices
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Access:</strong> Request a copy of the personal data we hold about you.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Correction:</strong> Request that we correct inaccurate or incomplete data.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Deletion:</strong> Request that we delete your personal data, subject to certain exceptions (e.g., legal obligations).</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Opt-Out:</strong> Unsubscribe from marketing communications at any time by clicking the unsubscribe link in our emails or contacting us directly.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span><strong className="text-[#1C1917]">Data Portability:</strong> Request a copy of your data in a commonly used, machine-readable format.</span>
                </li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at the email address provided in Section 10. We will
                respond to your request within the timeframe required by applicable law.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="data-security">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              8. Data Security
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                We implement commercially reasonable technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. These include:
              </p>
              <ul className="list-inside space-y-2">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Encryption of data in transit using TLS/SSL.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Secure password storage using bcrypt hashing.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>Limited internal access to personal data on a need-to-know basis.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                  <span>PCI-DSS compliance handled by Stripe for all payment processing.</span>
                </li>
              </ul>
              <p className="text-sm text-[#78716C]">
                No method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect
                your data, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="changes">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              9. Changes to This Policy
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                policy on this page and updating the &ldquo;Last updated&rdquo; date at the top. In some cases, we may
                provide additional notice (e.g., via email or a site banner).
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically for any changes. Continued use of the Site
                after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="contact">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
              10. Contact Us
            </h2>
            <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please{" "}
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
              <p className="pt-2 text-sm text-[#78716C]">
                We aim to respond to all inquiries within 30 days.
              </p>
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