"use client";

import { useState } from "react";
import {
  AlertBanner,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Textarea,
} from "@/components/admin-ui/primitives";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const EXAMPLES: Record<string, string> = {
  "Create Order V2": JSON.stringify(
    {
      shopLogisticsType: 1,
      storageId: "123",
      orderList: [
        {
          productId: "000B9312-456A-4D31-94BD-B083E2A198E8",
          sku: "CJJJJTJT05843-Black",
          quantity: 1,
          countryCode: "US",
          receiverName: "John Doe",
          receiverPhone: "1234567890",
          receiverAddress: "123 Main St",
          receiverCity: "Los Angeles",
          receiverCountry: "US",
          receiverPostalCode: "90001",
        },
      ],
    },
    null,
    2
  ),
  "Create Sandbox Order V2": JSON.stringify(
    {
      isSandbox: 1,
      shopLogisticsType: 1,
      storageId: "123",
      orderList: [
        {
          productId: "000B9312-456A-4D31-94BD-B083E2A198E8",
          sku: "CJJJJTJT05843-Black",
          quantity: 1,
          countryCode: "US",
          receiverName: "John Doe",
          receiverPhone: "1234567890",
          receiverAddress: "123 Main St",
          receiverCity: "Los Angeles",
          receiverCountry: "US",
          receiverPostalCode: "90001",
        },
      ],
    },
    null,
    2
  ),
  "Create Order V3": JSON.stringify(
    {
      logisticName: "DHL",
      orderList: [
        {
          productId: "000B9312-456A-4D31-94BD-B083E2A198E8",
          sku: "CJJJJTJT05843-Black",
          quantity: 1,
          countryCode: "US",
          receiverName: "John Doe",
          receiverPhone: "1234567890",
          receiverAddress: "123 Main St",
          receiverCity: "Los Angeles",
          receiverCountry: "US",
          receiverPostalCode: "90001",
        },
      ],
    },
    null,
    2
  ),
  "Create Sandbox Order V3": JSON.stringify(
    {
      isSandbox: 1,
      logisticName: "DHL",
      orderList: [
        {
          productId: "000B9312-456A-4D31-94BD-B083E2A198E8",
          sku: "CJJJJTJT05843-Black",
          quantity: 1,
          countryCode: "US",
          receiverName: "John Doe",
          receiverPhone: "1234567890",
          receiverAddress: "123 Main St",
          receiverCity: "Los Angeles",
          receiverCountry: "US",
          receiverPostalCode: "90001",
        },
      ],
    },
    null,
    2
  ),
  "Add Cart": JSON.stringify(
    {
      cartItems: [
        {
          productId: "000B9312-456A-4D31-94BD-B083E2A198E8",
          sku: "CJJJJTJT05843-Black",
          quantity: 1,
          countryCode: "US",
        },
      ],
    },
    null,
    2
  ),
  "Confirm Add Cart": JSON.stringify({ cartId: "abc123" }, null, 2),
  "Generate Parent Order": JSON.stringify({ cartId: "abc123" }, null, 2),
  "Pay Balance V2": JSON.stringify({ orderId: "abc123", paymentMethod: "CJ_BALANCE" }, null, 2),
  "Upload Shipping Info": JSON.stringify(
    {
      orderId: "abc123",
      logisticName: "DHL",
      trackingNumber: "TRACK12345",
      logisticsCompany: "DHL",
    },
    null,
    2
  ),
  "Update Shipping Info": JSON.stringify(
    {
      orderId: "abc123",
      logisticName: "DHL",
      trackingNumber: "TRACK12345",
      logisticsCompany: "DHL",
    },
    null,
    2
  ),
};

