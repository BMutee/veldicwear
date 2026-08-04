"use client";

import { useState } from "react";

type WarehouseDetail = {
  id: string;
  name: string;
  areaId: number;
  areaCountryCode: string;
  address1: string;
  address2?: string | null;
  contacts?: string | null;
  phone?: string | null;
  city: string;
  province: string;
  logisticsBrandList: Array<{ id: string; name: string }>;
  isSelfPickup?: number | null;
  zipCode?: string | null;
};

type PrivateInventoryItem = {
  productId: string;
  productName: string;
  spu: string;
  productPic?: string;
  productType?: string;
  skuQuantity?: number;
  totalWarehouseQuantity?: number;
  minStockPrice?: number;
  maxStockPrice?: number;
  warehouseQuantityInfoList?: Array<{
    countryCode: string;
    warehouseQuantity: number;
    clientTransitQuantity: number;
  }>;
};

type CJCategory = {
  categoryFirstName: string;
  categoryFirstList: Array<{
    categorySecondName: string;
    categorySecondList: Array<{
      categoryId: string;
      categoryName: string;
    }>;
  }>;
};

type CJGlobalWarehouse = {
  areaCn: string;
  areaEn: string;
  areaId: number;
  countryCode: string;
  nameEn: string;
  valueEn: string;
  disabled: boolean;
  zh: string;
  en: string;
  de: string;
  fr: string;
  th: string;
  id: string;
};

