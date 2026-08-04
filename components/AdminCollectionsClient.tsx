"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: { products: number };
};

type AdminCollectionsClientProps = {
  initialCollections: Collection[];
  allProducts: Product[];
};

declare global {
  interface Window {
    cloudinary?: any;
  }
}

function useCloudinaryUpload(onUpload: (url: string) => void) {
  const upload = useCallback(() => {
    if (typeof window === "undefined" || !window.cloudinary) {
      alert("Cloudinary widget not loaded.");
      return;
    }
    window.cloudinary.openUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
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
        if (error) { console.error("Cloudinary upload error:", error); return; }
        if (result?.event === "success" && result?.info?.secure_url) {
          onUpload(result.info.secure_url);
        }
      }
    );
  }, [onUpload]);
  return upload;
}

export default function AdminCollectionsClient({ initialCollections, allProducts }: AdminCollectionsClientProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const router = useRouter();

  const openCreate = () => {
    setEditingCollection(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormImage("");
    setSelectedProductIds([]);
    setErrors([]);
    setSuccessMsg(null);
    setShowForm(true);
  };

  const openEdit = (collection: Collection & { productIds?: string[] }) => {
    setEditingCollection(collection);
    setFormName(collection.name);
    setFormSlug(collection.slug);
    setFormDescription(collection.description || "");
    setFormImage(collection.image || "");
    setSelectedProductIds(collection.productIds || []);
    setErrors([]);
    setSuccessMsg(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCollection(null);
    setErrors([]);
    setSuccessMsg(null);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleImageUpload = useCallback((url: string) => setFormImage(url), []);
  const openImageUpload = useCloudinaryUpload(handleImageUpload);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);

    const slug = formSlug.trim() || generateSlug(formName);

    try {
      const method = editingCollection ? "PUT" : "POST";
      const url = editingCollection
        ? `/api/admin/collections/${editingCollection.slug}`
        : "/api/admin/collections";

      const body = {
        name: formName.trim(),
        slug,
        description: formDescription.trim() || null,
        image: formImage.trim() || null,
        productIds: selectedProductIds,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.details ? data.details : [data.error || "Failed to save."]);
        setSaving(false);
        return;
      }

      setSuccessMsg(editingCollection ? "Collection updated." : "Collection created.");
      setSaving(false);
      cancelForm();
      router.refresh();

      // Refresh list
      const listRes = await fetch("/api/admin/collections");
      if (listRes.ok) {
        setCollections(await listRes.json());
      }
    } catch {
      setErrors(["Network error. Please try again."]);
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/admin/collections/${deleteTarget.slug}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        setErrors([data.error || "Failed to delete."]);
        setDeleteTarget(null);
        return;
      }
      setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSuccessMsg("Collection deleted. Products were preserved.");
      router.refresh();
    } catch {
      setErrors(["Network error."]);
      setDeleteTarget(null);
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-ink">Collections</h1>
          <p className="text-stone mt-1 font-body text-sm">{collections.length} total</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="cursor-pointer rounded-lg bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40"
        >
          + Add Collection
        </button>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss font-body">{successMsg}</div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-stone/20 bg-white p-6 shadow-md space-y-6">
          <h2 className="text-xl font-bold font-display text-ink">
            {editingCollection ? "Edit Collection" : "New Collection"}
          </h2>

          {errors.length > 0 && (
            <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">
              {errors.map((msg, idx) => <p key={idx} className="text-sm text-red-700 font-body">{msg}</p>)}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Name <span className="text-clay">*</span>
              <input
                required
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingCollection) setFormSlug(generateSlug(e.target.value));
                }}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Slug <span className="text-clay">*</span>
              <input
                required
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="my-collection"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body font-mono"
              />
            </label>
          </div>

          <label className="space-y-1.5 text-sm font-medium text-stone font-body">
            Description
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body resize-y"
            />
          </label>

          {/* Image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone font-body">Image URL</label>
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <input
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="Paste image URL..."
                  className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
                />
                <button
                  type="button"
                  onClick={openImageUpload}
                  className="cursor-pointer rounded-lg border border-stone/20 bg-white px-3.5 py-2 text-sm font-medium text-stone transition hover:bg-[#F0F0EE] focus:outline-none focus:ring-2 focus:ring-ink/20"
                >
                  Upload from Cloudinary
                </button>
              </div>
              {formImage && (
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone/20 bg-white">
                  <img src={formImage} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Product assignment */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
              Products in this Collection
            </h3>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
            />
            <div className="max-h-60 overflow-y-auto rounded-lg border border-stone/20 divide-y divide-[#E2E8F0]">
              {filteredProducts.length === 0 && (
                <p className="px-3.5 py-3 text-sm text-stone font-body">No products found.</p>
              )}
              {filteredProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-white transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer"
                  />
                  <span className="text-sm text-ink font-body">{product.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-stone font-body">
              {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone/20">
            <div>
              {editingCollection && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(editingCollection)}
                  className="cursor-pointer rounded-lg border border-clay/30 bg-white px-4 py-2 text-sm font-medium text-clay transition hover:bg-clay/5 focus:outline-none focus:ring-2 focus:ring-clay/30"
                >
                  Delete Collection
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
                {saving ? "Saving..." : editingCollection ? "Update Collection" : "Create Collection"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Collection list */}
      <div className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        {collections.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-stone font-body">No collections yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone/20 bg-white">
                <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Collection</th>
                <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Products</th>
                <th className="text-right px-4 py-3 font-semibold text-stone font-display text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-white transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink font-body">{collection.name}</p>
                    {collection.description && (
                      <p className="text-xs text-stone font-body truncate max-w-xs">{collection.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-stone">{collection.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-stone font-body">{collection._count?.products ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/collections/${collection.slug}`);
                          const data = await res.json();
                          openEdit({ ...collection, productIds: data.products?.map((p: any) => p.id) || [] });
                        }}
                        className="cursor-pointer rounded-lg border border-stone/20 bg-white px-3 py-1.5 text-xs font-medium text-stone transition hover:bg-white hover:border-clay focus:outline-none focus:ring-2 focus:ring-ink/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(collection)}
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
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-stone/20 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold font-display text-ink">Delete Collection</h3>
            <p className="mt-2 text-sm text-stone font-body">
              Are you sure you want to delete <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>?
              Products in this collection will <strong>not</strong> be deleted — they will just be unassigned.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-lg border border-stone/20 bg-white px-4 py-2 text-sm font-medium text-stone transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}