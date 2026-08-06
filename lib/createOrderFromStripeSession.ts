import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { incrementCouponUsage } from "@/lib/coupon";
import { cjFulfillOrder } from "@/lib/cj-fulfillment";

/**
 * Create (or find) an order from a Stripe Checkout Session.
 *
 * When `linkingUserId` is provided (typically from the success-page handler
 * where the browser session cookie IS available), the order will be linked
 * to that user if it wasn't already linked via Stripe session metadata.
 */
export async function createOrderFromStripeSession(
  session: Stripe.Checkout.Session,
  linkingUserId?: string | null,
) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const sessionId = session.id;
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const orderTotal = (session.amount_total ?? 0) / 100;
  const firstName = (session.metadata?.customer_name ?? "").split(" ")[0] || "";
  const lastName = (session.metadata?.customer_name ?? "").split(" ").slice(1).join(" ") || "";
  const emailAddress = session.metadata?.customer_email ?? session.customer_details?.email ?? "";
  const phone = session.metadata?.customer_phone ?? session.customer_details?.phone ?? "";
  const shippingAddress = session.metadata?.shipping_address ?? "";
  const requestedUserId = session.metadata?.user_id ?? session.client_reference_id ?? linkingUserId ?? null;
  const [address, city, country, postalCode] = shippingAddress
    .split(",")
    .map((value) => value.trim());

  // The ID comes from server-created Stripe metadata/client_reference_id.
  // `linkingUserId` is an extra fallback from the success-page handler where
  // the browser session cookie is available (the checkout API sometimes fails
  // to detect the session). Confirm the user still exists in the DB first.
  const linkedUser = requestedUserId
    ? await prisma.user.findUnique({ where: { id: requestedUserId }, select: { id: true } })
    : null;
  const userId = linkedUser?.id ?? null;

  // Check if order already exists for this Stripe session. A webhook and the
  // success page may race; never create a second order. If an old attempt made
  // the order before the user link was available, safely fill that missing link.
  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
    include: { items: true },
  });
  if (existingOrder) {
    const order = !existingOrder.userId && userId
      ? await prisma.order.update({ where: { id: existingOrder.id }, data: { userId }, include: { items: true } })
      : existingOrder;
    return {
      order,
      created: false,
      items: order.items.map((oi: {
        name: string;
        size: string;
        quantity: number;
        price: number;
      }) => ({
        name: oi.name,
        size: oi.size,
        quantity: oi.quantity,
        price: oi.price,
      })),
      emailAddress: order.email,
      orderNumber: order.orderNumber,
      orderTotal: order.total,
      paymentIntentId: order.stripeSessionId ?? null,
      hasShippingProtection: order.hasShippingProtection,
    };
  }

  // Fetch line items from Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });

  const items: {
    name: string;
    size: string;
    color: string | null;
    quantity: number;
    price: number;
    productId: string;
  }[] = [];

  for (const item of lineItems.data) {
    // Skip shipping protection — it's tracked via order.hasShippingProtection
    if (item.description === "Shipping Protection") continue;

    // Recover product name + size. The most reliable source is `product_data.name`
    // because we encode size there on the checkout side. Stripe's `description` on
    // a line item comes from `product_data.description` and may be present.
    const stripeProduct = item.price?.product;
    const rawName =
      stripeProduct && typeof stripeProduct === "object" && !stripeProduct.deleted && stripeProduct.name
        ? stripeProduct.name
        : item.description ?? "Product";

    // Strip the trailing "(Size: X, Color: Y)" marker from the product name to recover
    // the original product name, and grab the size + color from the same match.
    const sizeFromName = rawName.match(/\(Size:\s*([^)]+)\)/);
    const itemName = sizeFromName ? rawName.replace(/\s*\(Size:[^)]+\)\s*$/, "").trim() : rawName;
    const itemSize =
      sizeFromName?.[1]?.trim() ||
      item.description?.match(/Size:\s*([^,]+)/)?.[1]?.trim() ||
      "N/A";

    // Extract color from the same "(Size: X, Color: Y)" marker or the description.
    // Falls back to null (NOT "N/A") — null means "no color for this product".
    const colorFromName = sizeFromName?.[1]?.match(/Color:\s*([^,)]+)/i)?.[1]?.trim();
    const itemColor =
      colorFromName ||
      item.description?.match(/Color:\s*([^,)]+)/i)?.[1]?.trim() ||
      null;

    const itemPrice = (item.price?.unit_amount ?? 0) / 100;
    let productId: string | null = null;

    if (typeof item.price?.product === "string") {
      const candidateId = item.price.product;
      const existingProduct = await prisma.product.findUnique({ where: { id: candidateId } });
      if (existingProduct) productId = candidateId;
    } else if (item.price?.product && typeof item.price.product === "object") {
      const stripeProduct = item.price.product;
      let candidateId: string | null = null;
      if (typeof stripeProduct.id === "string") {
        candidateId = stripeProduct.id;
      }
      if (candidateId) {
        const existingProduct = await prisma.product.findUnique({ where: { id: candidateId } });
        if (existingProduct) productId = candidateId;
      }
    }

    if (!productId) {
      const matchingProduct = await prisma.product.findFirst({ where: { name: itemName } });
      productId = matchingProduct?.id ?? null;
    }

    if (!productId) {
      const placeholder = await prisma.product.create({
        data: {
          name: itemName,
          description: "Imported from Stripe order",
          image: "",
          price: itemPrice,
          compareAtPrice: null,
          stock: 0,
          sku: `stripe-${Date.now()}`,
          barcode: "",
          trackInventory: false,
          sellOutOfStock: true,
          weight: 0,
          weightUnit: "kg",
          featured: false,
        },
      });
      productId = placeholder.id;
    }

    items.push({
      name: itemName,
      size: itemSize,
      color: itemColor,
      quantity: item.quantity ?? 1,
      price: itemPrice,
      productId,
    });
  }

  const hasShippingProtection = session.metadata?.shipping_protection === "1";

  const order = await prisma.order.create({
    data: {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      orderNumber,
      firstName,
      lastName,
      email: emailAddress,
      phone,
      country: country ?? "",
      city: city ?? "",
      address: address ?? "",
      postalCode: postalCode ?? "",
      paymentMethod: "Stripe",
      total: orderTotal,
      status: "Ordered",
      hasShippingProtection,
      stripeSessionId: sessionId,
      ...(userId ? { userId } : {}),
      items: {
        create: items.map((item) => ({
          id: `oi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: item.name,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          price: item.price,
          productId: item.productId,
        })),
      },
    },
  });

  // Update stock
  const stockUpdates = Array.from(
    items.reduce((acc, item) => {
      const key = `${item.productId}:${item.size}`;
      if (!acc.has(key)) {
        acc.set(key, { productId: item.productId, size: item.size, quantity: 0 });
      }
      acc.get(key)!.quantity += item.quantity;
      return acc;
    }, new Map<string, { productId: string; size: string; quantity: number }>())
      .values()
  );

  try {
    for (const entry of stockUpdates) {
      // Fetch product settings to determine if inventory should be tracked
      const product = await prisma.product.findUnique({
        where: { id: entry.productId },
        select: { trackInventory: true, sellOutOfStock: true },
      });

      // If product not found or stock isn't tracked, skip decrement
      if (!product || !product.trackInventory || product.sellOutOfStock) continue;

      // Case 1: Product has real variants — decrement the variant with atomic guard
      const variantResult = await prisma.productVariant.updateMany({
        where: {
          productId: entry.productId,
          size: entry.size,
          stock: { gte: entry.quantity },
        },
        data: { stock: { decrement: entry.quantity } },
      });

      if (variantResult.count > 0) {
        // Variant was decremented — Product.stock is for variant-free products only
        continue;
      }

      // Case 2: No variant matched — check if this is a product without variants
      if (entry.size === "N/A") {
        // Fall back to product-level stock with atomic guard
        const productResult = await prisma.product.updateMany({
          where: {
            id: entry.productId,
            stock: { gte: entry.quantity },
          },
          data: { stock: { decrement: entry.quantity } },
        });

        if (productResult.count === 0) {
          throw new Error(
            `Insufficient stock for product ${entry.productId}: requested ${entry.quantity}, but only limited stock available.`
          );
        }
      } else {
        // A real variant was specified (not "N/A") but no matching row found
        throw new Error(
          `Variant "${entry.size}" not found for product ${entry.productId}. Cannot decrement stock.`
        );
      }
    }
  } catch (stockError) {
    console.error("Stock update failed", stockError);
    throw stockError;
  }

  // Increment coupon usage if a coupon was applied
  const couponCode = session.metadata?.coupon_code;
  if (couponCode) {
    await incrementCouponUsage(couponCode);
  }

  // Fire CJ auto-fulfillment asynchronously — does NOT block the response
  // The customer already sees their confirmation page; this runs in the background
  if (order) {
    Promise.resolve().then(() => {
      cjFulfillOrder(order.id).catch((err) => {
        console.error(`CJ fulfillment failed for order ${order.id}:`, err);
      });
    });
  }

  return { order, created: true, items, emailAddress, orderNumber, orderTotal, paymentIntentId };
}