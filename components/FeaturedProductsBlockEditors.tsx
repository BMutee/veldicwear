"use client";

// Admin editor components for the FEATURED_PRODUCTS block type: a curated,
// ordered product picker (content) and the section styles editor. Imported by
// AdminBlocksClient; fetches the catalog from the admin-guarded
// GET /api/admin/products.

import { useEffect, useMemo, useState } from "react";
import type {
  BlockContent,
  BlockStyles,
  FeaturedBlockContent,
  FeaturedBlockStyles,
  HeroBlockStyles,
} from "@/lib/block-section";
import { FEATURED_BLOCK_DEFAULT_STYLES } from "@/lib/block-section";
import { BreakpointField, ColorField, INPUT_CLS, LABEL_CLS, AnimationField } from "./AdminSectionShared";
import { normalizeImageSrc } from "@/lib/image";

type StyleChange = (styles: BlockStyles | HeroBlockStyles | FeaturedBlockStyles) => void;

export function FeaturedStyleEditor({ styles, onChange }: { styles: FeaturedBlockStyles; onChange: StyleChange }) {
  const update = (key: keyof FeaturedBlockStyles, value: unknown) => onChange({ ...styles, [key]: value } as FeaturedBlockStyles);
  return (
    <div className="mt-5 space-y-5">
      <BreakpointField label="Heading font size (px)" mobile={styles.headingFontSize.mobile} desktop={styles.headingFontSize.desktop} mobileMin={32} desktopMin={32} mobileMax={160} desktopMax={160} onChangeMobile={(v) => update("headingFontSize", { ...styles.headingFontSize, mobile: v })} onChangeDesktop={(v) => update("headingFontSize", { ...styles.headingFontSize, desktop: v })} />
      <BreakpointField label="Padding top (px)" mobile={styles.paddingTop.mobile} desktop={styles.paddingTop.desktop} mobileMin={48} desktopMin={48} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingTop", { ...styles.paddingTop, mobile: v })} onChangeDesktop={(v) => update("paddingTop", { ...styles.paddingTop, desktop: v })} />
      <BreakpointField label="Padding bottom (px)" mobile={styles.paddingBottom.mobile} desktop={styles.paddingBottom.desktop} mobileMin={48} desktopMin={48} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingBottom", { ...styles.paddingBottom, mobile: v })} onChangeDesktop={(v) => update("paddingBottom", { ...styles.paddingBottom, desktop: v })} />
      <BreakpointField label="Horizontal padding (px)" mobile={styles.paddingX.mobile} desktop={styles.paddingX.desktop} mobileMin={24} desktopMin={24} mobileMax={200} desktopMax={200} onChangeMobile={(v) => update("paddingX", { ...styles.paddingX, mobile: v })} onChangeDesktop={(v) => update("paddingX", { ...styles.paddingX, desktop: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField label="Background" value={styles.backgroundColor} onChange={(v) => update("backgroundColor", v)} />
        <ColorField label="Text" value={styles.textColor} onChange={(v) => update("textColor", v)} />
      </div>
      <AnimationField value={styles.animation} onChange={(a) => onChange({ ...styles, animation: a } as FeaturedBlockStyles)} />
      <button type="button" onClick={() => onChange(FEATURED_BLOCK_DEFAULT_STYLES)} className="cursor-pointer text-sm text-stone underline hover:text-ink">
        Reset styles
      </button>
    </div>
  );
}

type PickerProduct = { id: string; name: string; image: string | null; price: number; active: boolean };

// Pure detection for the picker's warning: a stored productId is an issue if
// it no longer exists (deleted) or its product is inactive. Exported so the
// logic is unit-testable; the live render silently skips exactly these IDs.
export type FeaturedIssue = { id: string; product: PickerProduct | undefined };
export function findFeaturedIssues(productIds: string[], products: PickerProduct[]): FeaturedIssue[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return productIds
    .map((id) => ({ id, product: byId.get(id) }))
    .filter((entry) => !entry.product || !entry.product.active);
}

// Curated, ordered product picker. Preserves the stored productIds order
// (up/down to reorder, max 8) and warns about any stored ID that is missing
// (deleted) or inactive, since the live render silently skips them.
export function FeaturedProductsContentEditor({ content, onChange }: { content: FeaturedBlockContent; onChange: (content: BlockContent) => void }) {
  const [allProducts, setAllProducts] = useState<PickerProduct[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/products")
      .then((response) => (response.ok ? response.json() : []))
      .then((products: PickerProduct[]) => {
        if (alive) setAllProducts(products);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const picked = content.productIds;
  const setPicked = (next: string[]) => onChange({ ...content, productIds: next });
  const byId = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);
  const issues = useMemo(() => findFeaturedIssues(picked, allProducts), [picked, allProducts]);

  const addProduct = (id: string) => {
    if (picked.includes(id) || picked.length >= 8) return;
    setPicked([...picked, id]);
  };
  const removeProduct = (id: string) => setPicked(picked.filter((item) => item !== id));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= picked.length) return;
    const next = [...picked];
    [next[index], next[target]] = [next[target], next[index]];
    setPicked(next);
  };

  const matches = allProducts
    .filter((p) => !picked.includes(p.id) && p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 12);

  return (
    <div className="mt-4 space-y-5">
      <label className={LABEL_CLS}>
        Section title
        <input value={content.featuredSectionTitle ?? ""} onChange={(e) => onChange({ ...content, featuredSectionTitle: e.target.value })} className={INPUT_CLS} />
      </label>
      <label className={LABEL_CLS}>
        Section subtitle
        <input value={content.featuredSectionSubtitle ?? ""} onChange={(e) => onChange({ ...content, featuredSectionSubtitle: e.target.value })} className={INPUT_CLS} />
      </label>

      {issues.length > 0 && (
        <div role="alert" className="rounded-lg border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay">
          <p className="font-semibold">Featured products that are no longer available</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {issues.map(({ id, product }) => (
              <li key={id}>
                {product ? <>{product.name} (inactive)</> : <>Product {id.slice(0, 8)}&hellip; (deleted)</>} — skipped on the live site. Remove it below.
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-stone/20 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone">Pinned products ({picked.length}/8)</span>
          <span className="text-xs text-stone">Pinned first; rest auto-fills with newest.</span>
        </div>
        {picked.length === 0 ? (
          <p className="mt-3 text-sm text-stone">Nothing pinned — the section shows the 8 newest products. Use the search below to pin favorites.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {picked.map((id, index) => {
              const product = byId.get(id);
              if (!product) {
                return (
                  <li key={id} className="flex items-center gap-3 rounded-lg border border-clay/30 bg-clay/5 px-3 py-2">
                    <span className="flex-1 truncate text-sm text-clay">Deleted product ({id.slice(0, 8)}&hellip;)</span>
                    <button type="button" onClick={() => removeProduct(id)} aria-label="Remove deleted product" className="cursor-pointer rounded p-1 text-clay transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </li>
                );
              }
              return (
                <li key={id} className="flex items-center gap-3 rounded-lg border border-stone/20 bg-white px-3 py-2">
                  {product.image ? <img src={normalizeImageSrc(product.image)} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-md bg-stone/10" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                    <span className="block font-mono text-xs text-stone">{"$" + product.price.toFixed(2)}{!product.active && <span className="ml-2 text-clay">inactive</span>}</span>
                  </span>
                  <span className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={"Move " + product.name + " up"} className="cursor-pointer rounded p-0.5 text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === picked.length - 1} aria-label={"Move " + product.name + " down"} className="cursor-pointer rounded p-0.5 text-stone transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
                  </span>
                  <button type="button" onClick={() => removeProduct(id)} aria-label={"Remove " + product.name} className="cursor-pointer rounded p-1 text-stone transition hover:text-clay focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="rounded-lg border border-stone/20 p-4">
        <label className={LABEL_CLS}>
          Add product
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={picked.length >= 8 ? "Limit of 8 reached" : "Search products..."} disabled={picked.length >= 8} className={INPUT_CLS} />
        </label>
        {search.trim() && picked.length < 8 && (
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {matches.length === 0 && <li className="text-sm text-stone">No matching products.</li>}
            {matches.map((product) => (
              <li key={product.id}>
                <button type="button" onClick={() => { addProduct(product.id); setSearch(""); }} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-moss/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">
                  {product.image ? <img src={normalizeImageSrc(product.image)} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" /> : <span className="h-9 w-9 shrink-0 rounded-md bg-stone/10" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                    <span className="block font-mono text-xs text-stone">{"$" + product.price.toFixed(2)}{!product.active && <span className="ml-2 text-clay">inactive</span>}</span>
                  </span>
                  <span className="text-xs text-stone">Add</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
