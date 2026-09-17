import { prisma } from "@/lib/prisma";
import { cjPost } from "@/lib/cj";
import { toIso2CountryCode } from "@/lib/country-codes";

/**
 * CJ Dropshipping order pipeline.
 *
 * The order reaches "CJ → Orders" through five sequential API calls. This is
 * the flow CJ's API v2 documents — and the only one that works. The previous
 * implementation called `shopping/add-cart`, `shopping/add-cart-confirm` and
 * `shopping/pay-balance-v2`, none of which exist; CJ answered every one with
 * `1600101 Interface not found`, so no order ever reached CJ.
 *
 *   1. logistic/freightCalculate              -> shipping channels + cost
 *   2. shopping/order/createOrderV3           -> creates the CJ order (unpaid)
 *   3. shopping/order/addCart                 -> puts that order in the CJ cart
 *   4. shopping/order/addCartConfirm          -> confirms -> returns shipmentsId
 *   5. shopping/order/saveGenerateParentOrder -> returns payId + amount due
 *
 * Payment (step 6, `shopping/pay/payBalanceV2`) is admin-triggered because it
 * deducts real money from the CJ account balance.
 */

/** CJ ships from its own warehouse; this is the origin for freight quotes. */
const CJ_ORIGIN_COUNTRY_CODE = "CN";

/**
 * Determine if a product ID looks like a CJ product ID.
 * CJ product IDs are numeric strings.
 */
function isCjProductId(productId: string): boolean {
  return /^\d+$/.test(productId);
}

/**
 * Normalise an OrderItem.size into a bare size label.
 *
 * Orders created before the checkout's size/colour parsing was fixed stored a
 * compound value like "S, Color: Black Zone2" (or "Size: S"). Variants are
 * stored with a bare size, so strip the decoration before matching — otherwise
 * historical orders can never be matched back to a CJ variant id.
 */
function normaliseItemSize(size: string): string {
  return size
    .replace(/^\s*Size:\s*/i, "")
    .split(/,/)
    .map((part) => part.trim())
    .filter((part) => part && !/^Color:/i.test(part))[0] ?? size.trim();
}

type CJFreightRate = {
  logisticName?: string;
  logisticPrice?: number | string;
  logisticAging?: string;
};

type CJInterceptReason = { simpleTip?: string; completeTip?: string };

type CJAddCartResult = {
  successCount?: number;
  addSuccessOrders?: string[];
  interceptOrders?: Array<{ orderCode?: string; interceptReason?: CJInterceptReason[] }>;
};

type CJConfirmCartResult = {
  shipmentsId?: string;
  successCount?: number;
  interceptOrders?: Array<{ interceptReason?: CJInterceptReason[] }>;
};

type CJCreateOrderResult = {
  orderId?: string;
  orderNumber?: string;
  postageAmount?: number;
  productAmount?: number;
  logisticsMiss?: boolean;
};

type CJParentOrderResult = {
  payId?: string;
  orderMoney?: number;
  payExpireTime?: string;
};

/** What we persist in Order.cjCartReference after a successful send-to-CJ. */
export type CJShipmentReference = {
  orderNumber: string | null;
  shipmentsId: string;
  payId: string | null;
  logisticName: string;
  shippingCost: number;
  shippingDays: string | null;
  orderMoney: number | null;
  payExpireTime: string | null;
  cjItemCount: number;
  cjPids: string[];
  nonCjItemNames: string | null;
};

/** Read Order.cjCartReference safely — legacy/plain strings return null. */
export function parseCJShipmentReference(raw: string | null): CJShipmentReference | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CJShipmentReference>;
    if (!parsed || typeof parsed !== "object" || !parsed.shipmentsId) return null;
    return parsed as CJShipmentReference;
  } catch {
    return null;
  }
}

type CJOrderAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO-2, resolved from the free-text country the customer typed. */
  countryCode: string;
  /** Human-readable country name — CJ validates this separately. */
  countryName: string;
  city: string;
  address: string;
  postalCode: string;
};

/** Flatten CJ's "intercept" payloads into a readable, de-duplicated string. */
function summariseIntercepts(
  orders: Array<{ interceptReason?: CJInterceptReason[] }> | undefined,
): string {
  const tips = (orders ?? [])
    .flatMap((order) => order.interceptReason ?? [])
    .map((reason) => reason.simpleTip ?? reason.completeTip)
    .filter((tip): tip is string => Boolean(tip));
  return [...new Set(tips)].join("; ");
}

/**
 * Step 1 — ask CJ which shipping channels can deliver these items, and pick the
 * cheapest. The customer pays flat/free shipping at checkout, so CJ's postage
 * is a cost of goods and cheapest keeps the margin predictable.
 */
