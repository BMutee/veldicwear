"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  Toggle,
} from "@/components/admin-ui/primitives";
import { Modal, ConfirmDialog } from "@/components/admin-ui/Modal";
import { useToast } from "@/components/admin-ui/toast";
import { useCloudinaryUpload } from "@/components/admin-ui/use-cloudinary";
import { DataTable, type Column } from "@/components/admin-ui/DataTable";
import {
  defaultSizeChartForm,
  parseSizesText,
  serializeSizeChart,
  sizeChartToForm,
  type SizeChartForm,
} from "@/lib/size-chart";

type ProductVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  price: number | null;
  costPrice: number | null;
  productId: string;
  cjVariantId: string | null;
};

type ProductImage = {
  id: string;
  color: string | null;
  url: string;
  productId: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string | null;
  barcode: string | null;
  trackInventory: boolean;
  sellOutOfStock: boolean;
  weight: number | null;
  weightUnit: string | null;
  featured: boolean;
  active: boolean;
  createdAt: Date;
  collectionId: string | null;
  sizeChart?: unknown;
  variants: ProductVariant[];
  images: ProductImage[];
};

type VariantEntry = { id: string; size: string; stock: number; price: number | null; costPrice: number | null };
type ImageEntry = { id: string; color: string | null; url: string };

export type ProductForm = {
  name: string;
  description: string;
  image: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  barcode: string;
  trackInventory: boolean;
  sellOutOfStock: boolean;
  weight: number | null;
  weightUnit: string;
  featured: boolean;
  active: boolean;
  variants: VariantEntry[];
  images: ImageEntry[];
  sizeChart: SizeChartForm;
};

export const emptyForm: ProductForm = {
  name: "",
  description: "",
  image: "",
  price: 0,
  compareAtPrice: null,
  sku: "",
  barcode: "",
  trackInventory: true,
  sellOutOfStock: false,
  weight: null,
  weightUnit: "kg",
  featured: false,
  active: true,
  variants: [],
  images: [],
  sizeChart: defaultSizeChartForm(),
};

/** Map a stored product (with relations) onto the editable form shape. */
export function productToForm(product: Product): ProductForm {
  return {
    name: product.name,
    description: product.description,
    image: product.image,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    sku: product.sku || "",
    barcode: product.barcode || "",
    trackInventory: product.trackInventory,
    sellOutOfStock: product.sellOutOfStock,
    weight: product.weight,
    weightUnit: product.weightUnit || "kg",
    featured: product.featured,
    active: product.active,
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      price: v.price,
      costPrice: v.costPrice,
    })),
    images: product.images.map((img) => ({ id: img.id, color: img.color, url: img.url })),
    sizeChart: sizeChartToForm(product.sizeChart),
  };
}

