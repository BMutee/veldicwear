import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_INFO, BUSINESS_ADDRESS_LINE } from "@/lib/business-info";

/**
 * Public Privacy Policy.
 *
 * Static route (like /terms and /shipping-policy) rather than a CMS page: the
 * slug is owned by this file, so no DB row is required.
 *
 * The processors named in SERVICE_PROVIDERS mirror the actual stack — Stripe
 * for payments, DeoMail for mail, Vercel for hosting/analytics, Neon for the
 * database, CJ for fulfillment, Cloudinary for admin image uploads. If one of
 * those is ever swapped, that table is the line that has to change.
 */

/** Bump this whenever the copy below changes materially. */
const LAST_UPDATED = "September 28, 2026";
const TRADING_NAME = BUSINESS_INFO.name;

export const metadata: Metadata = {
  title: `Privacy Policy | ${TRADING_NAME}`,
  description: `How ${TRADING_NAME} collects, uses, shares and protects your personal information, and the rights you have over it.`,
};

const TABLE_OF_CONTENTS: [string, string][] = [
  ["#introduction", "1. Introduction"],
  ["#collect", "2. Information We Collect"],
  ["#sources", "3. Where Information Comes From"],
  ["#use", "4. How We Use Your Information"],
  ["#sharing", "5. How We Share Your Information"],
  ["#providers", "6. Our Service Providers"],
  ["#cookies", "7. Cookies & Similar Technologies"],
  ["#retention", "8. How Long We Keep Your Information"],
  ["#rights", "9. Your Rights & Choices"],
  ["#complaints", "10. Complaints"],
  ["#breach", "11. Data Breaches"],
  ["#transfers", "12. International Data Transfers"],
  ["#children", "13. Children’s Data"],
  ["#security", "14. Data Security"],
  ["#third-party", "15. Third-Party Websites & Links"],
  ["#changes", "16. Changes to This Policy"],
  ["#contact", "17. Contact Us"],
];

type Provider = {
  name: string;
  purpose: string;
  data: string;
  link?: { href: string; label: string };
};

const SERVICE_PROVIDERS: Provider[] = [
  {
    name: "Stripe",
    purpose: "Payment processing",
    data: "Card details are entered directly with Stripe and never reach our servers. We receive only the payment reference, amount, currency, billing address and the last four digits of the card.",
    link: { href: "https://stripe.com/privacy", label: "stripe.com/privacy" },
  },
  {
    name: "CJ Dropshipping",
    purpose: "Order fulfillment & shipping",
    data: "Name, shipping address and the contents of your order, so the parcel can be packed and delivered to you.",
  },
  {
    name: "DeoMail",
    purpose: "Transactional & marketing email",
    data: "Email address, name and the order details needed to render the message.",
  },
  {
    name: "Vercel",
    purpose: "Hosting, performance & analytics",
    data: "IP address, device and browser type, and the pages and features you interact with. Vercel Analytics is privacy-friendly and does not build a cross-site profile of you.",
    link: { href: "https://vercel.com/legal/privacy-policy", label: "vercel.com/legal/privacy-policy" },
  },
  {
    name: "Neon",
    purpose: "Database hosting",
    data: "The account, order and support records we store about you.",
  },
  {
    name: "Cloudinary",
    purpose: "Image hosting (admin uploads)",
    data: "Product imagery only, uploaded by our staff. It is not used to collect information about you.",
  },
];

const COOKIE_TYPES: { name: string; body: string }[] = [
  {
    name: "Essential Cookies:",
    body: "Required for the site to function — keeping you signed in, securing checkout, and remembering your cart. These cannot be switched off.",
  },
  {
    name: "Currency Preference Cookies:",
    body: "Remember the currency you picked (or that we detected from your location) so prices are shown consistently on your next visit. These are stored in your browser under “currency” and “currency_source” and last up to one year.",
  },
  {
    name: "Cart Storage:",
    body: "If you have not signed in, your cart is kept in your browser’s local storage rather than on our servers. Clearing your browser data clears the cart.",
  },
  {
    name: "Analytics Cookies:",
    body: "Used to understand which pages are visited and how the site performs, so we can improve it. These are not used to build an advertising profile of you.",
  },
];