async function cjPickShippingMethod(
  items: Array<{ vid: string; quantity: number }>,
  endCountryCode: string,
): Promise<CJFreightRate & { logisticName: string }> {
  const response = await cjPost<CJFreightRate[]>("logistic/freightCalculate", {
    startCountryCode: CJ_ORIGIN_COUNTRY_CODE,
    endCountryCode,
    products: items.map((item) => ({ vid: item.vid, quantity: item.quantity })),
  });

  const rates = (Array.isArray(response.data) ? response.data : []).filter(
    (rate): rate is CJFreightRate & { logisticName: string } =>
      typeof rate?.logisticName === "string" && rate.logisticName.trim() !== "",
  );

  if (rates.length === 0) {
    throw new Error(
      `CJ offers no shipping method for ${endCountryCode}. Check the destination address and that the items are in stock.`,
    );
  }

  return [...rates].sort(
    (a, b) => Number(a.logisticPrice ?? 0) - Number(b.logisticPrice ?? 0),
  )[0];
}

/** Step 2 — create the order inside the CJ account (unpaid). */
async function cjCreateOrder(
  items: Array<{ vid: string; quantity: number; storeLineItemId: string }>,
  address: CJOrderAddress,
  logisticName: string,
): Promise<{ orderId: string; orderNumber: string | null; shippingCost: number }> {
  const response = await cjPost<CJCreateOrderResult>("shopping/order/createOrderV3", {
    shippingCountryCode: address.countryCode,
    shippingCountry: address.countryName,
    shippingCity: address.city,
    shippingAddress: address.address,
    shippingZip: address.postalCode,
    shippingPhone: address.phone,
    shippingCustomerName: `${address.firstName} ${address.lastName}`.trim(),
    email: address.email,
    fromCountryCode: CJ_ORIGIN_COUNTRY_CODE,
    logisticName,
    platform: "api",
    orderFlow: 1,
    products: items.map((item) => ({
      vid: item.vid,
      quantity: item.quantity,
      storeLineItemId: item.storeLineItemId,
    })),
  });

  const orderId = response.data?.orderId;
  if (!orderId) {
    throw new Error(
      `CJ did not return an order id: ${JSON.stringify(response.data ?? {}).slice(0, 300)}`,
    );
  }

  return {
    orderId,
    orderNumber: response.data?.orderNumber ?? null,
    shippingCost: Number(response.data?.postageAmount ?? 0),
  };
}

/** Step 3 — place the newly created CJ order into the CJ cart. */
async function cjAddOrderToCart(orderId: string): Promise<void> {
  const response = await cjPost<CJAddCartResult>("shopping/order/addCart", {
    cjOrderIdList: [orderId],
  });

  if ((response.data?.successCount ?? 0) > 0) return;

  // CJ "intercepts" orders it can't accept (bad address, stale price, missing
  // shipping method). Surface the reasons instead of silently continuing.
  const reasons = summariseIntercepts(response.data?.interceptOrders);
  throw new Error(
    reasons
      ? `CJ rejected the order: ${reasons}`
      : `CJ rejected the order (no reason given): ${JSON.stringify(response.data ?? {}).slice(0, 300)}`,
  );
}

/** Step 4 — confirm the cart; CJ returns the shipment order id. */
async function cjConfirmCart(orderId: string): Promise<string> {
  const response = await cjPost<CJConfirmCartResult>("shopping/order/addCartConfirm", {
    cjOrderIdList: [orderId],
  });

  const shipmentsId = response.data?.shipmentsId;
  if (shipmentsId) return shipmentsId;

  const reasons = summariseIntercepts(response.data?.interceptOrders);
  throw new Error(
    reasons
      ? `CJ could not confirm the cart: ${reasons}`
      : `CJ did not return a shipment id: ${JSON.stringify(response.data ?? {}).slice(0, 300)}`,
  );
}

/** Step 5 — generate the parent order; CJ returns the payId + amount due. */
async function cjGenerateParentOrder(shipmentsId: string): Promise<CJParentOrderResult> {
  const response = await cjPost<CJParentOrderResult>(
    "shopping/order/saveGenerateParentOrder",
    { shipmentOrderId: shipmentsId },
  );

  if (!response.data?.payId) {
    throw new Error(
      `CJ did not return a pay id for shipment ${shipmentsId}: ${JSON.stringify(response.data ?? {}).slice(0, 300)}`,
    );
  }

  return response.data;
}