// __PART2__
export default function AdminProductsClient({
  initialProducts,
  editProductId,
}: {
  initialProducts: Product[];
  editProductId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Auto-open edit when navigated with ?edit=<id> (CJ import flow). Derived
  // lazily at mount — no effect needed, so there is no cascading render.
  const initialEdit = useMemo(
    () => (editProductId ? initialProducts.find((p) => p.id === editProductId) ?? null : null),
    [editProductId, initialProducts]
  );

  const [showForm, setShowForm] = useState(Boolean(initialEdit));
  const [editingId, setEditingId] = useState<string | null>(initialEdit?.id ?? null);
  const [form, setForm] = useState<ProductForm>(initialEdit ? productToForm(initialEdit) : emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [variantSize, setVariantSize] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [imgColor, setImgColor] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  // ─── Cloudinary upload handlers ──────────────────────────────────────────────
  const handleMainImageUpload = useCallback(
    (url: string) => setForm((prev) => ({ ...prev, image: url })),
    []
  );
  const openMainImageUpload = useCloudinaryUpload(handleMainImageUpload);

  const handleColorImageUpload = useCallback((url: string) => setImgUrl(url), []);
  const openColorImageUpload = useCloudinaryUpload(handleColorImageUpload);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setForm(productToForm(product));
    setEditingId(product.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const addVariant = () => {
    const size = variantSize.trim();
    if (!size) return;
    const stock = Math.max(0, parseInt(variantStock) || 0);
    const price = Math.max(0, parseFloat(variantPrice) || 0);
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), size, stock, price, costPrice: null }],
    }));
    setVariantSize("");
    setVariantStock("");
    setVariantPrice("");
  };

  const removeVariant = (id: string) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== id) }));
  };

  const addImage = () => {
    const color = imgColor.trim();
    const url = imgUrl.trim();
    if (!color || !url) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { id: crypto.randomUUID(), color, url }],
    }));
    setImgColor("");
    setImgUrl("");
  };

  const removeImage = (id: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== id) }));
  };

  // ─── Size chart (stored as Product.sizeChart, rendered in the product page's
  //     "Size Chart" accordion) ────────────────────────────────────────────────
  const chartSizes = parseSizesText(form.sizeChart.sizesText);

  function setSizeChartField<K extends keyof SizeChartForm>(
    field: K,
    value: SizeChartForm[K],
  ) {
    setForm((prev) => ({
      ...prev,
      sizeChart: { ...prev.sizeChart, [field]: value },
    }));
  }

  function updateChartRow(
    rowIndex: number,
    patch: Partial<SizeChartForm["rows"][number]>,
  ) {
    setForm((prev) => ({
      ...prev,
      sizeChart: {
        ...prev.sizeChart,
        rows: prev.sizeChart.rows.map((row, i) =>
          i === rowIndex ? { ...row, ...patch } : row,
        ),
      },
    }));
  }

  function updateChartValue(rowIndex: number, colIndex: number, value: string) {
    setForm((prev) => ({
      ...prev,
      sizeChart: {
        ...prev.sizeChart,
        rows: prev.sizeChart.rows.map((row, i) =>
          i === rowIndex
            ? {
                ...row,
                values: row.values.map((v, ci) => (ci === colIndex ? value : v)),
              }
            : row,
        ),
      },
    }));
  }

  function addChartRow() {
    setForm((prev) => ({
      ...prev,
      sizeChart: {
        ...prev.sizeChart,
        rows: [
          ...prev.sizeChart.rows,
          {
            label: "",
            callout: String(prev.sizeChart.rows.length + 1),
            values: Array(parseSizesText(prev.sizeChart.sizesText).length).fill(""),
          },
        ],
      },
    }));
  }

  function removeChartRow(rowIndex: number) {
    setForm((prev) => ({
      ...prev,
      sizeChart: {
        ...prev.sizeChart,
        rows: prev.sizeChart.rows.filter((_, i) => i !== rowIndex),
      },
    }));
  }

  // __PART2B__
  // ─── Submit (create / update) ───────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    // Stock is the total of all variant quantities
    const totalStock = form.variants.reduce((sum, v) => sum + v.stock, 0);

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name,
      description: form.description,
      image: form.image,
      price: form.price,
      compareAtPrice: form.compareAtPrice || null,
      stock: totalStock,
      sku: form.sku || null,
      barcode: form.barcode || null,
      trackInventory: form.trackInventory,
      sellOutOfStock: form.sellOutOfStock,
      weight: form.weight || null,
      weightUnit: form.weightUnit || "kg",
      featured: form.featured,
      active: form.active,
      collectionId: null,
      variants: form.variants.map((v) => ({
        size: v.size,
        stock: v.stock,
        price: v.price,
        costPrice: v.costPrice,
      })),
      images: form.images.map((img) => ({
        color: img.color,
        url: img.url,
      })),
      sizeChart: serializeSizeChart(form.sizeChart),
    };

    const endpoint = editingId ? "/api/admin/products/update" : "/api/admin/products/create";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast("error", data.details ? data.details.join(" — ") : data.error || "Failed to save product.");
        setSaving(false);
        return;
      }

      setProducts((current) => {
        if (editingId) {
          return current.map((item) => (item.id === data.id ? data : item));
        }
        return [data, ...current];
      });

      toast("success", editingId ? "Product updated successfully." : "Product created successfully.");
      setSaving(false);
      setTimeout(() => {
        cancelForm();
        router.refresh();
      }, 800);
    } catch {
      toast("error", "Network error. Please try again.");
      setSaving(false);
    }
  };

  // ─── Delete product ─────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/products/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast("error", data.error || "Failed to delete product.");
        setIsDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setProducts((current) => current.filter((p) => p.id !== deleteTarget.id));
      setIsDeleting(false);
      setDeleteTarget(null);
      toast("success", "Product deleted.");
      router.refresh();
    } catch {
      toast("error", "Network error. Please try again.");
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /** Shared PUT body for the inline featured/active toggles. */
  const togglePayload = (product: Product, overrides: Partial<Product>) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    image: product.image,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    sku: product.sku,
    barcode: product.barcode,
    trackInventory: product.trackInventory,
    sellOutOfStock: product.sellOutOfStock,
    weight: product.weight,
    weightUnit: product.weightUnit,
    featured: product.featured,
    active: product.active,
    variants: product.variants.map((v) => ({ size: v.size, stock: v.stock, price: v.price })),
    images: product.images.map((img) => ({ color: img.color, url: img.url })),
    ...overrides,
  });

  // ─── Toggle featured (optimistic) ───────────────────────────────────────────
  const toggleFeatured = async (product: Product) => {
    const newFeatured = !product.featured;
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, featured: newFeatured } : p))
    );

    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(togglePayload(product, { featured: newFeatured })),
      });

      if (!response.ok) {
        setProducts((current) =>
          current.map((p) => (p.id === product.id ? { ...p, featured: !newFeatured } : p))
        );
      }
    } catch {
      setProducts((current) =>
        current.map((p) => (p.id === product.id ? { ...p, featured: !newFeatured } : p))
      );
    }
  };

  // ─── Toggle active (optimistic) ─────────────────────────────────────────────
  const toggleActive = async (product: Product) => {
    const newActive = !product.active;
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, active: newActive } : p))
    );

    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(togglePayload(product, { active: newActive })),
      });

      if (!response.ok) {
        setProducts((current) =>
          current.map((p) => (p.id === product.id ? { ...p, active: !newActive } : p))
        );
      }
    } catch {
      setProducts((current) =>
        current.map((p) => (p.id === product.id ? { ...p, active: !newActive } : p))
      );
    }
  };

  // __PART3__
  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "",
      render: (product) => (
        <div className="h-12 w-12 overflow-hidden rounded-lg border border-stone/20 bg-bone">
          {product.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="flex h-full items-center justify-center text-stone/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0021.75 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Product",
      render: (product) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{product.name}</p>
          {product.sku && <p className="text-xs text-stone">SKU: {product.sku}</p>}
        </div>
      ),
      sortValue: (p) => p.name,
    },
    {
      key: "price",
      header: "Price",
      render: (product) => (
        <span>
          <span className="font-medium text-ink">${product.price.toFixed(2)}</span>
          {product.compareAtPrice && <span className="ml-1.5 text-xs text-stone line-through">${product.compareAtPrice.toFixed(2)}</span>}
        </span>
      ),
      sortValue: (p) => p.price,
    },
    {
      key: "margin",
      header: "Margin",
      hideOnMobile: true,
      render: (product) => {
        const variant = product.variants[0];
        if (!variant?.costPrice || variant.costPrice <= 0) return <span className="text-xs text-stone">—</span>;
        const profit = variant.price ? variant.price - variant.costPrice : 0;
        const pct = variant.costPrice > 0 ? (profit / variant.costPrice) * 100 : 0;
        const colorClass = pct < 20 ? "text-clay" : pct < 40 ? "text-amber-600" : "text-emerald-600";
        return <span className={`text-xs font-medium ${colorClass}`}>${profit.toFixed(2)} ({pct >= 0 ? "+" : ""}{pct.toFixed(0)}%)</span>;
      },
    },
    {
      key: "stock",
      header: "Stock",
      className: "text-right",
      headerClassName: "text-right",
      render: (product) => <span className={product.stock > 0 ? "text-stone" : "font-medium text-clay"}>{product.stock}</span>,
      sortValue: (p) => p.stock,
    },
    {
      key: "featured",
      header: "Featured",
      hideOnMobile: true,
      render: (product) => (
        <button type="button" onClick={() => toggleFeatured(product)} aria-pressed={product.featured} className="cursor-pointer">
          <Badge tone={product.featured ? "accent" : "neutral"}>{product.featured ? "Featured" : "Regular"}</Badge>
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product) => (
        <button type="button" onClick={() => toggleActive(product)} aria-pressed={product.active} className="cursor-pointer">
          <Badge tone={product.active ? "success" : "danger"}>{product.active ? "Active" : "Inactive"}</Badge>
        </button>
      ),
      sortValue: (p) => (p.active ? 1 : 0),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(product)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(product)}>Delete</Button>
        </div>
      ),
    },
  ];

  // __PART4__
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description={`${products.length} total · ${products.filter((p) => p.active).length} active`}
        action={<Button onClick={openCreate}>+ Add Product</Button>}
      />

      <DataTable
        columns={columns}
        rows={products}
        rowKey={(p) => p.id}
        searchValue={(p) => `${p.name} ${p.sku ?? ""}`}
        searchPlaceholder="Search by name…"
        emptyState="No products yet. Add your first product!"
      />

      {showForm && (
        <Modal
          open
          onClose={cancelForm}
          title={editingId ? "Edit Product" : "New Product"}
          description="Pricing, inventory, variants, and imagery."
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={form.name} onChange={(v) => setForm((prev) => ({ ...prev, name: v }))} placeholder="e.g. Trail Runner Hoodie" required />
              </Field>
              <Field label="SKU">
                <Input value={form.sku} onChange={(v) => setForm((prev) => ({ ...prev, sku: v }))} placeholder="Optional" />
              </Field>
            </div>

            <Field label="Description">
              <Textarea value={form.description} onChange={(v) => setForm((prev) => ({ ...prev, description: v }))} rows={4} required />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price">
                <Input type="number" step="0.01" min={0} value={form.price} onChange={(v) => setForm((prev) => ({ ...prev, price: Math.max(0, parseFloat(v) || 0) }))} required />
              </Field>
              <Field label="Compare at price">
                <Input type="number" step="0.01" min={0} value={form.compareAtPrice ?? ""} onChange={(v) => setForm((prev) => ({ ...prev, compareAtPrice: v ? Math.max(0, parseFloat(v)) : null }))} />
              </Field>
              <Field label="Barcode">
                <Input value={form.barcode} onChange={(v) => setForm((prev) => ({ ...prev, barcode: v }))} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Weight">
                <Input type="number" step="0.1" min={0} value={form.weight ?? ""} onChange={(v) => setForm((prev) => ({ ...prev, weight: v ? Math.max(0, parseFloat(v)) : null }))} />
              </Field>
              <Field label="Weight unit">
                <Select value={form.weightUnit} onChange={(v) => setForm((prev) => ({ ...prev, weightUnit: v }))} options={[{ value: "kg", label: "kg" }, { value: "g", label: "g" }, { value: "lb", label: "lb" }, { value: "oz", label: "oz" }]} />
              </Field>
            </div>

            <Field label="Main image">
              <div className="flex items-start gap-3">
                <Input value={form.image} onChange={(v) => setForm((prev) => ({ ...prev, image: v }))} placeholder="Paste image URL or upload…" />
                <Button variant="secondary" type="button" onClick={openMainImageUpload}>Upload</Button>
              </div>
              {form.image && (
                <div className="mt-2 h-20 w-20 overflow-hidden rounded-lg border border-stone/20">
                  <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </Field>

            <div className="flex flex-wrap items-center gap-6 rounded-lg border border-stone/20 bg-bone/60 px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2">
                <Toggle checked={form.featured} onChange={(v) => setForm((prev) => ({ ...prev, featured: v }))} />
                <span className="text-sm font-medium text-ink">Featured</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <Toggle checked={form.active} onChange={(v) => setForm((prev) => ({ ...prev, active: v }))} />
                <span className="text-sm font-medium text-ink">Active</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <Toggle checked={form.trackInventory} onChange={(v) => setForm((prev) => ({ ...prev, trackInventory: v }))} />
                <span className="text-sm font-medium text-ink">Track inventory</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <Toggle checked={form.sellOutOfStock} onChange={(v) => setForm((prev) => ({ ...prev, sellOutOfStock: v }))} />
                <span className="text-sm font-medium text-ink">Sell out of stock</span>
              </label>
            </div>

            {/* Size variants */}
            <Card>
              <CardHeader title="Size variants" />
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Size
                    <Input value={variantSize} onChange={setVariantSize} placeholder="e.g. M" className="w-24" />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Stock
                    <Input type="number" min={0} value={variantStock} onChange={setVariantStock} placeholder="0" className="w-20" />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Price
                    <Input type="number" step="0.01" min={0} value={variantPrice} onChange={setVariantPrice} placeholder="0.00" className="w-24" />
                  </label>
                  <Button variant="secondary" type="button" onClick={addVariant}>Add</Button>
                </div>
                {form.variants.length > 0 ? (
                  <ul className="space-y-1.5">
                    {form.variants.map((v) => (
                      <li key={v.id} className="flex items-center justify-between rounded-lg border border-stone/20 px-3.5 py-2">
                        <span className="text-sm text-ink"><strong>{v.size}</strong> — Stock: {v.stock} — ${(v.price ?? 0).toFixed(2)}</span>
                        <button type="button" onClick={() => removeVariant(v.id)} className="cursor-pointer text-xs font-medium text-clay transition-colors hover:text-red-700 focus:outline-none">Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-stone">No variants added yet.</p>
                )}
              </div>
            </Card>

            {/* Color images */}
            <Card>
              <CardHeader title="Color images" />
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Color
                    <Input value={imgColor} onChange={setImgColor} placeholder="e.g. Black" className="w-28" />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Image URL
                    <Input value={imgUrl} onChange={setImgUrl} placeholder="Paste URL…" className="w-56" />
                  </label>
                  <Button variant="secondary" type="button" onClick={openColorImageUpload}>Upload</Button>
                  <Button type="button" onClick={addImage}>Add</Button>
                </div>
                {form.images.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {form.images.map((img) => (
                      <div key={img.id} className="flex items-center gap-3 rounded-lg border border-stone/20 px-3.5 py-2">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-stone/20">
                          <img src={img.url} alt={img.color ?? ""} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{img.color}</p>
                          <p className="truncate text-xs text-stone">{img.url}</p>
                        </div>
                        <button type="button" onClick={() => removeImage(img.id)} className="shrink-0 cursor-pointer text-xs font-medium text-clay transition-colors hover:text-red-700 focus:outline-none">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone">No color images added yet.</p>
                )}
              </div>
            </Card>

            {/* Size chart — drives the "Size Chart" accordion on the product page */}
            <Card>
              <CardHeader title="Size chart" />
              <div className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Heading
                    <Input
                      value={form.sizeChart.heading}
                      onChange={(v) => setSizeChartField("heading", v)}
                      placeholder="e.g. Laid flat · Unisex"
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Sizes (columns, comma-separated)
                    <Input
                      value={form.sizeChart.sizesText}
                      onChange={(v) => setSizeChartField("sizesText", v)}
                      placeholder="S, M, L, XL, 2XL"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-stone">
                      Measurements (inches)
                    </p>
                    <Button variant="secondary" type="button" onClick={addChartRow}>
                      Add row
                    </Button>
                  </div>
                  {form.sizeChart.rows.length > 0 ? (
                    form.sizeChart.rows.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="space-y-2 rounded-lg border border-stone/20 p-3"
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <label className="space-y-1 text-xs font-medium text-stone">
                            Row label
                            <Input
                              value={row.label}
                              onChange={(v) => updateChartRow(rowIndex, { label: v })}
                              placeholder="Chest"
                              className="w-44"
                            />
                          </label>
                          <label className="space-y-1 text-xs font-medium text-stone">
                            Badge
                            <Input
                              value={row.callout}
                              onChange={(v) => updateChartRow(rowIndex, { callout: v })}
                              placeholder="1"
                              className="w-16"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeChartRow(rowIndex)}
                            className="mb-1.5 cursor-pointer text-xs font-medium text-clay transition-colors hover:text-red-700 focus:outline-none"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {chartSizes.length > 0 ? (
                            chartSizes.map((size, colIndex) => (
                              <label
                                key={`${rowIndex}-${colIndex}`}
                                className="space-y-1 text-xs font-medium text-stone"
                              >
                                {size}
                                <Input
                                  value={row.values[colIndex] ?? ""}
                                  onChange={(v) =>
                                    updateChartValue(rowIndex, colIndex, v)
                                  }
                                  placeholder="—"
                                  className="w-20"
                                />
                              </label>
                            ))
                          ) : (
                            <p className="text-xs text-stone">
                              Add sizes above to enter measurements.
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone">
                      No measurement rows yet — the default chart is used.
                    </p>
                  )}
                </div>
                <label className="block space-y-1 text-xs font-medium text-stone">
                  Notes (footnote under the table)
                  <Textarea
                    rows={3}
                    value={form.sizeChart.notes}
                    onChange={(v) => setSizeChartField("notes", v)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-medium text-stone">
                    Callout title
                    <Input
                      value={form.sizeChart.calloutTitle}
                      onChange={(v) => setSizeChartField("calloutTitle", v)}
                      placeholder="Not sure?"
                    />
                  </label>
                  <label className="block space-y-1 text-xs font-medium text-stone">
                    Callout text
                    <Textarea
                      rows={2}
                      value={form.sizeChart.calloutBody}
                      onChange={(v) => setSizeChartField("calloutBody", v)}
                    />
                  </label>
                </div>
                <p className="text-xs text-stone">
                  Shown in the product page&apos;s &quot;Size Chart&quot; accordion.
                  Blank fields fall back to the default chart content.
                </p>
              </div>
            </Card>

            <div className="flex items-center justify-between gap-4 border-t border-stone/20 pt-4">
              <div>
                {editingId && (
                  <Button variant="danger" type="button" onClick={() => { const product = products.find((p) => p.id === editingId); if (product) setDeleteTarget(product); }}>Delete Product</Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" type="button" onClick={cancelForm} disabled={saving}>Cancel</Button>
                <Button type="submit" loading={saving}>{editingId ? "Update Product" : "Create Product"}</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

<ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        loading={isDeleting}
      />
    </div>
  );
}