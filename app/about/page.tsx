import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_INFO, BUSINESS_ADDRESS_LINE } from "@/lib/business-info";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";

/**
 * Public About page.
 *
 * Static route (like /privacy, /terms, /faq) rather than a CMS page: "about"
 * is already listed in the staticSlugs allow-list in app/[slug]/page.tsx, so
 * this route owns the URL and no CmsPage row is required.
 *
 * Linked from two places: the footer Company group, and the homepage
 * "brand-story" section ("Read our story" -> /about).
 *
 * Copy is deliberately plain. It states what we do and how we handle an order,
 * which is what a customer actually wants from this page, rather than
 * inventing a founding story or figures the business has not verified. Every
 * number quoted comes from RETURN_WINDOW_DAYS or the shipping policy, so this
 * page cannot drift from the policies it summarises.
 */
export const metadata: Metadata = {
  title: `About Us | ${BUSINESS_INFO.name}`,
  description: `${BUSINESS_INFO.name} makes activewear and lifestyle clothing built for the journey. Based in ${BUSINESS_INFO.city}, shipping worldwide.`,
};

const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Built for the ground, not the gym mirror",
    body: "The name comes from the veld — open grassland, the trail, the long way home. We design for the journey rather than the image: pieces that move with you, hold up to real use, and still look right at the end of it.",
  },
  {
    title: "Made to last beyond the season",
    body: "We would rather you buy one jacket that stays in rotation for years than three you replace each winter. That shapes how we choose fabrics and finish them, and it is why we back everything against manufacturing defects.",
  },
  {
    title: "Straight answers on delivery",
    body: "Every delivery window is an estimate, and we say so rather than quoting a number we cannot stand behind. Your estimate is calculated live on the product page, in the cart and at checkout, so you see the same figure we do.",
  },
  {
    title: "The risk is ours until it reaches you",
    body: "If a parcel is lost, damaged, or the wrong item turns up, that is our problem to fix — not yours to chase with a carrier. There is no claim for you to file, and we cover return shipping on anything that is our fault.",
  },
];


export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Our story
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            About {BUSINESS_INFO.name}
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            Premium lifestyle &amp; activewear for every journey. Wear the ground you cover.
          </p>
        </div>

        {/* Intro */}
        <div className="mt-10 space-y-4 font-sans text-base leading-relaxed text-[#44403C]">
          <p>
            {BUSINESS_INFO.name} makes clothing for people who measure progress in miles and
            mornings, not hype. We are a small team based in {BUSINESS_INFO.city}, Canada, and
            we ship to customers across Canada, the United States and further abroad.
          </p>
          <p>
            We are a dropshipper, which means we do not hold stock in a warehouse or
            manufacture everything in-house. What we do take responsibility for is the whole
            relationship with you: the accuracy of what we tell you before you buy, the price
            you pay, and what happens if something goes wrong.
          </p>
          <p>
            Being honest about that matters more than sounding bigger than we are. So this page
            sticks to what you can actually verify — how we ship, how returns work, and who to
            contact when you need a person.
          </p>
        </div>

        {/* Principles */}
        <div className="mt-12 space-y-8">
          {PRINCIPLES.map((p) => (
            <section key={p.title} className="border-l-2 border-[#CA8A04] pl-5">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-[#1C1917]">
                {p.title}
              </h2>
              <p className="mt-3 font-sans text-base leading-relaxed text-[#44403C]">{p.body}</p>
            </section>
          ))}
        </div>


        {/* Quick facts — every line here is a real policy, not marketing. */}
        <div className="mt-12 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
            The practical version
          </h2>
          <ul className="mt-4 space-y-2.5">
            {[
              "Free standard shipping on every order, to every destination we serve.",
              `Returns open for ${RETURN_WINDOW_DAYS} days from delivery — unworn, tags attached.`,
              "Damaged, faulty or incorrect items are our cost, not a return.",
              "Until your parcel reaches you, the risk of loss is ours.",
              `Based in ${BUSINESS_INFO.city}, ${BUSINESS_INFO.country}.`,
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                <span className="font-sans text-sm text-[#44403C]">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-12 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
            Talk to us
          </h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-[#44403C]">
            Questions about an order, a size, or a return? Email{" "}
            <a
              href={`mailto:${BUSINESS_INFO.email}`}
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              {BUSINESS_INFO.email}
            </a>
            , call {BUSINESS_INFO.phone}, or use the{" "}
            <Link
              href="/contact"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
            >
              contact form
            </Link>
            . We answer every message ourselves.
          </p>
          <p className="mt-4 font-sans text-sm text-[#78716C]">
            {BUSINESS_INFO.legalName} · {BUSINESS_ADDRESS_LINE}
          </p>
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-[#1C1917]/15 pt-8 text-center">
          <p className="font-sans text-sm text-[#78716C]">
            <Link
              href="/shop"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              Shop all products
            </Link>
            <span className="mx-2 text-[#CA8A04]">·</span>
            <Link
              href="/faq"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              FAQ
            </Link>
            <span className="mx-2 text-[#CA8A04]">·</span>
            <Link
              href="/contact"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              Contact
            </Link>
          </p>
          <Link
            href="/"
            className="mt-6 inline-block font-display text-lg font-bold tracking-[0.15em] text-[#1C1917] transition-colors duration-200 hover:text-[#CA8A04] cursor-pointer"
          >
            {BUSINESS_INFO.name.toUpperCase()}
          </Link>
          <p className="mt-3 font-sans text-xs text-[#78716C]">
            &copy; {new Date().getFullYear()} {BUSINESS_INFO.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
