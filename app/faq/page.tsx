import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RETURN_WINDOW_DAYS } from "@/lib/returns";
import { BUSINESS_INFO, BUSINESS_ADDRESS_LINE } from "@/lib/business-info";

/**
 * Public FAQ page.
 *
 * Backed by the FAQ table rather than hard-coded copy: the rows, order and
 * published flag are all editable at Admin -> Content -> FAQ, so support can
 * add an answer without a deploy. The seeded questions live in
 * scripts/seed-faq.ts.
 *
 * "faq" is already in the staticSlugs allow-list in app/[slug]/page.tsx, so
 * this route owns the URL and no CmsPage row is required.
 *
 * Rendered on demand (force-dynamic) for the same reason as app/[slug]: a
 * static build would freeze admin edits until the next deploy, and would make
 * a live database a hard requirement of `next build`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Frequently Asked Questions | ${BUSINESS_INFO.name}`,
  description:
    "Answers to common questions about ordering, shipping, tracking, returns, exchanges and refunds.",
};

/** Grouped for display. `group` is presentation-only — the DB has no such column. */
type FaqGroup = {
  id: string;
  title: string;
  items: { id: string; question: string; answer: string }[];
};

// Grouped by leading question prefix so the list reads as topics rather than
// one long column. Order here is the order on the page.
const GROUPS: { id: string; title: string; match: RegExp }[] = [
  {
    id: "orders",
    title: "Orders & Payment",
    match: /^(how do i place|what payment|is my payment|do you accept|can i change|can i cancel)/i,
  },
  {
    id: "shipping",
    title: "Shipping",
    match: /^(how long|do you ship|where do you ship|will i have to pay|is shipping free|do you ship internationally)/i,
  },
  {
    id: "tracking",
    title: "Tracking Your Order",
    match: /^(where is my order|how do i track|when will)/i,
  },
  {
    id: "returns",
    title: "Returns & Exchanges",
    match: /^(what is your return|how do i return|can i exchange|how long do i have|do you have a warranty|are your products)/i,
  },
  {
    id: "products",
    title: "Products",
    match: /^(how do i find my|what sizes|what material|do you restock|are your products)/i,
  },
];

const GENERAL_ID = "general";

function groupFor(question: string): string {
  const found = GROUPS.find((g) => g.match.test(question.trim()));
  return found ? found.id : GENERAL_ID;
}

export default async function FaqPage() {
  const rows = await prisma.fAQ.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });

  // Group in one pass, preserving sortOrder inside each group.
  const byId = new Map<string, FaqGroup>(
    GROUPS.map((g): [string, FaqGroup] => [g.id, { id: g.id, title: g.title, items: [] }]),
  );
  byId.set(GENERAL_ID, { id: GENERAL_ID, title: "Other Questions", items: [] });

  for (const row of rows) {
    byId.get(groupFor(row.question))?.items.push({
      id: row.id,
      question: row.question,
      answer: row.answer,
    });
  }

  const groups = [...byId.values()].filter((g) => g.items.length > 0);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <main className="min-h-screen bg-[#FAFAF9]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="border-b border-[#1C1917]/15 pb-8">
          <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#CA8A04]">
            Support
          </p>
          <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight text-[#1C1917] sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 font-sans text-sm text-[#78716C]">
            {total === 0
              ? "No questions have been published yet."
              : `${total} ${total === 1 ? "answer" : "answers"} covering ordering, shipping, returns and products.`}
          </p>
          <div className="mt-4 rounded border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
            <p className="font-sans text-xs leading-5 text-[#78716C]">
              <strong className="text-[#CA8A04]">ⓘ Still stuck?</strong> Email us at{" "}
              <a
                href={`mailto:${BUSINESS_INFO.email}`}
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
              >
                {BUSINESS_INFO.email}
              </a>
              , call {BUSINESS_INFO.phone}, or use the{" "}
              <Link
                href="/contact"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
              >
                contact form
              </Link>
              . We aim to reply within one business day.
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="mt-10 border border-[#1C1917]/10 bg-white p-8 text-center">
            <p className="font-sans text-base text-[#44403C]">
              We&rsquo;re still writing these up. In the meantime, our{" "}
              <Link
                href="/shipping-policy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Shipping Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/returns-refund-policy"
                className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] cursor-pointer"
              >
                Return &amp; Refund Policy
              </Link>{" "}
              cover the details.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-12">
            {groups.map((group) => (
              <section key={group.id}>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[#1C1917]">
                  {group.title}
                </h2>
                <div className="mt-4 divide-y divide-[#1C1917]/10 border border-[#1C1917]/10 bg-white">
                  {group.items.map((item) => (
                    <details key={item.id} className="group">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 font-sans text-base font-medium text-[#1C1917] transition-colors duration-200 hover:text-[#CA8A04] [&::-webkit-details-marker]:hidden">
                        <span>{item.question}</span>
                        <svg
                          className="mt-1 h-4 w-4 shrink-0 text-[#CA8A04] transition-transform duration-200 group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-5 pb-5">
                        <p className="font-sans text-base leading-relaxed text-[#44403C]">
                          {item.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Return window comes from lib/returns so this page, the /returns
            portal, the policy pages and the emails can never disagree. */}
        <div className="mt-12 border border-[#1C1917]/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-[#1C1917]">
            The short version
          </h2>
          <ul className="mt-4 space-y-2.5">
            {[
              `Returns are open for ${RETURN_WINDOW_DAYS} days from delivery — unworn, with tags attached.`,
              "If something arrives damaged, faulty or wrong, that’s on us to fix rather than a return.",
              "Free standard shipping on every order, to every destination we serve.",
              "Import duties on international orders are set by the destination country and are payable by you on delivery.",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#CA8A04]" />
                <span className="font-sans text-sm text-[#44403C]">{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <div className="mt-16 border-t border-[#1C1917]/15 pt-8 text-center">
          <p className="font-sans text-sm text-[#78716C]">
            <Link
              href="/contact"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              Contact us
            </Link>
            <span className="mx-2 text-[#CA8A04]">·</span>
            <Link
              href="/shipping-policy"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              Shipping Policy
            </Link>
            <span className="mx-2 text-[#CA8A04]">·</span>
            <Link
              href="/returns-refund-policy"
              className="underline decoration-[#CA8A04]/40 underline-offset-2 transition-colors duration-200 hover:decoration-[#CA8A04] text-[#1C1917] cursor-pointer"
            >
              Return &amp; Refund Policy
            </Link>
          </p>
          <p className="mt-3 font-sans text-xs text-[#78716C]">
            {BUSINESS_INFO.legalName} · {BUSINESS_ADDRESS_LINE}
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
