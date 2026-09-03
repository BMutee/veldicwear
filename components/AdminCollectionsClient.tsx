"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Field,
  Input,
  PageHeader,
  SearchInput,
  Textarea,
} from "@/components/admin-ui/primitives";
import { Modal } from "@/components/admin-ui/Modal";
import { useToast } from "@/components/admin-ui/toast";
import { ConfirmDialog } from "@/components/admin-ui/Modal";
import { useCloudinaryUpload } from "@/components/admin-ui/use-cloudinary";
import { DataTable, type Column } from "@/components/admin-ui/DataTable";

export type Product = {
  id: string;
  name: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: { products: number };
};

export default function AdminCollectionsClient({
  initialCollections,
  allProducts,
}: {
  initialCollections: Collection[];
  allProducts: Product[];
}) {
  const router = useRouter();
  const { toast } = useToast();
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
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditingCollection(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormImage("");
    setSelectedProductIds([]);
    setShowForm(true);
  };

  const openEdit = (collection: Collection & { productIds?: string[] }) => {
    setEditingCollection(collection);
    setFormName(collection.name);
    setFormSlug(collection.slug);
    setFormDescription(collection.description || "");
    setFormImage(collection.image || "");
    setSelectedProductIds(collection.productIds || []);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCollection(null);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageUpload = useCallback((url: string) => setFormImage(url), []);
  const openImageUpload = useCloudinaryUpload(handleImageUpload);

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  // __PART2__
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
        toast("error", (data.details?.[0] as string) || data.error || "Failed to save.");
        setSaving(false);
        return;
      }

      toast("success", editingCollection ? "Collection updated." : "Collection created.");
      setSaving(false);
      cancelForm();
      router.refresh();

      const listRes = await fetch("/api/admin/collections");
      if (listRes.ok) setCollections(await listRes.json());
    } catch {
      toast("error", "Network error. Please try again.");
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/collections/${deleteTarget.slug}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        toast("error", data.error || "Failed to delete.");
        setDeleteTarget(null);
        return;
      }
      setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "Collection deleted. Products were preserved.");
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProducts = useMemo(
    () =>
      allProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [allProducts, searchTerm]
  );

  const columns: Column<Collection>[] = [
    {
      key: "name",
      header: "Collection",
      render: (collection) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone/20 bg-bone">
            {collection.image ? (

              <img src={collection.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-stone" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.625 0 1.124.504 1.124 1.125v1.125c0 .621-.53 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V7.125zM5.25 15h3.75M5.25 11.25h3.75" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-ink">{collection.name}</p>
            {collection.description && (
              <p className="truncate max-w-xs text-xs text-stone">{collection.description}</p>
            )}
          </div>
        </div>
      ),
      sortValue: (c) => c.name,
    },
    {
      key: "slug",
      header: "Slug",
      hideOnMobile: true,
      render: (c) => <code className="text-xs text-stone">/{c.slug}</code>,
    },
    {
      key: "count",
      header: "Products",
      className: "text-right",
      headerClassName: "text-right",
      render: (c) => <span className="text-stone">{c._count?.products ?? 0}</span>,
      sortValue: (c) => c._count?.products ?? 0,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (collection) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const res = await fetch(`/api/admin/collections/${collection.slug}`);
              const data = await res.json();
              openEdit({ ...collection, productIds: data.products?.map((p: { id: string }) => p.id) || [] });
            }}
          >
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(collection)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // __PART3__
  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description={`${collections.length} total`}
        action={<Button onClick={openCreate}>+ New Collection</Button>}
      />

      <DataTable
        columns={columns}
        rows={collections}
        rowKey={(c) => c.id}
        searchValue={(c) => `${c.name} ${c.slug}`}
        searchPlaceholder="Search collectionsâ€¦"
        emptyState="No collections yet. Create your first collection to group products."
      />

      {/* Create / edit form */}
      {showForm && (
        <Modal
          open
          onClose={cancelForm}
          title={editingCollection ? "Edit Collection" : "New Collection"}
          description="Group products under a collection shown in the storefront."
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={formName}
                  onChange={(v) => {
                    setFormName(v);
                    if (!editingCollection) setFormSlug(generateSlug(v));
                  }}
                  placeholder="e.g. New Arrivals"
                  required
                />
              </Field>
              <Field label="Slug" hint="Auto-generated from name when left blank.">
                <Input
                  value={formSlug}
                  onChange={setFormSlug}
                  placeholder="new-arrivals"
                  required
                />
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={formDescription}
                onChange={setFormDescription}
                placeholder="Short description shown on the collection page."
              />
            </Field>

            <Field label="Image">
              <div className="flex items-start gap-3">
                <Input
                  value={formImage}
                  onChange={setFormImage}
                  placeholder="Paste image URL or uploadâ€¦"
                />
                <Button variant="secondary" type="button" onClick={openImageUpload}>
                  Upload
                </Button>
              </div>
              {formImage && (
                <div className="mt-2 h-20 w-20 overflow-hidden rounded-lg border border-stone/20">
                  <img src={formImage} alt="Collection preview" className="h-full w-full object-cover" />
                </div>
              )}
            </Field>

            <Field label={`Products (${selectedProductIds.length} selected)`}>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Filter productsâ€¦"
                className="w-full"
              />
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-stone/20">
                {filteredProducts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-stone">No products match.</p>
                ) : (
                  <ul className="divide-y divide-stone/10">
                    {filteredProducts.map((product) => {
                      const selected = selectedProductIds.includes(product.id);
                      return (
                        <li key={product.id}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-bone">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleProduct(product.id)}
                              className="h-4 w-4 cursor-pointer accent-moss"
                            />
                            <span className={selected ? "font-medium text-ink" : "text-stone"}>
                              {product.name}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Field>

            <div className="flex justify-end gap-2 border-t border-stone/20 pt-4">
              <Button variant="secondary" type="button" onClick={cancelForm} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                {editingCollection ? "Save changes" : "Create collection"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Products in this collection will not be deleted â€” they will just be unassigned.`}
        loading={isDeleting}
      />
    </div>
  );
}
