"use client";

import { useState } from "react";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminCJOrderSync() {
  const [pid, setPid] = useState("");
  const [orderId, setOrderId] = useState("");
  const [jsonBody, setJsonBody] = useState("{}");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examples: Record<string, string> = {
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
    "Confirm Add Cart": JSON.stringify(
      {
        cartId: "abc123",
      },
      null,
      2
    ),
    "Generate Parent Order": JSON.stringify(
      {
        cartId: "abc123",
      },
      null,
      2
    ),
    "Pay Balance V2": JSON.stringify(
      {
        orderId: "abc123",
        paymentMethod: "CJ_BALANCE",
      },
      null,
      2
    ),
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

  const loadExample = (example: string) => {
    setJsonBody(examples[example] ?? "{}");
    setError(null);
    setResponse(null);
  };

  const handlePost = async (path: string, body: unknown) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`/api/admin/cj/order/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json();
      if (!response.ok) {
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

  const handleCreateV2 = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Create Order V2.");
      return;
    }
    await handlePost("create-v2", body);
  };

  const handleCreateV3 = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Create Order V3.");
      return;
    }
    await handlePost("create-v3", body);
  };

  const handleAddCart = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Add Cart.");
      return;
    }
    await handlePost("add-cart", body);
  };

  const handleConfirmCart = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Confirm Add Cart.");
      return;
    }
    await handlePost("confirm-cart", body);
  };

  const handleParentOrder = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Save/Generate Parent Order.");
      return;
    }
    await handlePost("save-generate-parent-order", body);
  };

  const handlePayBalance = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Pay Balance V2.");
      return;
    }
    await handlePost("pay-balance-v2", body);
  };

  const handleUploadShippingInfo = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Upload Shipping Info.");
      return;
    }
    await handlePost("upload-shipping-info", body);
  };

  const handleUpdateShippingInfo = async () => {
    let body: JsonValue;
    try {
      body = JSON.parse(jsonBody);
    } catch {
      setError("Invalid JSON body for Update Shipping Info.");
      return;
    }
    await handlePost("update-shipping-info", body);
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">CJ Order Sync</h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">Inventory / Order Lookup</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm text-black/70">
                Product PID
                <span className="ml-2 text-xs text-black/50">(param: <code>pid</code>)</span>
                <input
                  value={pid}
                  onChange={(event) => setPid(event.target.value)}
                  placeholder="Enter CJ product pid"
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none"
                />
              </label>
              <button
                type="button"
                onClick={fetchInventory}
                disabled={loading}
                className="mt-3 rounded-full bg-yellow-400 px-5 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading…" : "Query Inventory by PID"}
              </button>
            </div>

            <div>
              <label className="block text-sm text-black/70">
                Order ID
                <span className="ml-2 text-xs text-black/50">(param: <code>orderId</code>)</span>
                <input
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="Enter CJ order ID"
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none"
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={fetchOrder}
                  disabled={loading}
                  className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Loading…" : "Query Order"}
                </button>
                <button
                  type="button"
                  onClick={fetchTracking}
                  disabled={loading}
                  className="rounded-full bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Loading…" : "Query Tracking"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">Order Flow Actions</h3>
          <textarea
            value={jsonBody}
            onChange={(event) => setJsonBody(event.target.value)}
            rows={12}
            className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none"
          />
          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.keys(examples).map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => loadExample(example)}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-300"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleCreateV2}
                disabled={loading}
                className="rounded-full bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Order V2
              </button>
              <button
                type="button"
                onClick={handleCreateV3}
                disabled={loading}
                className="rounded-full bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Order V3
              </button>
              <button
                type="button"
                onClick={handleAddCart}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Orders to Cart
              </button>
              <button
                type="button"
                onClick={handleConfirmCart}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Add Cart
              </button>
              <button
                type="button"
                onClick={handleParentOrder}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate Parent Order
              </button>
              <button
                type="button"
                onClick={handlePayBalance}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pay Balance V2
              </button>
              <button
                type="button"
                onClick={handleUploadShippingInfo}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Shipping Info
              </button>
              <button
                type="button"
                onClick={handleUpdateShippingInfo}
                disabled={loading}
                className="rounded-full bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update Shipping Info
              </button>
            </div>
          </div>
        </section>
      </div>

      {(error || response) && (
        <div className="mt-6 rounded-3xl border border-black/10 bg-slate-50 p-4 text-sm text-black/80">
          {error ? (
            <div className="text-clay">Error: {error}</div>
          ) : (
            <pre className="whitespace-pre-wrap break-words">{response}</pre>
          )}
        </div>
      )}
    </div>
  );
}
