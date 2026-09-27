import {
  RETURN_REASONS,
  RETURN_WINDOW_DAYS,
  SUPPORT_EMAIL,
  RETURN_SHIPPING_ADDRESS,
  getReturnOpsPlaybook,
  isReturnReason,
} from "@/lib/returns";

/**
 * Customer-supplied text (return notes, reasons) is echoed into HTML emails, so
 * it is escaped before it reaches a template. Anything that comes from our own
 * catalog (product names, sizes) is not.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function returnReasonLabel(reason: string): string {
  return RETURN_REASONS.find((entry) => entry.value === reason)?.label ?? reason;
}

const DEO_MAIL_API_KEY = process.env.DEO_MAIL_API_KEY ?? "";
const DEO_MAIL_API_URL = "https://api.deomail.com/v1/send";
// DeoMail only authorizes the exact lowercase sender identity
// (e.g. info@veldicwear.com) — normalize in case EMAIL_FROM is set
// with different casing like "Info@veldicwear.com".
const DEFAULT_FROM = (process.env.EMAIL_FROM ?? "info@veldicwear.com").toLowerCase();

export async function sendDeoMail(options: {
  from?: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  /** Fingerprint footer enabled by default (free-plan compatible). Pass false only on a paid DeoMail plan. */
  fingerprint?: boolean;
}) {
  if (!DEO_MAIL_API_KEY) {
    throw new Error("DEO_MAIL_API_KEY is not configured");
  }

  const response = await fetch(DEO_MAIL_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": DEO_MAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: (options.from ?? DEFAULT_FROM).toLowerCase(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      reply_to: options.replyTo,
      fingerprint: options.fingerprint ?? true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`DeoMail API error (${response.status}): ${data.error ?? "Unknown error"}`);
  }

  // DeoMail returns HTTP 200 even for logical failures
  // (e.g. FINGERPRINT_REQUIRES_PLAN) — treat success:false as an error
  // so callers never report "sent" when nothing was delivered.
  if (data && typeof data === "object" && "success" in data && (data as { success?: boolean }).success === false) {
    const err = data as { error?: string; code?: string };
    throw new Error(`DeoMail API error${err.code ? ` (${err.code})` : ""}: ${err.error ?? "Unknown error"}`);
  }

  return data;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  return sendDeoMail({
    to: [options.to],
    subject: options.subject,
    html: options.html,
  });
}

export async function sendOrderShippedEmail(options: {
  to: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  items: Array<{ name: string; size: string; color?: string | null; quantity: number; price: number }>;
}) {
  const { to, orderNumber, trackingNumber, trackingCarrier, items } = options;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd">${item.size}</td><td style="padding: 8px; border: 1px solid #ddd">${item.color ?? "—"}</td><td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const trackingHtml = trackingNumber
    ? `<p style="margin-top: 24px;"><strong>Tracking:</strong> ${trackingCarrier ? `${trackingCarrier} — ` : ""}${trackingNumber}</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h1>Your Order Has Shipped!</h1>
      <p>Great news! Your order <strong>${orderNumber}</strong> is on its way.</p>
      ${trackingHtml}
      <h2>Order summary</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Size</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Color</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p style="margin-top: 24px;">Thank you for shopping with Veldic Wear.</p>
    </div>
  `;

  return sendDeoMail({
    to: [to],
    subject: `Your Veldic Wear order ${orderNumber} has shipped!`,
    html,
  });
}

export async function sendOrderConfirmationEmail(options: {
  to: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  trackingToken: string;
  items: Array<{ name: string; size: string; color?: string | null; quantity: number; price: number }>;
}) {
  const { to, orderId, orderNumber, orderTotal, items, trackingToken } = options;
  const trackingUrl = `${process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/track-order?token=${encodeURIComponent(trackingToken)}`;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd">${item.size}</td><td style="padding: 8px; border: 1px solid #ddd">${item.color ?? "—"}</td><td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h1>Order Confirmation</h1>
      <p>Thank you for your order. Your order <strong>${orderNumber}</strong> has been received.</p>
      <p>Stripe payment ID: <strong>${orderId}</strong></p>
      <h2>Order summary</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Size</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Color</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p style="margin-top: 24px;">Order total: <strong>$${orderTotal.toFixed(2)}</strong></p>
      <p><a href="${trackingUrl}">Track your order</a></p>
      <p>If you have any questions, reply to this email.</p>
    </div>
  `;

  return sendDeoMail({
    to: [to],
    subject: `Your Veldic Wear order ${orderNumber} is confirmed`,
    html,
  });
}

export async function sendWelcomeEmail(options: { to: string }) {
  const { to } = options;
  const siteUrl =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";
  const shopUrl = `${siteUrl}/collections`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1B2737; max-width: 600px; margin: 0 auto; background: #F3F7FC;">
      <div style="background: #2563EB; padding: 32px 24px; text-align: center;">
        <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; letter-spacing: 2px;">VELDIC WEAR</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="font-size: 20px; margin: 0 0 12px;">Welcome to the community 🎉</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #5B6B85; margin: 0 0 16px;">
          Thanks for subscribing! You're now on the list to be the first to know about
          new collections, exclusive drops, and limited-edition releases.
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${shopUrl}" style="display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: bold; padding: 14px 32px; border-radius: 4px;">Shop the latest drop</a>
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #5B6B85; margin: 24px 0 0;">
          If you have any questions, just reply to this email — we're happy to help.
        </p>
      </div>
      <div style="padding: 20px 24px; border-top: 1px solid #E2E8F0; text-align: center;">
        <p style="font-size: 12px; color: #5B6B85; margin: 0;">
          You're receiving this email because you subscribed at veldicwear.com.
          <br />
          No spam. <a href="${siteUrl}/privacy" style="color: #5B6B85;">Unsubscribe anytime</a>.
        </p>
      </div>
    </div>
  `;

  return sendDeoMail({
    to: [to],
    subject: "Welcome to Veldic Wear — you're in!",
    html,
  });
}

