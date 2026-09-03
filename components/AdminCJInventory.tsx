"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Input,
} from "@/components/admin-ui/primitives";
import { useToast } from "@/components/admin-ui/toast";

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
  id: string;
};

export default function AdminCJInventory() {
  const { toast } = useToast();
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [inventoryKeyword, setInventoryKeyword] = useState("");
  const [inventoryResults, setInventoryResults] = useState<PrivateInventoryItem[]>([]);
  const [categories, setCategories] = useState<CJCategory[]>([]);
  const [globalWarehouses, setGlobalWarehouses] = useState<CJGlobalWarehouse[]>([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingGlobalWarehouses, setLoadingGlobalWarehouses] = useState(false);

  const fetchWarehouse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingWarehouse(true);

    try {
      const response = await fetch(`/api/admin/cj/warehouse?id=${encodeURIComponent(warehouseId)}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to fetch warehouse info.");
      }

      const data = await response.json();
      setWarehouse(data.data ?? data);
      toast("success", "Warehouse loaded successfully.");
    } catch (error) {
      setWarehouse(null);
      toast("error", error instanceof Error ? error.message : "Warehouse lookup failed.");
    } finally {
      setLoadingWarehouse(false);
    }
  };

  const searchInventory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingInventory(true);

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
      toast("success", `Found ${data.data.content.length} private inventory item(s).`);
    } catch (error) {
      setInventoryResults([]);
      toast("error", error instanceof Error ? error.message : "Private inventory search failed.");
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);

    try {
      const response = await fetch("/api/admin/cj/categories");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to load categories.");
      }

      const data = await response.json();
      setCategories(data ?? []);
      toast("success", `Loaded ${data.length} category group(s).`);
    } catch (error) {
      setCategories([]);
      toast("error", error instanceof Error ? error.message : "Category load failed.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchGlobalWarehouses = async () => {
    setLoadingGlobalWarehouses(true);

    try {
      const response = await fetch("/api/admin/cj/global-warehouses");
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Unable to load global warehouses.");
      }

      const data = await response.json();
      setGlobalWarehouses(data ?? []);
      toast("success", `Loaded ${data.length} global warehouse(s).`);
    } catch (error) {
      setGlobalWarehouses([]);
      toast("error", error instanceof Error ? error.message : "Global warehouses load failed.");
    } finally {
      setLoadingGlobalWarehouses(false);
    }
  };

  // __PART2__
  return (
    <Card>
      <CardHeader title="CJ Warehouse & Private Inventory" />
      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Warehouse info */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Warehouse info</h3>
          <form onSubmit={fetchWarehouse} className="flex items-end gap-2">
            <Input
              value={warehouseId}
              onChange={setWarehouseId}
              placeholder="Warehouse ID"
              ariaLabel="Warehouse ID"
            />
            <Button type="submit" variant="secondary" loading={loadingWarehouse} disabled={!warehouseId.trim()}>
              Load
            </Button>
          </form>

          {warehouse && (
            <div className="space-y-1.5 rounded-lg border border-stone/20 bg-bone/60 p-4 text-sm text-stone">
              <p><strong className="text-ink">Name:</strong> {warehouse.name}</p>
              <p><strong className="text-ink">Country:</strong> {warehouse.areaCountryCode}</p>
              <p><strong className="text-ink">Location:</strong> {warehouse.city}, {warehouse.province}</p>
              <p><strong className="text-ink">Address:</strong> {warehouse.address1}{warehouse.address2 ? `, ${warehouse.address2}` : ""}</p>
              <p><strong className="text-ink">Phone:</strong> {warehouse.phone ?? "N/A"}</p>
              <p><strong className="text-ink">Pickup:</strong> {warehouse.isSelfPickup === 1 ? "Yes" : "No"}</p>
              <div>
                <strong className="text-ink">Logistics brands:</strong>
                <ul className="mt-1 list-disc pl-5">
                  {warehouse.logisticsBrandList.map((brand) => (
                    <li key={brand.id}>{brand.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Private inventory search */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Private inventory search</h3>
          <form onSubmit={searchInventory} className="flex items-end gap-2">
            <Input
              value={inventoryKeyword}
              onChange={setInventoryKeyword}
              placeholder="Keyword, SKU, or SPU"
              ariaLabel="Inventory keyword"
            />
            <Button type="submit" variant="secondary" loading={loadingInventory} disabled={!inventoryKeyword.trim()}>
              Search
            </Button>
          </form>

          {inventoryResults.length > 0 && (
            <div className="space-y-3">
              {inventoryResults.map((item) => (
                <div key={item.productId} className="rounded-lg border border-stone/20 p-4 text-sm text-stone">
                  <p className="font-semibold text-ink">{item.productName}</p>
                  <p>SPU: {item.spu}</p>
                  <p>Total warehouse quantity: {item.totalWarehouseQuantity ?? 0}</p>
                  <p>
                    Price range: ${item.minStockPrice?.toFixed(2) ?? "0.00"} – ${item.maxStockPrice?.toFixed(2) ?? "0.00"}
                  </p>
                  {item.warehouseQuantityInfoList?.length ? (
                    <div className="mt-2">
                      <strong className="text-ink">Warehouse breakdown:</strong>
                      <ul className="mt-1 list-disc pl-5">
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

        {/* Categories */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">CJ product categories</h3>
          <Button type="button" variant="secondary" onClick={fetchCategories} loading={loadingCategories}>
            Load Categories
          </Button>

          {categories.length > 0 && (
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-stone/20 p-4 text-sm text-stone">
              {categories.map((firstCategory) => (
                <div key={firstCategory.categoryFirstName}>
                  <p className="font-semibold text-ink">{firstCategory.categoryFirstName}</p>
                  {firstCategory.categoryFirstList.map((secondCategory) => (
                    <div key={secondCategory.categorySecondName} className="mt-1.5 pl-4">
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

        {/* Global warehouses */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone">Global warehouses</h3>
          <Button type="button" variant="secondary" onClick={fetchGlobalWarehouses} loading={loadingGlobalWarehouses}>
            Load Warehouses
          </Button>

          {globalWarehouses.length > 0 && (
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-stone/20 p-4 text-sm text-stone">
              <ul className="space-y-2">
                {globalWarehouses.map((warehouseItem) => (
                  <li key={warehouseItem.id} className="rounded-lg border border-stone/15 p-3">
                    <p className="font-semibold text-ink">
                      {warehouseItem.nameEn} ({warehouseItem.countryCode})
                    </p>
                    <p>Area: {warehouseItem.areaEn}</p>
                    <p>Warehouse ID: {warehouseItem.areaId}</p>
                    <p>Disabled: {warehouseItem.disabled ? "Yes" : "No"}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}