const RIGHTS: { name: string; body: string }[] = [
  {
    name: "Access:",
    body: "Request a copy of the personal information we hold about you.",
  },
  {
    name: "Correction:",
    body: "Ask us to correct information that is inaccurate or incomplete.",
  },
  {
    name: "Deletion:",
    body: "Ask us to delete personal information we hold about you. Certain records must be kept for tax, accounting and fraud-prevention purposes, so we may retain those.",
  },
  {
    name: "Portability:",
    body: "Receive your personal information in a commonly used, machine-readable format, and in some cases have it transferred directly to another provider.",
  },
  {
    name: "Opt out of sale, sharing or targeted advertising:",
    body: "Depending on where you live, you may ask us not to sell or share your personal information, or not to use it for targeted advertising. We do not sell personal information for money. If you visit this site with the Global Privacy Control signal enabled, we treat it as a valid opt-out request for your browser and device — and for your account, if we can associate the two.",
  },
  {
    name: "Objection and restriction:",
    body: "If you are in the UK or European Economic Area, you may ask us to stop or restrict certain uses of your information.",
  },
  {
    name: "Withdraw consent:",
    body: "Where we rely on your consent (for example, to send marketing email), you may withdraw it at any time. Withdrawing consent does not affect processing we carried out before you withdrew it.",
  },
];


/** Bulleted list with the gold-dot marker used across the legal pages. */
function Bullets({ items }: { items: { name?: string; body: string }[] }) {
  return (
    <ul className="list-inside space-y-2">
      {items.map((item) => (
        <li key={item.body} className="flex gap-3">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
          <span>
            {item.name ? <strong className="text-[#1C1917]">{item.name} </strong> : null}
            {item.body}
          </span>
        </li>
      ))}
    </ul>
  );
}

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