/**
 * Notify the support inbox about a return started from the /returns portal.
 *
 * There is no Return table, so this email IS the record: it has to carry
 * everything a human needs to action the request without opening the database.
 * `to` defaults to the support inbox and the customer's address goes on
 * replyTo, so hitting Reply in the inbox answers the customer directly.
 */
export async function sendReturnRequestEmail(options: {
  /** Where the request lands. Defaults to the support inbox. */
  to?: string;
  customerEmail: string;
  orderNumber: string;
  reference: string;
  reason: string;
  note: string;
  items: Array<{ name: string; size: string; color?: string | null; quantity: number; price: number }>;
}) {
  const { customerEmail, orderNumber, reference, reason, note, items } = options;
  const to = options.to ?? SUPPORT_EMAIL;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd">${item.size}</td><td style="padding: 8px; border: 1px solid #ddd">${item.color ?? "—"}</td><td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const noteBlock = note
    ? `<p style="margin-top: 16px;"><strong>Customer note:</strong><br />${escapeHtml(note).replace(/\n/g, "<br />")}</p>`
    : "";

  const validatedReason = isReturnReason(reason) ? reason : "other";
  const playbook = getReturnOpsPlaybook(validatedReason, orderNumber);

  const playbookSteps = playbook.actionSteps
    .map((step) => `<li style="margin: 4px 0;">${escapeHtml(step)}</li>`)
    .join("");

  const playbookLinks = playbook.quickLinks
    .map(
      (link) =>
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color: #2563EB; text-decoration: underline; margin-right: 16px;">${escapeHtml(link.label)} &rarr;</a>`
    )
    .join("");

  const returnAddressBlock = RETURN_SHIPPING_ADDRESS
    ? `<p style="margin-top: 8px;"><strong>Configured Domestic Return Address:</strong><br /><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${escapeHtml(RETURN_SHIPPING_ADDRESS)}</code></p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h1>New return request</h1>
      <p>A customer started a return from the website. Nothing has been shipped back yet — reply with the return instructions and the address.</p>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tbody>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Reference</strong></td><td style="padding: 4px 0;">${reference}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Order</strong></td><td style="padding: 4px 0;">${orderNumber}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Customer email</strong></td><td style="padding: 4px 0;">${escapeHtml(customerEmail)}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Reason</strong></td><td style="padding: 4px 0;">${escapeHtml(returnReasonLabel(reason))}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top: 24px;">Items to refund on arrival</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Size</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Color</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left">Total</th>
          </tr>
        </thead>

        <tbody>${itemRows}</tbody>
      </table>
      ${noteBlock}

      <!-- Dropshipping Fulfillment & Action Guide -->
      <div style="margin-top: 28px; padding: 16px; background: #FFFBEB; border-left: 4px solid #CA8A04; border-radius: 4px;">
        <h3 style="margin: 0 0 8px; color: #92400E; font-size: 15px;">Fulfillment Ops Guide: ${escapeHtml(playbook.title)}</h3>
        <p style="margin: 0 0 10px; font-size: 13px; color: #78350F;">${escapeHtml(playbook.summary)}</p>
        <ol style="margin: 0 0 12px; padding-left: 20px; font-size: 13px; color: #78350F; line-height: 1.5;">
          ${playbookSteps}
        </ol>
        ${returnAddressBlock}
        <div style="margin-top: 12px; font-size: 13px;">
          ${playbookLinks}
        </div>
      </div>

      <p style="margin-top: 24px; color: #555;">Requested inside the ${RETURN_WINDOW_DAYS}-day window. Refund to the original payment method once the parcel is received and inspected.</p>
    </div>
  `;

  return sendDeoMail({
    to: [to],
    subject: `Return request ${reference} — order ${orderNumber}`,
    html,
    replyTo: customerEmail,
  });
}

