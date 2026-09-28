/**
 * Seed the FAQ table with the starter questions.
 *
 * The rows are editable at Admin -> Content -> FAQ (add / edit / reorder /
 * unpublish), so this only needs re-running for a fresh install.
 *
 * Idempotent: matches on the exact question text. An existing question is
 * left alone — a question edited in the admin is never overwritten here. Only
 * questions that do not exist yet are inserted.
 *
 * Content rules this follows, so the FAQ cannot contradict the policies:
 *  - The return window is interpolated from RETURN_WINDOW_DAYS, never typed.
 *  - Duties are NOT described as prepaid for any destination, matching the
 *    shipping and returns policies.
 *  - Free shipping is stated with no minimum, matching the shipping policy.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { RETURN_WINDOW_DAYS } from "../lib/returns";

const FAQS: { question: string; answer: string }[] = [
  // ── Orders & Payment ────────────────────────────────────────────────────
  {
    question: "How do I place an order?",
    answer:
      "Add items to your cart, then head to checkout. You'll enter your shipping and contact details, review the order summary, and then pay. Payment is handled by Stripe, so your card details go directly to them and never touch our servers.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major cards — Visa, Mastercard and American Express — through Stripe. Any other method shown at checkout is available too.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Yes. Payments are processed entirely by Stripe, which is PCI-DSS compliant. We never receive or store your full card number — only the last four digits, the amount and a payment reference, so we can process refunds and support you.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "Tell us as soon as you can using the contact form with your order number. We can usually make changes while your order is still being prepared. Once it has shipped, you'll need to use the returns process instead.",
  },

  // ── Shipping ────────────────────────────────────────────────────────────
  {
    question: "How long does delivery take?",
    answer:
      "Your estimated arrival is calculated live and shown on the product page, in your cart and again at checkout. Every estimate starts when your order ships, not when you buy. Customs clearance and carrier delays can extend it, so treat the estimate as a guide rather than a guarantee.",
  },
  {
    question: "Is shipping free?",
    answer:
      "Standard shipping is free on every order, to every destination we serve, with no minimum spend. It's a limited-time offer, so it can end without notice — there is no code to enter and no threshold to reach.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes. We ship to Canada, the United States and the rest of the world. Delivery time to international destinations depends on the country and how long customs clearance takes.",
  },
  {
    question: "Will I have to pay import duties?",
    answer:
      "For international orders, any import duties, taxes and customs fees are set by the destination country and are not included in your order total or shipping fee. You'll need to pay them before the parcel is released. We declare the full value of every shipment, as we're required to, which can also affect the amount charged. Our Shipping Policy has the details.",
  },


  // ── Tracking ────────────────────────────────────────────────────────────
  {
    question: "Where is my order?",
    answer:
      "As soon as your order ships you'll get a confirmation email with a tracking number. Tracking can take 24 to 48 hours to start updating. You can also check the current status any time on our Track Order page using your order number and the email address on the order.",
  },

  // ── Returns & Exchanges ─────────────────────────────────────────────────
  {
    question: "What is your return policy?",
    answer: `You can request a return within ${RETURN_WINDOW_DAYS} days of delivery. Send items back unworn with the tags still attached, and we'll refund the item price to your original payment method once we've received and inspected them. You can start a return online — it only takes a couple of minutes.`,
  },
  {
    question: "How do I start a return?",
    answer:
      "Go to our Start a Return page and enter your order number and the email address used on the order. Choose the items and the reason, and we'll email you a return address and a prepaid label. Please don't send anything back before you hear from us.",
  },
  {
    question: "What if my item is damaged, faulty or incorrect?",
    answer:
      "That's on us to fix, and it isn't a return. Email us with photos and your order number and we'll sort it out — usually with a replacement or a refund, and we'll cover any return shipping. You don't need to argue the point: if it's our fault, it's our cost.",
  },
  {
    question: "Do you offer exchanges?",
    answer:
      "The fastest way to exchange is to return the item and place a new order for the size or colour you want, so you're not waiting on the return to be processed before your new order ships. If the size you need has sold out, let us know and we'll see what we can do.",
  },
  {
    question: "What if my parcel is lost or arrives damaged?",
    answer:
      "Until your parcel reaches you, it's our responsibility. If it's lost or damaged in transit we replace it or refund you — there's no carrier claim for you to file. Report a lost package within 45 days of the order date (90 days outside Canada and the US, where customs clearance can run long). If tracking shows delivered but the parcel isn't there, check with your building and neighbours first, then tell us within 7 days of the delivery scan.",
  },
  {
    question: "How long do refunds take?",
    answer: `Refunds are issued to your original payment method within ${RETURN_WINDOW_DAYS} days of us receiving and inspecting the returned item — in practice, usually much sooner. Once it is processed, your bank or card issuer may take a few extra days to show it.`,
  },
  {
    question: "Do you have a warranty?",
    answer:
      "Every item is covered against manufacturing defects. If something fails through no fault of your own, contact us with your order number and we'll make it right. Faulty or defective items sit outside the change-of-mind return rules entirely.",
  },

  // ── Products ────────────────────────────────────────────────────────────
  {
    question: "How do I find my size?",
    answer:
      "Each product page carries its own size chart — measurements in both imperial and metric, with fit notes about how the garment sits. If you're between sizes and still unsure, message us with your usual size in another brand and we'll point you the right way.",
  },
  {
    question: "Will the colours look exactly like they do on screen?",
    answer:
      "We do our best to photograph and describe colours accurately, but screens vary. If something arrives noticeably different from what you expected, tell us within 7 days of delivery and we'll put it right.",
  },
  {
    question: "Do you restock sold-out sizes?",
    answer:
      "It depends on the run. Message us with the item and size you're after and we'll tell you honestly whether more is coming — we won't take an order for something we can't ship.",
  },
];

async function main() {
  const existing = await prisma.fAQ.findMany({
    select: { question: true, sortOrder: true },
  });
  const have = new Set(existing.map((r) => r.question));

  const toCreate = FAQS.filter((f) => !have.has(f.question));
  const skipped = FAQS.length - toCreate.length;

  if (toCreate.length === 0) {
    console.log(`All ${FAQS.length} questions already exist. Nothing to do.`);
    return;
  }

  // Continue from the current max so appended rows keep their intended order.
  const maxOrder = existing.length ? Math.max(...existing.map((r) => r.sortOrder)) : 0;

  await prisma.fAQ.createMany({
    data: toCreate.map((f, i) => ({
      question: f.question,
      answer: f.answer,
      sortOrder: maxOrder + 1 + i,
      published: true,
    })),
  });

  console.log(`Inserted ${toCreate.length} question(s); skipped ${skipped} already present.`);
  const total = await prisma.fAQ.count();
  console.log(`FAQ table now has ${total} row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
