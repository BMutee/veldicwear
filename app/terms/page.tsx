import type { Metadata } from "next";
import Link from "next/link";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import {
  BUSINESS_INFO,
  BUSINESS_ADDRESS_LINE,
  INTERNET_SALES_CONTRACT_THRESHOLD,
} from "@/lib/business-info";

/**
 * Public Terms of Service.
 *
 * Static route (like /privacy, /shipping-policy, /returns-refund-policy) rather
 * than a CMS page: the slug is owned by this file, so no DB row is required.
 *
 * The return window is imported from lib/returns rather than written as "30"
 * because it is quoted on the /returns portal, the Return & Refund Policy and
 * the confirmation emails, and those must never disagree. Shipping risk and the
 * lost/stolen rules are summarised here but governed in full by the Shipping
 * Policy and Return & Refund Policy, which this page links to.
 */

const TRADING_NAME = BUSINESS_INFO.name;

/** Bump this whenever the copy below changes materially. */
const LAST_UPDATED = "September 28, 2026";

export const metadata: Metadata = {
  title: `Terms of Service | ${TRADING_NAME}`,
  description:
    "The terms that govern your use of the Veldic Wear website and your purchases from it.",
};

const TABLE_OF_CONTENTS: [string, string][] = [
  ["#use", "1. Use of the Site"],
  ["#products", "2. Products & Availability"],
  ["#pricing", "3. Pricing & Payment"],
  ["#shipping-returns", "4. Shipping, Returns & Refunds"],
  ["#shipping-risk", "5. Shipping Risk"],
  ["#accounts", "6. Accounts & Accuracy of Information"],
  ["#ip", "7. Intellectual Property"],
  ["#third-party", "8. Third-Party Links & Tools"],
  ["#liability", "9. Disclaimer & Limitation of Liability"],
  ["#indemnity", "10. Indemnification"],
  ["#governing", "11. Governing Law"],
  ["#changes", "12. Changes to These Terms"],
  ["#contact", "13. Contact"],
];

