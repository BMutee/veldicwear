"use client";

import { useState, useCallback, useEffect } from "react";
import type { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: true;
    images: true;
  };
}>;

type AdminProductsClientProps = {
  initialProducts: ProductWithRelations[];
  editProductId?: string;
};

type VariantEntry = {
  id: string;
  size: string;
  stock: number;
  price: number | null;
  costPrice: number | null;
};

type ImageEntry = {
  id: string;
  color: string | null;
  url: string;
};

type ProductForm = {
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
  collectionId: string | null;
  variants: VariantEntry[];
  images: ImageEntry[];
};

const emptyForm: ProductForm = {
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
  collectionId: null,
  variants: [],
  images: [],
};

// ─── Cloudinary Upload Widget ─────────────────────────────────
declare global {
  interface Window {
    cloudinary?: any;
  }
}

function useCloudinaryUpload(onUpload: (url: string) => void) {
  const upload = useCallback(() => {
    if (typeof window === "undefined") {
      alert("Cannot access window object.");
      return;
    }
    if (!window.cloudinary) {
      alert(
        "Cloudinary widget not loaded yet. Please wait a moment and try again.\n\n" +
        "If this persists, try refreshing the page."
      );
      console.warn("Cloudinary widget script not loaded. Check that the script is loading in admin/layout.tsx");
      return;
    }
    if (!window.cloudinary.openUploadWidget) {
      alert("Cloudinary widget API not available. Try refreshing the page.");
      console.error("cloudinary.openUploadWidget is not a function", window.cloudinary);
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert(
        "Cloudinary is not configured.\n\n" +
        "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env"
      );
      console.error("Missing Cloudinary env vars:", { cloudName, uploadPreset });
      return;
    }

    try {
      window.cloudinary.openUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ["local", "url", "camera"],
          multiple: false,
          cropping: false,
          styles: {
            palette: {
              window: "#FAFAF9",
              sourceBg: "#1C1917",
              windowBorder: "#E2E8F0",
              tabIcon: "#CA8A04",
              inactiveTabIcon: "#78716C",
              menuIcons: "#1C1917",
              link: "#CA8A04",
              action: "#CA8A04",
              inProgress: "#CA8A04",
              complete: "#1C1917",
              error: "#EF4444",
              textDark: "#0C0A09",
              textLight: "#FAFAF9",
            },
          },
        },
        (error: any, result: any) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            alert(
              "Cloudinary upload failed (HTTP 420 — Enhance Your Calm).\n\n" +
              "This usually means the upload preset 'ForVeldic' is missing or set to 'Signed' instead of 'Unsigned'.\n\n" +
              "To fix:\n" +
              "1. Go to https://console.cloudinary.com → Settings → Upload\n" +
              "2. Find upload preset 'ForVeldic' or create a new one\n" +
              "3. Set Signing Mode to 'Unsigned'\n" +
              "4. Save and try again"
            );
            return;
          }
          if (result?.event === "success" && result?.info?.secure_url) {
            onUpload(result.info.secure_url);
          }
        }
      );
    } catch (err) {
      console.error("Cloudinary widget failed to open:", err);
      alert("Failed to open upload widget. Check console for details.");
    }
  }, [onUpload]);

  return upload;
}

