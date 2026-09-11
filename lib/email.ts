const DEO_MAIL_API_KEY = process.env.DEO_MAIL_API_KEY ?? "";
const DEO_MAIL_API_URL = "https://api.deomail.com/v1/send";
const DEFAULT_FROM = "info@veldicwear.com";

async function sendDeoMail(options: {
  from?: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
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
      from: options.from ?? DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
      fingerprint: options.fingerprint ?? false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`DeoMail API error (${response.status}): ${data.error ?? "Unknown error"}`);
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
  items: Array<{ name: string; size: string; quantity: number; price: number }>;
}) {
  const { to, orderNumber, trackingNumber, trackingCarrier, items } = options;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd">${item.size}</td><td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
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
  items: Array<{ name: string; size: string; quantity: number; price: number }>;
}) {
  const { to, orderId, orderNumber, orderTotal, items, trackingToken } = options;
  const trackingUrl = `${process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/track-order?token=${encodeURIComponent(trackingToken)}`;

  const itemRows = items
    .map(
      (item) =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd">${item.size}</td><td style="padding: 8px; border: 1px solid #ddd">${item.quantity}</td><td style="padding: 8px; border: 1px solid #ddd">$${(item.price * item.quantity).toFixed(2)}</td></tr>`
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