// __PART2__
export default function AdminCJOrderSync() {
  const [pid, setPid] = useState("");
  const [orderId, setOrderId] = useState("");
  const [jsonBody, setJsonBody] = useState("{}");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExample = (example: string) => {
    setJsonBody(EXAMPLES[example] ?? "{}");
    setError(null);
    setResponse(null);
  };

  const handlePost = async (path: string, body: unknown) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`/api/admin/cj/order/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "CJ request failed.");
      }
      setResponse(prettyJson(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async (path: string, query: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = new URL(`/api/admin/cj/order/${path}`, window.location.href);
      url.searchParams.set(query.split("=")[0], query.split("=")[1] ?? "");
      const res = await fetch(url.toString());
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "CJ request failed.");
      }
      setResponse(prettyJson(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    if (!pid.trim()) {
      setError("Please provide a product pid.");
      return;
    }
    await handleGet("inventory-by-pid", `pid=${encodeURIComponent(pid.trim())}`);
  };

  const fetchOrder = async () => {
    if (!orderId.trim()) {
      setError("Please provide an order ID.");
      return;
    }
    await handleGet("query-order", `orderId=${encodeURIComponent(orderId.trim())}`);
  };

  const fetchTracking = async () => {
    if (!orderId.trim()) {
      setError("Please provide an order ID.");
      return;
    }
    await handleGet("tracking", `orderId=${encodeURIComponent(orderId.trim())}`);
  };

  const postJson = (path: string, label: string) => async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError(`Invalid JSON body for ${label}.`);
      return;
    }
    await handlePost(path, body);
  };

  const flowActions: { label: string; run: () => void }[] = [
    { label: "Create Order V2", run: postJson("create-v2", "Create Order V2") },
    { label: "Create Order V3", run: postJson("create-v3", "Create Order V3") },
    { label: "Add Orders to Cart", run: postJson("add-cart", "Add Cart") },
    { label: "Confirm Add Cart", run: postJson("confirm-cart", "Confirm Add Cart") },
    { label: "Generate Parent Order", run: postJson("save-generate-parent-order", "Save/Generate Parent Order") },
    { label: "Pay Balance V2", run: postJson("pay-balance-v2", "Pay Balance V2") },
    { label: "Upload Shipping Info", run: postJson("upload-shipping-info", "Upload Shipping Info") },
    { label: "Update Shipping Info", run: postJson("update-shipping-info", "Update Shipping Info") },
  ];

  // __PART3__
  return (
    <Card>
      <CardHeader title="CJ Order Sync" />
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Inventory / order lookup */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Inventory / order lookup</h3>

          <Field label="Product PID">
            <Input
              value={pid}
              onChange={setPid}
              placeholder="Enter CJ product pid"
            />
          </Field>
          <Button type="button" variant="secondary" onClick={fetchInventory} disabled={loading || !pid.trim()}>
            {loading ? "Loading…" : "Query Inventory by PID"}
          </Button>

          <Field label="Order ID">
            <Input
              value={orderId}
              onChange={setOrderId}
              placeholder="Enter CJ order ID"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={fetchOrder} disabled={loading || !orderId.trim()}>
              Query Order
            </Button>
            <Button type="button" variant="secondary" onClick={fetchTracking} disabled={loading || !orderId.trim()}>
              Query Tracking
            </Button>
          </div>
        </section>

        {/* Order flow actions */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Order flow actions</h3>

          <Field label="JSON body">
            <Textarea
              value={jsonBody}
              onChange={setJsonBody}
              rows={12}
              className="font-mono text-xs"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {Object.keys(EXAMPLES).map((example) => (
              <Button key={example} type="button" variant="ghost" size="sm" onClick={() => loadExample(example)}>
                {example}
              </Button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {flowActions.map((action) => (
              <Button key={action.label} type="button" variant="secondary" onClick={action.run} loading={loading}>
                {action.label}
              </Button>
            ))}
          </div>
        </section>
      </div>

      {(error || response) && (
        <div className="border-t border-stone/20 p-5">
          {error && (
            <AlertBanner kind="error" onDismiss={() => setError(null)}>
              {error}
            </AlertBanner>
          )}
          {response && (
            <pre className="max-h-96 overflow-auto rounded-lg bg-ink p-4 font-mono text-xs leading-relaxed text-bone">
              {response}
            </pre>
          )}
        </div>
      )}
    </Card>
  );
}