// ─── Delete Confirmation Dialog ───────────────────────────────
function DeleteDialog({
  productName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-stone/20 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold font-display text-ink">Delete Product</h3>
        <p className="mt-2 text-sm text-stone font-body">
          Are you sure you want to delete <strong>&ldquo;{productName}&rdquo;</strong>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg border border-stone/20 bg-white px-4 py-2 text-sm font-medium text-stone transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminProductsClient({ initialProducts, editProductId }: AdminProductsClientProps) {
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  // ─── Auto-open edit form when navigated with ?edit=<productId> ──
  useEffect(() => {
    if (!editProductId) return;
    const product = products.find((p) => p.id === editProductId);
    if (product) {
      openEdit(product);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProductId]);

  // ─── Variant input state ──
  const [variantSize, setVariantSize] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantPrice, setVariantPrice] = useState("");

  // ─── Image input state ──
  const [imgColor, setImgColor] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  // ─── Cloudinary upload handler for main image ──
  const handleMainImageUpload = useCallback(
    (url: string) => {
      setForm((prev) => ({ ...prev, image: url }));
    },
    []
  );
  const openMainImageUpload = useCloudinaryUpload(handleMainImageUpload);

  // ─── Cloudinary upload handler for per-color images ──
  const handleColorImageUpload = useCallback(
    (url: string) => {
      setImgUrl(url);
    },
    []
  );
  const openColorImageUpload = useCloudinaryUpload(handleColorImageUpload);

  // ─── Filtered products ──
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Open create ──
  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors([]);
    setSuccessMsg(null);
    setShowForm(true);
  };

  // ─── Open edit ──
  const openEdit = (product: ProductWithRelations) => {
    setForm({
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
      collectionId: product.collectionId,
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        stock: v.stock,
        price: v.price,
        costPrice: v.costPrice,
      })),
      images: product.images.map((img) => ({
        id: img.id,
        color: img.color,
        url: img.url,
      })),
    });
    setEditingId(product.id);
    setErrors([]);
    setSuccessMsg(null);
    setShowForm(true);
  };

  // ─── Cancel form ──
  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors([]);
    setSuccessMsg(null);
  };

  // ─── Add variant ──
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

  // ─── Remove variant ──
  const removeVariant = (id: string) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== id) }));
  };

  // ─── Add image ──
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

  // ─── Remove image ──
  const removeImage = (id: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((img) => img.id !== id) }));
  };

  // ─── Submit ──
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);

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
      collectionId: form.collectionId || null,
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
        const errorMessages = data.details
          ? data.details.join("\n")
          : data.error || "Failed to save product.";
        setErrors([errorMessages]);
        setSaving(false);
        return;
      }

      // Update local state
      setProducts((current) => {
        if (editingId) {
          return current.map((item) => (item.id === data.id ? data : item));
        }
        return [data, ...current];
      });

      setSuccessMsg(editingId ? "Product updated successfully." : "Product created successfully.");
      setSaving(false);

      // Close form after short delay
      setTimeout(() => {
        cancelForm();
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Submit error:", err);
      setErrors(["Network error. Please try again."]);
      setSaving(false);
    }
  };

  // ─── Delete product ──
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
        setErrors([data.error || "Failed to delete product."]);
        setIsDeleting(false);
        setDeleteTarget(null);
        return;
      }

      setProducts((current) => current.filter((p) => p.id !== deleteTarget.id));
      setIsDeleting(false);
      setDeleteTarget(null);
      setSuccessMsg("Product deleted.");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      setErrors(["Network error. Please try again."]);
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ─── Toggle featured ──
  const toggleFeatured = async (product: ProductWithRelations) => {
    const newFeatured = !product.featured;
    // Optimistic update
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, featured: newFeatured } : p))
    );

    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          featured: newFeatured,
          active: product.active,
          collectionId: product.collectionId,
          variants: product.variants.map((v) => ({
            size: v.size,
            stock: v.stock,
            price: v.price,
          })),
          images: product.images.map((img) => ({
            color: img.color,
            url: img.url,
          })),
        }),
      });

      if (!response.ok) {
        // Revert on failure
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

  // ─── Toggle active ──
  const toggleActive = async (product: ProductWithRelations) => {
    const newActive = !product.active;
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, active: newActive } : p))
    );

    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          active: newActive,
          collectionId: product.collectionId,
          variants: product.variants.map((v) => ({
            size: v.size,
            stock: v.stock,
            price: v.price,
          })),
          images: product.images.map((img) => ({
            color: img.color,
            url: img.url,
          })),
        }),
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

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
            Products
          </h1>
          <p className="text-stone mt-1 font-body text-sm">
            {products.length} total &middot;{" "}
            {products.filter((p) => p.active).length} active
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40"
        >
          + Add Product
        </button>
      </div>

      {/* ─── Success Message ─── */}
      {successMsg && (
        <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss font-body">
          {successMsg}
        </div>
      )}

      {/* ─── Search ─── */}
      <div className="relative max-w-sm">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-stone/20 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-stone outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
        />
      </div>

      {/* ─── Form (Create / Edit) ─── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-stone/20 bg-white p-6 shadow-md space-y-6">
          <h2 className="text-xl font-bold font-display text-ink">
            {editingId ? "Edit Product" : "New Product"}
          </h2>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">
              {errors.map((msg, idx) => (
                <p key={idx} className="text-sm text-red-700 font-body">{msg}</p>
              ))}
            </div>
          )}

          {/* Row 1: Name + SKU */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Name <span className="text-clay">*</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              SKU
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>

          {/* Row 2: Price + Compare At Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Price <span className="text-clay">*</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Compare At Price
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice ?? ""}
                onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value ? Math.max(0, parseFloat(e.target.value)) : null })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>

          {/* Row 3: Weight + Barcode */}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Weight
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weight ?? ""}
                onChange={(e) => setForm({ ...form, weight: e.target.value ? Math.max(0, parseFloat(e.target.value)) : null })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Weight Unit
              <select
                value={form.weightUnit}
                onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Barcode
              <input
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>

          {/* Description */}
          <label className="space-y-1.5 text-sm font-medium text-stone font-body">
            Description <span className="text-clay">*</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body resize-y"
            />
          </label>

          {/* Main Image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone font-body">
              Main Image
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="Paste image URL..."
                  className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
                <button
                  type="button"
                  onClick={openMainImageUpload}
                  className="cursor-pointer rounded-lg border border-stone/20 bg-white px-3.5 py-2 text-sm font-medium text-stone transition hover:bg-[#F0F0EE] focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  Upload from Cloudinary
                </button>
              </div>
              {form.image && (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone/20 bg-white">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggles Row */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer"
              />
              <span className="text-sm font-medium text-stone font-body">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer"
              />
              <span className="text-sm font-medium text-stone font-body">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.trackInventory}
                onChange={(e) => setForm({ ...form, trackInventory: e.target.checked })}
                className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer"
              />
              <span className="text-sm font-medium text-stone font-body">Track Inventory</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sellOutOfStock}
                onChange={(e) => setForm({ ...form, sellOutOfStock: e.target.checked })}
                className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer"
              />
              <span className="text-sm font-medium text-stone font-body">Sell Out of Stock</span>
            </label>
          </div>

          {/* ─── Variant Management ─── */}
          <div className="rounded-lg border border-stone/20 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
              Size Variants
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs font-medium text-stone font-body">
                Size
                <input
                  value={variantSize}
                  onChange={(e) => setVariantSize(e.target.value)}
                  placeholder="e.g. M"
                  className="w-24 rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-stone font-body">
                Stock
                <input
                  type="number"
                  min="0"
                  value={variantStock}
                  onChange={(e) => setVariantStock(e.target.value)}
                  placeholder="0"
                  className="w-20 rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-stone font-body">
                Price
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variantPrice}
                  onChange={(e) => setVariantPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-24 rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917]/30"
              >
                Add
              </button>
            </div>
            {form.variants.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {form.variants.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border border-stone/20 bg-white px-3.5 py-2"
                  >
                    <span className="text-sm text-ink font-body">
                      <strong>{v.size}</strong> &mdash; Stock: {v.stock} &mdash; ${(v.price ?? 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="cursor-pointer text-xs font-medium text-clay hover:text-red-700 transition focus:outline-none"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {form.variants.length === 0 && (
              <p className="text-xs text-stone font-body">No variants added yet.</p>
            )}
          </div>

          {/* ─── Color Image Management ─── */}
          <div className="rounded-lg border border-stone/20 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
              Color Images
            </h3>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1 text-xs font-medium text-stone font-body">
                Color
                <input
                  value={imgColor}
                  onChange={(e) => setImgColor(e.target.value)}
                  placeholder="e.g. Black"
                  className="w-28 rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
              </label>
              <label className="space-y-1 text-xs font-medium text-stone font-body">
                Image URL
                <input
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="Paste URL..."
                  className="w-56 rounded-lg border border-stone/20 px-3 py-2 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
              </label>
              <button
                type="button"
                onClick={openColorImageUpload}
                className="cursor-pointer rounded-lg border border-stone/20 bg-white px-3.5 py-2 text-xs font-medium text-stone transition hover:bg-[#F0F0EE] focus:outline-none focus:ring-2 focus:ring-ink/20"
              >
                Upload
              </button>
              <button
                type="button"
                onClick={addImage}
                className="cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#1C1917]/30"
              >
                Add
              </button>
            </div>
            {form.images.length > 0 && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {form.images.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-center gap-3 rounded-lg border border-stone/20 bg-white px-3.5 py-2"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-stone/20 bg-white">
                      <img
                        src={img.url}
                        alt={img.color ?? ""}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate font-body">{img.color}</p>
                      <p className="text-xs text-stone truncate font-body">{img.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="cursor-pointer shrink-0 text-xs font-medium text-clay hover:text-red-700 transition focus:outline-none"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {form.images.length === 0 && (
              <p className="text-xs text-stone font-body">No color images added yet.</p>
            )}
          </div>

          {/* ─── Form Actions ─── */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone/20">
            <div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    const product = products.find((p) => p.id === editingId);
                    if (product) setDeleteTarget(product);
                  }}
                  className="cursor-pointer rounded-lg border border-clay/30 bg-white px-4 py-2 text-sm font-medium text-clay transition hover:bg-clay/5 focus:outline-none focus:ring-2 focus:ring-clay/30"
                >
                  Delete Product
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className="cursor-pointer rounded-lg border border-stone/20 bg-white px-5 py-2.5 text-sm font-medium text-stone transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ─── Product Table ─── */}
      <div className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        {filteredProducts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-stone/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-3 text-sm text-stone font-body">
              {searchQuery ? "No products match your search." : "No products yet. Add your first product!"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone/20 bg-white">
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Image</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Margin</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Stock</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Featured</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white transition-colors">
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg border border-stone/20 bg-white">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-stone/30">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink font-body">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-stone font-body">SKU: {product.sku}</p>
                      )}
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink font-body">${product.price.toFixed(2)}</span>
                      {product.compareAtPrice && (
                        <span className="ml-1.5 text-xs text-stone line-through font-body">
                          ${product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    {/* Margin */}
                    <td className="px-4 py-3">
                      {(() => {
                        const variant = product.variants[0];
                        if (!variant?.costPrice || variant.costPrice <= 0) {
                          return <span className="text-xs text-stone font-body">—</span>;
                        }
                        const profit = variant.price ? variant.price - variant.costPrice : 0;
                        const pct = variant.costPrice > 0 ? (profit / variant.costPrice) * 100 : 0;
                        const colorClass = pct < 20 ? "text-clay" : pct < 40 ? "text-amber-600" : "text-emerald-600";
                        return (
                          <span className={`font-body text-xs ${colorClass}`}>
                            ${profit.toFixed(2)} ({pct >= 0 ? "+" : ""}{pct.toFixed(0)}%)
                          </span>
                        );
                      })()}
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={`font-body ${product.stock > 0 ? "text-stone" : "text-clay"}`}>
                        {product.stock}
                      </span>
                    </td>
                    {/* Featured */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(product)}
                        className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-clay/30 ${
                          product.featured
                            ? "bg-clay/10 text-clay"
                            : "bg-[#E2E8F0]/50 text-stone"
                        }`}
                      >
                        {product.featured ? "Featured" : "Regular"}
                      </button>
                    </td>
                    {/* Active/Inactive */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActive(product)}
                        className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-ink/20 ${
                          product.active
                            ? "bg-moss/5 text-green-700"
                            : "bg-clay/5 text-red-700"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${product.active ? "bg-moss/50" : "bg-clay/50"}`} />
                        {product.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="cursor-pointer rounded-lg border border-stone/20 bg-white px-3 py-1.5 text-xs font-medium text-stone transition hover:bg-white hover:border-clay focus:outline-none focus:ring-2 focus:ring-ink/20"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="cursor-pointer rounded-lg border border-clay/20 bg-white px-3 py-1.5 text-xs font-medium text-clay transition hover:bg-clay/5 focus:outline-none focus:ring-2 focus:ring-clay/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteTarget && (
        <DeleteDialog
          productName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setIsDeleting(false);
          }}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}