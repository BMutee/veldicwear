import { prisma } from "@/lib/prisma";
import { cjPost } from "@/lib/cj";

/**
 * Determine if a product ID looks like a CJ product ID.
 * CJ product IDs are typically numeric strings.
 */
function isCjProductId(productId: string): boolean {
  return /^\d+$/.test(productId);
}

/**
 * Try to add items to the CJ shopping cart and confirm it.
 * Returns the cart reference on success, or throws on failure.
 */
async function cjAddToCartAndConfirm(
  items: Array<{
    pid: string;
    vid: string;
    quantity: number;
  }>,
  shipping: {
    country: string;
    city: string;
    address: string;
    postalCode: string;
    phone: string;
    firstName: string;
    lastName: string;
  }
): Promise<string> {
  // Step 1: Add each item to CJ cart
  for (const item of items) {
    await cjPost("shopping/add-cart", {
      pid: item.pid,
      vid: item.vid,
      productQuantity: item.quantity,
      shippingCountryCode: shipping.country,
      shippingCity: shipping.city,
      shippingAddress: shipping.address,
      shippingZip: shipping.postalCode,
      shippingPhone: shipping.phone,
      shippingFirstName: shipping.firstName,
      shippingLastName: shipping.lastName,
    });
  }

  // Step 2: Confirm the cart
  const confirmResult = await cjPost("shopping/add-cart-confirm", {
    shippingCountryCode: shipping.country,
    shippingCity: shipping.city,
    shippingAddress: shipping.address,
    shippingZip: shipping.postalCode,
    shippingPhone: shipping.phone,
    shippingFirstName: shipping.firstName,
    shippingLastName: shipping.lastName,
  });

  // The confirm response should contain a cart/order reference
  const cartReference =
    typeof confirmResult === "string"
      ? confirmResult
      : JSON.stringify(confirmResult);

  return cartReference;
}

/**
 * Fulfill an order by adding its items to the CJ cart and confirming.
 * This is designed to run AFTER the customer has already seen their confirmation page.
 *
 * Steps:
 * 1. Fetch the order with items + product/variant relations
 * 2. For each item, check if the product is CJ-imported
 * 3. Look up the CJ variant ID for the correct size
 * 4. Call CJ add-cart + confirm-cart
 * 5. Store the CJ cart reference and set cjFulfillmentStatus = "ready_to_pay"
 * 6. On failure, set cjFulfillmentStatus = "failed" (does NOT roll back customer payment)
 */