/**
 * Fulfill an order by sending it to CJ. Runs AFTER the customer has already
 * seen their confirmation page, so a failure never rolls back their payment.
 *
 * Steps:
 * 1. Fetch the order with items + product/variant relations
 * 2. For each item, check if the product is CJ-imported
 * 3. Look up the CJ variant id for the correct size/colour
 * 4. Pick a shipping method, create the CJ order, cart + confirm it, and
 *    generate the parent order (see the module docblock for the full pipeline)
 * 5. Store the shipment reference and set cjFulfillmentStatus = "ready_to_pay"
 * 6. On failure, set cjFulfillmentStatus = "failed" (does NOT roll back payment)
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
    const cjItems: Array<{ pid: string; vid: string; quantity: number }> = [];
    const missingVariantItems: string[] = [];

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

      // Find the variant matching this item's size (and colour when present).
      // When item.color is null (no colour data), the `item.color == null`
      // short-circuits to true, so products without colour match as before.
      // normaliseItemSize() also rescues pre-fix orders whose size field holds
      // a compound value like "S, Color: Black Zone2".
      const itemSize = normaliseItemSize(item.size);
      let vid: string | null = null;
      if (itemSize && itemSize !== "N/A") {
        const matchingVariant = product.variants.find(
          (v) =>
            v.size === itemSize &&
            (item.color == null || v.color === item.color) &&
            v.cjVariantId
        );
        vid = matchingVariant?.cjVariantId ?? null;

        // Size-only fallback: an order may not carry a colour (or a legacy
        // colour that no longer matches), yet the size variant still exists.
        if (!vid) {
          const sizeOnlyVariant = product.variants.find(
            (v) => v.size === itemSize && v.cjVariantId
          );
          vid = sizeOnlyVariant?.cjVariantId ?? null;
        }
      }

      if (!vid) {
        // CJ needs a real variant id — an empty one produces a generic
        // "Invalid products" error that hides which line item was at fault.
        missingVariantItems.push(
          `${item.name} (size ${itemSize}${item.color ? `, ${item.color}` : ""})`
        );
        continue;
      }

      cjItems.push({ pid: product.id, vid, quantity: item.quantity });
    }

    if (missingVariantItems.length > 0) {
      throw new Error(
        `No CJ variant id found for: ${missingVariantItems.join("; ")}. Re-import the product to sync its variants.`
      );
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
    const nonCjItemNames = order.items
      .filter((item) => !isCjProductId(item.product.id))
      .map((item) => item.name)
      .join(", ");

    // CJ needs an ISO-2 destination code; the checkout collects free text.
    const countryCode = toIso2CountryCode(order.country);
    if (!countryCode) {
      throw new Error(
        `Unsupported destination country "${order.country}". CJ needs a recognised country name or ISO code.`,
      );
    }

    const address: CJOrderAddress = {
      firstName: order.firstName,
      lastName: order.lastName,
      email: order.email,
      phone: order.phone,
      countryCode,
      countryName: order.country.trim(),
      city: order.city,
      address: order.address,
      postalCode: order.postalCode,
    };

    // ── Step 1: choose the shipping method (needs the destination country) ──
    const rate = await cjPickShippingMethod(
      cjItems.map((item) => ({ vid: item.vid, quantity: item.quantity })),
      countryCode,
    );

    // ── Step 2: create the order inside the CJ account ──────────────────────
    const created = await cjCreateOrder(
      cjItems.map((item, index) => ({
        vid: item.vid,
        quantity: item.quantity,
        storeLineItemId: `veldic-${order.id.slice(-12)}-${index + 1}`,
      })),
      address,
      rate.logisticName,
    );

    // ── Steps 3 + 4: cart -> confirm -> shipment id ──────────────────────────
    await cjAddOrderToCart(created.orderId);
    const shipmentsId = await cjConfirmCart(created.orderId);

    // ── Step 5: parent order (pay id + amount due) ───────────────────────────
    const parent = await cjGenerateParentOrder(shipmentsId);

    const reference: CJShipmentReference = {
      orderNumber: created.orderNumber,
      shipmentsId,
      payId: parent.payId ?? null,
      logisticName: rate.logisticName,
      shippingCost: created.shippingCost || Number(rate.logisticPrice ?? 0),
      shippingDays: rate.logisticAging ?? null,
      orderMoney: parent.orderMoney ?? null,
      payExpireTime: parent.payExpireTime ?? null,
      cjItemCount: cjItems.length,
      cjPids: cjItems.map((item) => item.pid),
      nonCjItemNames: nonCjItemNames || null,
    };

    // Store the shipment reference and mark as ready_to_pay
    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "ready_to_pay",
        cjOrderId: created.orderId,
        cjCartReference: JSON.stringify(reference),
      },
    });

    console.log(
      `cjFulfillOrder: Order ${order.orderNumber} created in CJ as ${created.orderId} ` +
        `via ${rate.logisticName}. Status: ready_to_pay` +
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
 * Admin-triggered because it deducts real money from the CJ account balance.
 *
 * Calls shopping/pay/payBalanceV2 with the shipment + pay ids captured during
 * fulfillment.
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

  const reference = parseCJShipmentReference(order.cjCartReference);
  if (!reference?.shipmentsId || !reference.payId) {
    throw new Error(
      `Order ${order.orderNumber} is missing its CJ shipment/pay reference. Retry CJ fulfillment first.`
    );
  }

  try {
    await cjPost<Record<string, unknown>>("shopping/pay/payBalanceV2", {
      shipmentOrderId: reference.shipmentsId,
      payId: reference.payId,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        cjFulfillmentStatus: "sent",
        cjOrderId: order.cjOrderId ?? reference.orderNumber,
      },
    });

    console.log(
      `cjCompletePayment: Order ${order.orderNumber} paid successfully. CJ order: ${order.cjOrderId ?? reference.orderNumber}`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown CJ payment error";

    console.error(
      `cjCompletePayment: Failed for order ${order.orderNumber}: ${errorMessage}`
    );

    // Customer payment is NOT rolled back — the admin can retry.
    throw new Error(`CJ payment failed: ${errorMessage}`);
  }
}