export default function AdminCJInventory() {
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [inventoryKeyword, setInventoryKeyword] = useState("");
  const [inventoryResults, setInventoryResults] = useState<PrivateInventoryItem[]>([]);
  const [categories, setCategories] = useState<CJCategory[]>([]);
  const [globalWarehouses, setGlobalWarehouses] = useState<CJGlobalWarehouse[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingGlobalWarehouses, setLoadingGlobalWarehouses] = useState(false);

  const fetchWarehouse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingWarehouse(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/cj/warehouse?id=${encodeURIComponent(warehouseId)}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to fetch warehouse info.");
      }

      const data = await response.json();
      setWarehouse(data.data ?? data);
      setMessage("Warehouse loaded successfully.");
    } catch (error) {
      setWarehouse(null);
      setMessage(error instanceof Error ? error.message : "Warehouse lookup failed.");
    } finally {
      setLoadingWarehouse(false);
    }
  };

  const searchInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingInventory(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/private-inventory/spu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNum: 1,
          pageSize: 20,
          keyword: inventoryKeyword,
          availableStock: true,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to search private inventory.");
      }

      const data = await response.json();
      setInventoryResults(data.data.content ?? []);
      setMessage(`Found ${data.data.content.length} private inventory item(s).`);
    } catch (error) {
      setInventoryResults([]);
      setMessage(error instanceof Error ? error.message : "Private inventory search failed.");
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/categories");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to load categories.");
      }

      const data = await response.json();
      setCategories(data ?? []);
      setMessage(`Loaded ${data.length} category group(s).`);
    } catch (error) {
      setCategories([]);
      setMessage(error instanceof Error ? error.message : "Category load failed.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchGlobalWarehouses = async () => {
    setLoadingGlobalWarehouses(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/cj/global-warehouses");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to load global warehouses.");
      }

      const data = await response.json();
      setGlobalWarehouses(data ?? []);
      setMessage(`Loaded ${data.length} global warehouse(s).`);
    } catch (error) {
      setGlobalWarehouses([]);
      setMessage(error instanceof Error ? error.message : "Global warehouses load failed.");
    } finally {
      setLoadingGlobalWarehouses(false);
    }
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">CJ Warehouse & Private Inventory</h2>
      <p className="mt-3 text-black/70">
        Use CJ storage info and private inventory endpoints to inspect warehouse details and stock.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">Warehouse Info</h3>
          <form onSubmit={fetchWarehouse} className="mt-4 flex flex-col gap-3">
            <input
              value={warehouseId}
              onChange={(event) => setWarehouseId(event.target.value)}
              placeholder="Warehouse ID"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none"
            />
            <button
              type="submit"
              disabled={loadingWarehouse || !warehouseId.trim()}
              className="rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingWarehouse ? "Loading…" : "Load Warehouse"}
            </button>
          </form>

          {warehouse && (
            <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm text-black/80">
              <p><strong>Name:</strong> {warehouse.name}</p>
              <p><strong>Country:</strong> {warehouse.areaCountryCode}</p>
              <p><strong>Location:</strong> {warehouse.city}, {warehouse.province}</p>
              <p><strong>Address:</strong> {warehouse.address1}{warehouse.address2 ? `, ${warehouse.address2}` : ""}</p>
              <p><strong>Phone:</strong> {warehouse.phone ?? "N/A"}</p>
              <p><strong>Pickup:</strong> {warehouse.isSelfPickup === 1 ? "Yes" : "No"}</p>
              <div>
                <strong>Logistics Brands:</strong>
                <ul className="list-disc pl-5">
                  {warehouse.logisticsBrandList.map((brand) => (
                    <li key={brand.id}>{brand.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">Private Inventory Search</h3>
          <form onSubmit={searchInventory} className="mt-4 flex flex-col gap-3">
            <input
              value={inventoryKeyword}
              onChange={(event) => setInventoryKeyword(event.target.value)}
              placeholder="Search keyword, SKU, or SPU"
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-black outline-none"
            />
            <button
              type="submit"
              disabled={loadingInventory || !inventoryKeyword.trim()}
              className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingInventory ? "Searching…" : "Search Inventory"}
            </button>
          </form>

          {inventoryResults.length > 0 && (
            <div className="mt-4 space-y-4">
              {inventoryResults.map((item) => (
                <div key={item.productId} className="rounded-2xl bg-white p-4 text-sm text-black/80">
                  <p><strong>{item.productName}</strong></p>
                  <p>SPU: {item.spu}</p>
                  <p>Total Warehouse Quantity: {item.totalWarehouseQuantity ?? 0}</p>
                  <p>Price Range: ${item.minStockPrice?.toFixed(2) ?? "0.00"} - ${item.maxStockPrice?.toFixed(2) ?? "0.00"}</p>
                  {item.warehouseQuantityInfoList?.length ? (
                    <div className="mt-2">
                      <strong>Warehouse breakdown:</strong>
                      <ul className="list-disc pl-5">
                        {item.warehouseQuantityInfoList.map((warehouseInfo) => (
                          <li key={warehouseInfo.countryCode}>
                            {warehouseInfo.countryCode}: {warehouseInfo.warehouseQuantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">CJ Product Categories</h3>
          <p className="mt-2 text-black/70">Load CJ category groups and inspect third-level category IDs for product search filters.</p>
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loadingCategories}
            className="mt-4 rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCategories ? "Loading…" : "Load Categories"}
          </button>

          {categories.length > 0 && (
            <div className="mt-4 space-y-4 rounded-2xl bg-white p-4 text-sm text-black/80">
              {categories.map((firstCategory) => (
                <div key={firstCategory.categoryFirstName}>
                  <p className="font-semibold">{firstCategory.categoryFirstName}</p>
                  {firstCategory.categoryFirstList.map((secondCategory) => (
                    <div key={secondCategory.categorySecondName} className="mt-2 pl-4">
                      <p className="font-medium">{secondCategory.categorySecondName}</p>
                      <ul className="list-disc pl-5">
                        {secondCategory.categorySecondList.map((thirdCategory) => (
                          <li key={thirdCategory.categoryId}>
                            {thirdCategory.categoryName} ({thirdCategory.categoryId})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/10 bg-slate-100 p-4">
          <h3 className="text-lg font-semibold">Global Warehouses</h3>
          <p className="mt-2 text-black/70">Query CJ global warehouses to find available fulfillment locations and country codes.</p>
          <button
            type="button"
            onClick={fetchGlobalWarehouses}
            disabled={loadingGlobalWarehouses}
            className="mt-4 rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingGlobalWarehouses ? "Loading…" : "Load Warehouses"}
          </button>

          {globalWarehouses.length > 0 && (
            <div className="mt-4 space-y-4 rounded-2xl bg-white p-4 text-sm text-black/80">
              <ul className="space-y-3">
                {globalWarehouses.map((warehouse) => (
                  <li key={warehouse.id} className="rounded-2xl border border-black/10 p-3">
                    <p className="font-semibold">{warehouse.nameEn} ({warehouse.countryCode})</p>
                    <p>Area: {warehouse.areaEn}</p>
                    <p>Warehouse ID: {warehouse.areaId}</p>
                    <p>Disabled: {warehouse.disabled ? "Yes" : "No"}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {message && <p className="mt-6 text-sm text-black/70">{message}</p>}
    </div>
  );
}