/** External link with the same underline treatment used in the body copy. */

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
            <strong className="text-[#1C1917]">Last updated:</strong> {LAST_UPDATED}
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded border border-[#CA8A04]/30 bg-[#CA8A04]/5 px-4 py-3">
              <p className="font-sans text-xs leading-5 text-[#78716C]">
                <strong className="text-[#CA8A04]">⚠ Disclaimer:</strong> This Privacy Policy is provided for
                general informational purposes only and does not constitute legal advice. It has not been reviewed by
                a qualified legal professional and may not comply in full with every applicable law (including
                GDPR, CCPA/CPRA, PIPEDA and provincial legislation). You{" "}
                <strong className="text-[#1C1917]">must</strong> have a qualified legal professional review and
                finalize this policy — and confirm it matches how the business actually operates — before relying on
                it to meet your legal obligations.
              </p>
            </div>
            <div className="rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
              <p className="font-sans text-xs leading-5 text-[#78716C]">
                <strong className="text-[#CA8A04]">ⓘ In plain terms:</strong> We collect what we need to take
                your order, ship it, and answer you when you need help. Your card details go straight to{" "}
                <strong className="text-[#1C1917]">Stripe</strong> and never touch our servers. We do not sell
                your personal information, and you can ask us to delete it at any time — see{" "}
                <strong className="text-[#1C1917]">Section 9</strong>.
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
          <Section id="introduction" title="1. Introduction">
            <p>
              {TRADING_NAME} (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates this website
              (the &ldquo;Site&rdquo;), including the products, content, features and tools available on it. This
              Privacy Policy explains how we collect, use, disclose and protect your personal information when you
              visit the Site, create an account, make a purchase, or otherwise communicate with us.
            </p>
            <p>
              By using the Site, you acknowledge that you have read this Privacy Policy and understand how your
              information is collected, used and disclosed. If you do not agree with it, please do not use the Site.
            </p>
            <p>
              Where the Terms of Service conflict with this Privacy Policy,{" "}
              <strong className="text-[#1C1917]">this Privacy Policy controls</strong> in respect of the
              collection, processing and disclosure of your personal information.
            </p>
          </Section>

          <Section id="collect" title="2. Information We Collect">
            <p>
              &ldquo;Personal information&rdquo; means information that identifies you, or that can reasonably be
              linked to you or to another person. It does not include information that is collected anonymously or
              de-identified so that it can no longer be linked to you. Depending on how you interact with us, where
              you live, and as permitted by applicable law, we may collect the following:
            </p>
            <Bullets
              items={[
                {
                  name: "Contact details:",
                  body: "Your name, billing and shipping addresses, phone number and email address.",
                },
                {
                  name: "Order and transaction information:",
                  body: "The products you view, add to your cart, wishlist, buy, return, exchange or cancel, along with your order history and any reviews you post.",
                },
                {
                  name: "Account information:",
                  body: "Your username, securely hashed password, security settings and preferences, if you create an account.",
                },
                {
                  name: "Payment information:",
                  body: "Card type, last four digits, billing address, transaction amount and payment confirmation. We never receive or store your full card number — that is handled directly by Stripe.",
                },
                {
                  name: "Communications:",
                  body: "Anything you include when you contact support, leave a review, or reply to an email from us.",
                },
                {
                  name: "Device and usage information:",
                  body: "Your IP address, browser type, device, and how and when you interact with or navigate the Site.",
                },
                {
                  name: "Inferences:",
                  body: "Information we derive from the above, such as the products most likely to interest you based on what you have viewed or bought.",
                },
              ]}
            />
          </Section>

          <Section id="sources" title="3. Where Information Comes From">
            <p>We collect personal information from the following sources:</p>
            <Bullets
              items={[
                {
                  name: "Directly from you",
                  body: "when you create an account, place an order, contact support, or otherwise give us your details.",
                },
                {
                  name: "Automatically",
                  body: "through cookies and similar technologies as you browse the Site — for example, the currency you are shown prices in.",
                },
                {
                  name: "From our service providers",
                  body: "from the vendors who process information on our behalf, such as Stripe and CJ — for example, the tracking number on a shipment.",
                },
                {
                  name: "From our business partners",
                  body: "where they collect information for us to fulfil your order, such as the carrier that delivers your parcel.",
                },
              ]}
            />
          </Section>

          <Section id="use" title="4. How We Use Your Information">
            <p>Depending on how you interact with us, we use your personal information to:</p>
            <Bullets
              items={[
                {
                  body: "Provide the Site and perform our contract with you — process payments, place and ship your order, and arrange delivery.",
                },
                {
                  body: "Create, manage and secure your account, and send you service messages such as order confirmations and shipping updates.",
                },
                {
                  body: "Remember your preferences, wishlist and cart, and to tailor the experience — for example, recommending products related to what you have bought.",
                },
                {
                  body: "Answer your questions, resolve issues, and handle returns, exchanges and refunds.",
                },
                {
                  body: "Send marketing and promotional communications by email, where you have consented or where otherwise permitted by law. You can unsubscribe at any time.",
                },
                {
                  body: "Detect, investigate and prevent fraud, abuse and security incidents, and to enforce our terms.",
                },
                {
                  body: "Improve the Site, our products and your experience, including by understanding which features are used.",
                },
                {
                  body: "Comply with applicable law and respond to valid legal process, including requests from law enforcement or government agencies.",
                },
              ]}
            />
          </Section>

          <Section id="sharing" title="5. How We Share Your Information">
            <p>
              We do not sell your personal information. In certain circumstances we may share it with third parties for
              legitimate purposes:
            </p>
            <Bullets
              items={[
                {
                  body: "With the service providers who run parts of our business for us — payments, fulfillment and shipping, email delivery, hosting, database storage and analytics. See Section 6.",
                },
                {
                  body: "With the payment processor, carrier or fulfillment partner, to the extent needed to deliver your order or process your payment.",
                },
                {
                  body: "With our business or marketing partners, to provide marketing services where you have consented or where otherwise permitted.",
                },
                {
                  body: "When you ask us to, or consent to, sharing your information with someone else — for example, if you choose to sign in or share through a social platform.",
                },
                {
                  body: "With our affiliates or others in our corporate group.",
                },
                {
                  body: "In connection with a business transaction such as a merger, acquisition or sale of assets.",
                },
                {
                  body: "To comply with legal obligations (including subpoenas, search warrants and similar requests), to enforce our terms and policies, and to protect or defend the Site, our rights, and the rights of our users or others.",
                },
              ]}
            />
          </Section>

          <Section id="providers" title="6. Our Service Providers">
            <p>
              The providers below process information on our behalf. Each operates under its own privacy policy, and
              you should read it if you want to know more about how they handle data.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-[#1C1917]/15">
                    <th className="py-2 pr-4 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">
                      Provider
                    </th>
                    <th className="py-2 pr-4 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">
                      Purpose
                    </th>
                    <th className="py-2 text-left font-display text-xs font-bold uppercase tracking-[0.1em] text-[#1C1917]">
                      Information shared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1917]/10">
                  {SERVICE_PROVIDERS.map((provider) => (
                    <tr key={provider.name}>
                      <td className="py-3 pr-4 align-top font-medium text-[#1C1917]">
                        {provider.name}
                        {provider.link ? (
                          <a
                            href={provider.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block text-xs font-normal text-[#78716C] underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
                          >
                            {provider.link.label}
                          </a>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 align-top text-[#44403C]">{provider.purpose}</td>
                      <td className="py-3 align-top text-[#44403C]">{provider.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="cookies" title="7. Cookies & Similar Technologies">
            <p>
              We use cookies and similar technologies to keep the Site working, to remember your preferences, and to
              understand how it is used. We do not use cookies to build an advertising profile of you.
            </p>
            <Bullets items={COOKIE_TYPES} />
            <p>
              You can control or delete cookies through your browser settings, and most browsers let you block or
              clear them. Disabling essential cookies may stop the Site working properly — you may not be able to
              check out or sign in.
            </p>
            <p className="text-sm text-[#78716C]">
              More about the Global Privacy Control opt-out signal is at{" "}
              <ExtLink href="https://globalprivacycontrol.org/">globalprivacycontrol.org</ExtLink>.
            </p>
          </Section>

          <Section id="retention" title="8. How Long We Keep Your Information">
            <p>
              We keep personal information only for as long as we need it for the purpose it was collected, and then
              only for as long as we are required or permitted to keep it. In practice:
            </p>
            <Bullets
              items={[
                {
                  name: "Order records",
                  body: "are kept for as long as needed to meet tax, accounting and consumer-protection obligations, and to handle returns and disputes.",
                },
                {
                  name: "Account information",
                  body: "is kept while your account is active, and for a reasonable period afterwards so we can honour requests relating to past orders.",
                },
                {
                  name: "Support correspondence",
                  body: "is kept while the matter is open and for a reasonable period afterwards, so we have context if you come back to us.",
                },
                {
                  name: "Analytics data",
                  body: "is kept only as long as needed to produce aggregate reports about how the Site is used.",
                },
              ]}
            />
            <p>
              When we no longer need the information, we delete or anonymize it. If you ask us to delete your
              information but we are required by law to keep certain records, we will keep only the minimum necessary
              and will explain this to you.
            </p>
          </Section>

          <Section id="rights" title="9. Your Rights & Choices">
            <p>
              Depending on where you live, you may have some or all of the rights below. These rights are not
              absolute — they may apply only in certain situations, and in some cases we may decline a request where
              the law allows us to.
            </p>
            <Bullets items={RIGHTS} />
            <p>
              <strong className="text-[#1C1917]">Marketing preferences:</strong> every marketing email includes an
              unsubscribe link. If you use it we will stop sending marketing email, though we may still send service
              messages about your account or your orders.
            </p>
            <p>
              <strong className="text-[#1C1917]">Do Not Track:</strong> apart from the Global Privacy Control, we do
              not respond to &ldquo;Do Not Track&rdquo; signals, because there is no agreed industry standard for
              them.
            </p>
            <p>
              We will never discriminate against you for exercising a right. We may need to verify your identity
              before we can act on a request. In some cases you may appoint someone to make a request on your behalf
              — we will require proof that they are authorized to act for you, and may still need to verify your
              identity directly. We respond within the timeframe required by applicable law.
            </p>
          </Section>

          <Section id="complaints" title="10. Complaints">
            <p>
              If you have a complaint about how we handle your personal information, please contact us using the
              details in Section 17. We will acknowledge and investigate your concern and aim to resolve it promptly.
            </p>
            <p>
              If you are not satisfied with our response, and you live in a jurisdiction that provides for it, you may
              escalate to your local data protection authority. In the European Economic Area you can find your
              national authority at{" "}
              <ExtLink href="https://www.edpb.europa.eu/edpb/authorities/national-dp-authorities_en">
                edpb.europa.eu
              </ExtLink>
              . In Canada, you may contact the Office of the Privacy Commissioner of Canada at{" "}
              <ExtLink href="https://www.priv.gc.ca/">priv.gc.ca</ExtLink>
              . Because we are based in Alberta, you may also contact the Office of the Information and Privacy
              Commissioner of Alberta at{" "}
              <ExtLink href="https://oipc.ab.ca/">oipc.ab.ca</ExtLink>.
            </p>
          </Section>

          <Section id="breach" title="11. Data Breaches">
            <p>
              If we discover a breach of security safeguards involving your personal information that creates a real
              risk of significant harm to you, we will report it to the Office of the Information and Privacy
              Commissioner of Alberta and notify you in accordance with the time limits set by Alberta&rsquo;s
              Personal Information Protection Act. Alberta gives organizations up to 60 days to report a breach with
              real risk of significant harm.
            </p>
            <p>
              We keep a record of all breaches of security safeguards as required by law, whether or not they are
              reportable, and we will inform you and any relevant regulator where the law requires it.
            </p>
          </Section>

          <Section id="transfers" title="12. International Data Transfers">
            <p>
              We are based in Canada, and some of the providers listed in Section 6 are located in other countries. As
              a result, your personal information may be stored and processed outside the country you live in.
            </p>
            <p>
              Where we transfer personal information out of the European Economic Area or the United Kingdom, we rely
              on an appropriate transfer mechanism — for example, the European Commission&rsquo;s Standard Contractual
              Clauses, or an equivalent contract issued by the relevant UK authority — unless the destination country
              has been found to provide an adequate level of protection.
            </p>
          </Section>

          <Section id="children" title="13. Children’s Data">
            <p>
              The Site is not intended for children, and we do not knowingly collect personal information from anyone
              under the age of majority in their jurisdiction. As of the date of this Privacy Policy, we do not have
              actual knowledge that we &ldquo;share&rdquo; or &ldquo;sell&rdquo; (as those terms are defined in
              applicable law) the personal information of anyone under 16.
            </p>
            <p>
              If you are the parent or guardian of a child who has given us personal information, contact us and we
              will delete it — see Section 17.
            </p>
          </Section>

          <Section id="security" title="14. Data Security">
            <p>
              We use commercially reasonable administrative, technical and organizational safeguards to protect your
              personal information:
            </p>
            <Bullets
              items={[
                { body: "Encryption of data in transit using TLS/SSL across the whole Site." },
                { body: "Passwords hashed with bcrypt — never stored in plain text." },
                {
                  body: "Payment details handled entirely by Stripe, which is PCI-DSS compliant. Card numbers never reach or touch our servers.",
                },
                { body: "Restricted, need-to-know access to personal information within our team." },
                { body: "Two-factor authentication available on staff accounts." },
              ]}
            />
            <p>
              No security measure is perfect, and we cannot guarantee absolute security. Information you send us may
              not be secure while in transit, so please avoid unencrypted channels for sensitive information.
            </p>
          </Section>

          <Section id="third-party" title="15. Third-Party Websites & Links">
            <p>
              The Site may link to websites or platforms operated by third parties. If you follow a link to a site we
              do not control, please review its privacy policy and other terms. We do not control and are not
              responsible for the privacy or security of those sites, or for the accuracy, completeness or reliability
              of anything found on them.
            </p>
            <p>
              If you post information publicly or semi-publicly — including on social platforms — it may be visible to
              other users of the Site and of those platforms, without limitation as to how it is used by us or by
              them. Including a link does not by itself mean we endorse the content on that platform or the people who
              run it, except as expressly stated on the Site.
            </p>
          </Section>

          <Section id="changes" title="16. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices, our services,
              or our legal or regulatory obligations. We will post the revised policy on this page, update the
              &ldquo;Last updated&rdquo; date, and provide further notice where the law requires it.
            </p>
            <p>
              We encourage you to review this page periodically. If a change is material, we will let you know before
              it takes effect.
            </p>
          </Section>

          <Section id="contact" title="17. Contact Us">
            <p>
              Questions about this Privacy Policy, or about how we handle your personal information? Email us at{" "}
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
              , or call {BUSINESS_INFO.phone}. To exercise any of the rights in Section 9, or to make a complaint
              under Section 10, please put &ldquo;Privacy Request&rdquo; or &ldquo;Privacy Complaint&rdquo; in the
              subject line so it reaches the right person quickly.
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
              <p className="mt-3 text-[#78716C]">
                For the purposes of applicable data protection law, {BUSINESS_INFO.legalName} is the data controller
                of your personal information.
              </p>
            </div>
            <p className="pt-2 text-sm text-[#78716C]">
              We aim to respond to all privacy requests within 30 days, and sooner where the law requires it.
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

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
    >
      {children}
    </a>
  );
}