/** A numbered section: sticky-nav-friendly anchor + heading. */
function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
        {children}
      </div>
    </section>
  );
}


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
            <strong className="text-[#1C1917]">Last updated:</strong> {LAST_UPDATED}
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded border border-[#CA8A04]/30 bg-[#CA8A04]/5 px-4 py-3">
              <p className="font-sans text-xs leading-5 text-[#78716C]">
                <strong className="text-[#CA8A04]">⚠ Disclaimer:</strong> These Terms are provided for
                general informational purposes only and do not constitute legal advice. They have not been
                reviewed by a qualified legal professional and may not comply in full with every applicable
                law. You{" "}
                <strong className="text-[#1C1917]">must</strong> have a qualified legal professional review and
                finalize these Terms — and confirm they match how the business actually operates — before
                relying on them to meet your legal obligations.
              </p>
            </div>
            <div className="rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
              <p className="font-sans text-xs leading-5 text-[#78716C]">
                <strong className="text-[#CA8A04]">ⓘ In plain terms:</strong> Order from us, and we carry the
                risk until your parcel reaches you. If it&rsquo;s lost, damaged, or wrong, that&rsquo;s on us to
                fix — there&rsquo;s no carrier claim for you to file. See{" "}
                <strong className="text-[#1C1917]">Section 5</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="mt-10 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
            Table of Contents
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {TABLE_OF_CONTENTS.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex items-center gap-2 font-sans text-sm text-[#1C1917] underline decoration-[#CA8A04]/30 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#CA8A04]" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="mt-10 space-y-12">
          <Section id="use" title="1. Use of the Site">
            <p>
              This website is operated by {TRADING_NAME}. By visiting our site or purchasing something from us, you
              agree to the following terms. Please read them carefully — if you don&rsquo;t agree with any part,
              please don&rsquo;t use the site or our services.
            </p>
            <p>
              By using this site, you confirm you are at least the age of majority in your province, state, or
              country of residence, or have the consent of a parent or guardian. You may not use our products or
              site for any unlawful purpose, to transmit malicious code, or to attempt to interfere with the
              site&rsquo;s operation. A breach of these terms may result in termination of your access.
            </p>
          </Section>

          <Section id="products" title="2. Products & Availability">
            <p>
              Sizes can sell out, and availability is not guaranteed at all times. We reserve the right to limit
              quantities, discontinue products, and refuse or cancel any order at our discretion — for example,
              where we suspect fraud or reseller activity. If we cancel your order, you&rsquo;ll receive a full
              refund.
            </p>
            <p>
              We do our best to display colours, sizing and images accurately, but we can&rsquo;t guarantee your
              screen shows them exactly as they are.
            </p>
          </Section>

          <Section id="pricing" title="3. Pricing & Payment">
            <p>
              Prices are listed in the currency shown at checkout and may change at any time without notice. We
              reserve the right to correct pricing errors, including on orders already placed — if a correction
              affects your order, we&rsquo;ll contact you before proceeding or issue a full refund.
            </p>
            <p>
              By providing payment information, you confirm you&rsquo;re authorized to use the payment method
              provided. Payments are processed by Stripe; we never receive or store your full card number.
            </p>
          </Section>

          <Section id="shipping-returns" title="4. Shipping, Returns & Refunds">
            <p>
              Shipping and delivery are governed by our{" "}
              <Link
                href="/shipping-policy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Shipping Policy
              </Link>
              , and returns by our{" "}
              <Link
                href="/returns-refund-policy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Return &amp; Refund Policy
              </Link>
              . Those policies form part of these Terms; where this summary and those policies differ, the
              policies govern.
            </p>
            <p>
              In short: you can request a return within{" "}
              <strong className="text-[#1C1917]">{RETURN_WINDOW_DAYS} days of delivery</strong>, unworn and with
              the tags attached, and refunds are issued to your original payment method. You can{" "}
              <Link
                href="/returns"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                start a return online
              </Link>
              .
            </p>
            <p>
              If an item is wrong, faulty, or damaged, that&rsquo;s our cost to fix and sits outside the
              change-of-mind rules. Nothing in this section limits any rights you have under the consumer
              protection laws that apply where you live.
            </p>
            <p>
              <strong className="text-[#1C1917]">Your statutory cancellation rights:</strong> if you are buying from
              us in Alberta and your order totals more than{" "}
              {INTERNET_SALES_CONTRACT_THRESHOLD}, you have rights under Alberta&rsquo;s Consumer
              Protection Act that these Terms cannot remove. You may be able to cancel an order under that Act, and
              if you pay by credit card you can ask your card issuer to reverse the charge. If we do not refund you,
              your card issuer is generally required to reverse it once you have told us in writing. We will give you
              a written copy of your order within 15 days, and the time in which you may cancel is longer if we fail
              to do that. Nothing here limits any other right or remedy available to you under applicable consumer
              protection law.
            </p>
          </Section>

          <Section id="shipping-risk" title="5. Shipping Risk">
            <p>
              Until your order reaches the delivery address, the risk of loss or damage in transit is ours. If a
              parcel is lost or damaged on the way to you, we replace it or refund you under our{" "}
              <Link
                href="/returns-refund-policy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Return &amp; Refund Policy
              </Link>{" "}
              — there is no carrier claim for you to file.
            </p>
            <p>
              We are also responsible for production errors, wrong items, and items damaged before carrier
              handoff. Once a parcel has been delivered to the address you gave us, risk passes to you.
            </p>
            <p>
              We nonetheless replace or credit one parcel reported stolen after delivery per customer in any
              12-month period, on the terms set out in our Return &amp; Refund Policy; beyond that it is at our
              discretion. Nothing in this section limits any rights you have under applicable consumer protection
              law.
            </p>
          </Section>

          <Section id="accounts" title="6. Accounts & Accuracy of Information">
            <p>
              You&rsquo;re responsible for keeping your account information current and accurate, including your
              shipping address, and for maintaining the confidentiality of your account. You agree that the
              information you provide when ordering is complete and accurate.
            </p>
            <p>
              We&rsquo;re unable to take responsibility for orders shipped to an incorrect or incomplete address.
              If you spot a mistake, email us right away and we&rsquo;ll fix it if the order hasn&rsquo;t shipped.
            </p>
          </Section>

          <Section id="ip" title="7. Intellectual Property">
            <p>
              All content on this site — including designs, graphics, product artwork, logos, text, and images — is
              the property of {TRADING_NAME} and is protected by copyright and trademark law. You may not
              reproduce, copy, sell, or exploit any portion of the site or its content without our express written
              permission.
            </p>
          </Section>

          <Section id="third-party" title="8. Third-Party Links & Tools">
            <p>
              The site may include links to third-party websites or make use of third-party tools. We are not
              responsible for the content, accuracy, or practices of third parties, and your use of their sites or
              tools is at your own risk. Please review their privacy policies and terms before you use them.
            </p>
            <p>
              How we handle your personal information is set out in our{" "}
              <Link
                href="/privacy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section id="liability" title="9. Disclaimer & Limitation of Liability">
            <p>
              The site and our products are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the
              fullest extent permitted by law, {TRADING_NAME} is not liable for any indirect, incidental, or
              consequential damages arising from your use of the site or products, and our total liability for any
              claim will not exceed the amount you paid for the product giving rise to the claim.
            </p>
            <p>
              Nothing in these terms limits any rights you have under applicable consumer protection law, including
              the rights described in our Return &amp; Refund Policy.
            </p>
          </Section>

          <Section id="indemnity" title="10. Indemnification">
            <p>
              You agree to indemnify and hold harmless {TRADING_NAME} and its owners, employees, and partners from
              any claim arising out of your breach of these terms or your violation of any law or third-party right.
            </p>
          </Section>

          <Section id="governing" title="11. Governing Law">
            <p>
              These terms are governed by the laws of the Province of Alberta and the federal laws of Canada
              applicable therein, without regard to conflict-of-law rules.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or your use of the Site shall be resolved
              exclusively in the courts located in Alberta, Canada, and you consent to the personal jurisdiction of
              those courts. Nothing in this section prevents you from exercising any right or remedy available to you
              under the consumer protection laws of your jurisdiction.
            </p>
          </Section>

          <Section id="changes" title="12. Changes to These Terms">
            <p>
              We may update these Terms of Service at any time by posting the revised version on this page. Your
              continued use of the site after changes are posted constitutes acceptance of those changes.
            </p>
            <p>
              We encourage you to review this page periodically. If a change is material, we will let you know
              before it takes effect.
            </p>
          </Section>

          <Section id="contact" title="13. Contact">
            <p>
              Questions about these terms? Email us at{" "}
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
              >
                {BUSINESS_INFO.email}
              </a>
              , use our{" "}
              <Link
                href="/contact"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                contact form
              </Link>
              , or call {BUSINESS_INFO.phone}.
            </p>
            <div className="mt-4 border border-[#1C1917]/10 bg-white p-5 font-sans text-sm">
              <p className="text-[#1C1917]">
                <strong>{BUSINESS_INFO.legalName}</strong>
                <br />
                {BUSINESS_ADDRESS_LINE}
                <br />
                <a
                  href={`mailto:${BUSINESS_INFO.email}`}
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  {BUSINESS_INFO.email}
                </a>
                <br />
                <a
                  href={`tel:${BUSINESS_INFO.phoneHref}`}
                  className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
                >
                  {BUSINESS_INFO.phone}
                </a>
              </p>
            </div>
            <p className="pt-2 text-sm text-[#78716C]">
              We aim to respond to all inquiries within 30 days.
            </p>
          </Section>

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
            &copy; {new Date().getFullYear()} {TRADING_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