/** Tell the customer their request landed, and what happens next. */
export async function sendReturnRequestConfirmationEmail(options: {
  to: string;
  orderNumber: string;
  reference: string;
  reason: string;
  itemCount: number;
  items: Array<{ name: string; size: string; color?: string | null; quantity: number }>;
}) {
  const { to, orderNumber, reference, reason, itemCount, items } = options;
  const siteUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const itemRows = items
    .map(
      (item) =>
        `<li style="margin: 4px 0;">${item.name} — size ${item.size}${item.color ? `, color ${item.color}` : ""} &times; ${item.quantity}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h1>We've got your return request</h1>
      <p>Thanks for letting us know. Nothing to do for a few days — please <strong>don't</strong> post anything back until we email you the return address.</p>
      <table style="border-collapse: collapse; margin-top: 16px;">
        <tbody>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Reference</strong></td><td style="padding: 4px 0;">${reference}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Order</strong></td><td style="padding: 4px 0;">${orderNumber}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Reason</strong></td><td style="padding: 4px 0;">${escapeHtml(returnReasonLabel(reason))}</td></tr>
          <tr><td style="padding: 4px 16px 4px 0;"><strong>Items</strong></td><td style="padding: 4px 0;">${itemCount}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top: 24px;">What you told us you're sending back</h2>
      <ul>${itemRows}</ul>
      <h2 style="margin-top: 24px;">What happens next</h2>
      <ol>
        <li>We email you a prepaid label and the return address.</li>
        <li>You send the items back unworn, with the tags still attached, within ${RETURN_WINDOW_DAYS} days of delivery.</li>
        <li>We inspect them and refund the item price to your original payment method, then email you the refund confirmation.</li>
      </ol>
      <p>Quote reference <strong>${reference}</strong> in any reply — it goes straight to the person handling your return.</p>
      <p><a href="${siteUrl}/returns-refund-policy">Read the full Return &amp; Refund Policy</a></p>
    </div>
  `;

  return sendDeoMail({
    to: [to],
    subject: `We have your return request ${reference} (order ${orderNumber})`,
    html,
  });
}

/**
 * Answer a contact-form customer from Admin → Messages.
 *
 * The reply leaves from the same sender identity as every other store email and
 * puts the support inbox on `replyTo`, so if the customer answers again the mail
 * lands back with us rather than bouncing.
 *
 * The admin's body is plain text from a textarea: it is escaped, then newlines
 * become <br> so the paragraph structure survives. The original message is
 * quoted underneath so the customer can see what is being answered.
 */
export async function sendContactMessageReplyEmail(options: {
  to: string;
  customerName: string;
  originalSubject: string;
  originalMessage: string;
  body: string;
}) {
  const { to, customerName, originalSubject, originalMessage, body } = options;
  const siteUrl =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // "Re:" is added once — replying to an already-"Re:"-prefixed subject must not
  // stack up into "Re: Re: …".
  const subject = /^re:/i.test(originalSubject) ? originalSubject : `Re: ${originalSubject}`;

  const bodyHtml = escapeHtml(body).replace(/\r?\n/g, "<br />");
  const quotedHtml = escapeHtml(originalMessage).replace(/\r?\n/g, "<br />");
  const firstName = customerName.trim().split(/\s+/)[0] || customerName.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px;">
      <h1 style="font-size: 20px; margin-bottom: 16px;">Hi ${escapeHtml(firstName)},</h1>
      <div style="line-height: 1.6;">${bodyHtml}</div>
      <p style="margin-top: 24px; font-size: 13px; color: #555;">
        Just reply to this email and it comes straight back to our support inbox — we're happy to help.
      </p>
      <div style="margin-top: 24px; padding: 12px; border-left: 4px solid #ddd; background: #f9f9f9;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #555;">
          On ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} you wrote:
        </p>
        <p style="margin: 0 0 8px; font-size: 13px;"><strong>${escapeHtml(subject)}</strong></p>
        <p style="margin: 0; line-height: 1.5; color: #333;">${quotedHtml}</p>
      </div>
      <p style="margin-top: 24px;">— Veldic Wear Support</p>
      <p style="margin-top: 16px; font-size: 12px; color: #777;">
        <a href="${siteUrl}" style="color: #777;">veldicwear.com</a>
      </p>
    </div>
  `;

  const text = [
    `Hi ${firstName},`,
    "",
    body,
    "",
    "Just reply to this email and it comes straight back to our support inbox — we're happy to help.",
    "",
    "— Veldic Wear Support",
  ].join("\n");

  return sendDeoMail({
    to: [to],
    subject,
    replyTo: SUPPORT_EMAIL,
    html,
    text,
  });
}