export async function cjFulfillOrder(orderId: string): Promise<void> {
  // Fetch the order with all relations needed
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    console.error(`cjFulfillOrder: Order ${orderId} not found.`);
    return;
  }

  // Skip if already fulfilled or being processed
  if (order.cjFulfillmentStatus === "sent") {
    console.log(
      `cjFulfillOrder: Order ${order.orderNumber} already sent to CJ. Skipping.`
    );
    return;
  }

  // Mark as pending first
  await prisma.order.update({
    where: { id: orderId },
    data: { cjFulfillmentStatus: "pending" },
  });

  try {
    // Build the list of CJ items from order items
    const cjItems: Array<{
      pid: string;
      vid: string;
      quantity: number;
    }> = [];

    for (const item of order.items as Array<{
      id: string;
      name: string;
      size: string;
      color: string | null;
      quantity: number;
      product: {
        id: string;
        variants: Array<{ size: string; color: string | null; cjVariantId: string | null }>;
      };
    }>) {
      const product = item.product;

      // Skip non-CJ products (products not imported from CJ)
      if (!isCjProductId(product.id)) {
        console.log(
          `cjFulfillOrder: Item ${item.name} (product ${product.id}) is not a CJ product. Skipping.`
        );
        continue;
      }

      const pid = product.id;

      // Find the variant matching this item's size (and color when present).
      // When item.color is null (no color data), the `item.color == null` short-circuits
      // to true, so existing orders/products without color match exactly as before.
      // Color-matching is only enforced once color data exists on both sides.
      let vid: string | null = null;
      if (item.size && item.size !== "N/A") {
        const matchingVariant = product.variants.find(
          (v: { size: string; color: string | null; cjVariantId: string | null }) =>
            v.size === item.size &&
            (item.color == null || v.color === item.color) &&
            v.cjVariantId
        );
        vid = matchingVariant?.cjVariantId ?? null;
      }

      // If no size-specific variant, use the base product
      // If a CJ variant ID is required but missing, we can still try with empty vid
      cjItems.push({
        pid,
        vid: vid ?? "",
        quantity: item.quantity,
      });
    }

    if (cjItems.length === 0) {
      // No CJ items at all — this is not a CJ-fulfillable order.
      // Leave cjFulfillmentStatus as null (not applicable) so the admin
      // knows CJ fulfillment is not relevant for this order.
      console.log(
        `cjFulfillOrder: No CJ items found for order ${order.orderNumber}. Clearing CJ status (not a CJ order).`
      );
      // Only clear if it was set to "pending" — don't overwrite a pre-existing status
      if (order.cjFulfillmentStatus === "pending" || !order.cjFulfillmentStatus) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            cjFulfillmentStatus: null,
            cjCartReference: null,
          },
        });
      }
      return;
    }

    // Track which items were sent to CJ vs skipped (non-CJ items need manual handling)
    const cjItemNames = cjItems.map((i) => i.pid).join(",");
    const nonCjItemNames = order.items
      .filter((item: { name: string; product: { id: string } }) => !isCjProductId(item.product.id))
      .map((item: { name: string }) => item.name)
      .join(", ");

    // Call CJ add-cart + confirm-cart
    const cartReference = await cjAddToCartAndConfirm(cjItems, {
      country: order.country,
      city: order.city,
      address: order.address,
      postalCode: order.postalCode,
      phone: order.phone,
      firstName: order.firstName,
      lastName: order.lastName,
    });

    // Store structured cart reference: includes which items were sent to CJ
    // and which items need separate manual handling
    const structuredReference = JSON.stringify({
      cartRef: cartReference,
      cjItemCount: cjItems.length,
      cjPids: cjItems.map((i) => i.pid),
      nonCjItemNames: nonCjItemNames || null,
    });

    // Store the cart reference and mark as ready_to_pay
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "ready_to_pay",
        cjCartReference: structuredReference,
      },
    });

    console.log(
      `cjFulfillOrder: Order ${order.orderNumber} sent to CJ cart. Status: ready_to_pay` +
        (nonCjItemNames ? ` | Non-CJ items need manual handling: ${nonCjItemNames}` : "")
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown CJ fulfillment error";

    console.error(
      `cjFulfillOrder: Failed for order ${order.orderNumber}: ${errorMessage}`
    );

    // Mark as failed — customer payment is NOT rolled back
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "failed",
        cjCartReference: `error: ${errorMessage}`,
      },
    });
  }
}

/**
 * Complete CJ payment for an order that is in "ready_to_pay" status.
 * This is an admin-triggered action (manual payment step).
 *
 * Calls pay-balance-v2 to finalize the CJ order.
 */
export async function cjCompletePayment(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found.`);
  }

  if (order.cjFulfillmentStatus !== "ready_to_pay") {
    throw new Error(
      `Order ${order.orderNumber} is not in "ready_to_pay" status (current: ${order.cjFulfillmentStatus}). Cannot complete payment.`
    );
  }

  try {
    // Call CJ pay-balance-v2 to finalize the order
    // The payload needs the cart reference and shipping info
    const payResult = await cjPost("shopping/pay-balance-v2", {
      shippingCountryCode: order.country,
      shippingCity: order.city,
      shippingAddress: order.address,
      shippingZip: order.postalCode,
      shippingPhone: order.phone,
      shippingFirstName: order.firstName,
      shippingLastName: order.lastName,
    });

    // The response should contain the CJ order ID
    const cjOrderId =
      typeof payResult === "object" && payResult !== null
        ? (payResult as Record<string, unknown>).orderId ??
          (payResult as Record<string, unknown>).order_id ??
          JSON.stringify(payResult)
        : String(payResult);

    // Mark as sent to supplier
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "sent",
        cjOrderId: String(cjOrderId),
      },
    });

    console.log(
      `cjCompletePayment: Order ${order.orderNumber} paid successfully. CJ Order ID: ${cjOrderId}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown CJ payment error";

    console.error(
      `cjCompletePayment: Failed for order ${order.orderNumber}: ${errorMessage}`
    );

    // Set to failed — customer payment is NOT rolled back
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "failed",
        cjCartReference: `payment_error: ${errorMessage}`,
      },
    });

    throw new Error(`CJ payment failed: ${errorMessage}`);
  }
}