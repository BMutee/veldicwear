"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockContent, BlockStyles, BlockType, FeaturedBlockContent, FeaturedBlockStyles, HeroBlockContent, HeroBlockStyles } from "@/lib/block-section";
import { BLOCK_DEFAULT_STYLES, HERO_BLOCK_DEFAULT_STYLES, BANNER_BLOCK_DEFAULT_STYLES, blockTypes, defaultBlockContent } from "@/lib/block-section";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import { BreakpointField, ColorField, INPUT_CLS, LABEL_CLS, AnimationField } from "./AdminSectionShared";
import { FeaturedProductsContentEditor, FeaturedStyleEditor } from "./FeaturedProductsBlockEditors";

export type BlockRow = { id: string; type: BlockType; order: number; content: BlockContent; styles: BlockStyles | HeroBlockStyles | FeaturedBlockStyles };
export const labels: Record<BlockType, string> = { HERO: "Hero", RICH_TEXT: "Rich text", IMAGE: "Image", BUTTON: "Button", IMAGE_TEXT: "Image + text", GALLERY: "Gallery", FEATURED_PRODUCTS: "Featured Products" };

export default function AdminBlocksClient({ slug, sectionKey }: { slug?: string; sectionKey?: string }) {
  // A block is owned by exactly one of: a CMS page (slug) or a SiteSection (sectionKey).
  const apiBase = sectionKey ? `/api/admin/sections/${sectionKey}/blocks` : `/api/admin/cms/pages/${slug}/blocks`;
  const isSection = Boolean(sectionKey);
  const ownerLabel = sectionKey ?? slug;
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [selected, setSelected] = useState<BlockRow | null>(null);
  const [picker, setPicker] = useState(false);
  const [tab, setTab] = useState<"content" | "style">("content");
  const [mode, setMode] = useState<"mobile" | "desktop">("desktop");
  // Bumping this remounts the live preview so entrance animations replay.
  const [previewKey, setPreviewKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    const response = await fetch(apiBase);
    if (response.ok) {
      const nextBlocks = await response.json();
      startTransition(() => setBlocks(nextBlocks));
    }
  }, [apiBase]);
  useEffect(() => { void load(); }, [load]);

  const addBlock = async (type: BlockType) => {
    const styles = type === "HERO" ? HERO_BLOCK_DEFAULT_STYLES : BLOCK_DEFAULT_STYLES;
    const response = await fetch(apiBase, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, content: defaultBlockContent(type), styles }) });
    if (response.ok) { const block = await response.json(); setBlocks((prev) => [...prev, { ...block, content: block.content, styles: block.styles }]); setPicker(false); }
  };

  const saveBlock = async () => {
    if (!selected) return;
    const response = await fetch(apiBase, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(selected) });
    if (!response.ok) { setMessage((await response.json()).error || "Could not save block."); return; }
    const saved = await response.json();
    setBlocks((prev) => prev.map((block) => block.id === saved.id ? { ...block, content: saved.content, styles: saved.styles } : block));
    setSelected(null); setMessage("Block saved.");
  };

  const reorder = async (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const oldIndex = blocks.findIndex((block) => block.id === event.active.id);
    const newIndex = blocks.findIndex((block) => block.id === event.over!.id);
    const next = arrayMove(blocks, oldIndex, newIndex).map((block, index) => ({ ...block, order: index + 1 }));
    setBlocks(next);
    const response = await fetch(apiBase, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: next.map((block) => block.id) }) });
    if (!response.ok) { setMessage("Could not persist block order."); await load(); }
  };

  const deleteBlock = async (block: BlockRow) => {
    if (!window.confirm(`Delete this ${labels[block.type]} block?`)) return;
    const response = await fetch(`${apiBase}/${block.id}`, { method: "DELETE" });
    if (response.ok) { setBlocks((prev) => prev.filter((item) => item.id !== block.id)); if (selected?.id === block.id) setSelected(null); }
  };

  return <main className="min-h-screen bg-white px-6 py-8 text-ink"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-wider text-stone">{isSection ? "Section blocks" : "Page blocks"}</p><h1 className="mt-2 font-display text-3xl font-semibold">/{ownerLabel}</h1><p className="mt-1 text-sm text-stone">{isSection ? "This section owns its block directly; edits apply to the live site." : "Legacy HTML and CTA fields remain independent of these blocks."}</p></div>{!isSection && <button type="button" onClick={() => setPicker(true)} className="cursor-pointer rounded-lg bg-clay px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-clay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">Add block</button>}</div>
    {message && <div role="status" className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{message}</div>}
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)]">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder}><SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="space-y-2">{blocks.map((block) => <SortableBlock key={block.id} block={block} selected={selected?.id === block.id} deletable={!isSection} onSelect={() => { setSelected(block); setTab("content"); }} onDelete={() => void deleteBlock(block)} />)}</div></SortableContext></DndContext>
      <div className="min-h-[420px] rounded-xl border border-stone/20 bg-white p-6 shadow-sm">{selected ? <><div className="flex items-center justify-between border-b border-stone/20 pb-3"><h2 className="font-display text-lg font-semibold">{labels[selected.type]}{isSection && <span className="ml-2 align-middle text-xs font-normal text-stone">{sectionKey === "banner" ? "Banner" : sectionKey === "featured-products" ? "Featured products" : ""}</span>}</h2><div className="flex gap-1 rounded-lg bg-stone/10 p-0.5"><button type="button" onClick={() => setTab("content")} className={`cursor-pointer rounded px-3 py-1 text-xs ${tab === "content" ? "bg-white text-ink shadow-sm" : "text-stone"}`}>Content</button><button type="button" onClick={() => setTab("style")} className={`cursor-pointer rounded px-3 py-1 text-xs ${tab === "style" ? "bg-white text-ink shadow-sm" : "text-stone"}`}>Style</button></div></div>{tab === "content" ? <ContentEditor block={selected} onChange={(content) => setSelected({ ...selected, content })} banner={sectionKey === "banner"} /> : <StyleEditor block={selected} onChange={(styles) => setSelected({ ...selected, styles })} banner={sectionKey === "banner"} />}<button type="button" onClick={() => void saveBlock()} className="mt-6 cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white transition hover:bg-clay-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">Save block</button></> : <p className="text-sm text-stone">Select a block to edit it.</p>}</div>
      <div className="overflow-hidden rounded-xl border border-stone/20 shadow-sm"><div className="flex items-center justify-between border-b border-stone/20 bg-bone px-4 py-2"><span className="text-xs uppercase tracking-wider text-stone">Live preview</span><div className="flex gap-1 rounded bg-stone/10 p-0.5">{(["mobile", "desktop"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`cursor-pointer rounded px-2 py-1 text-xs ${mode === item ? "bg-white text-ink shadow-sm" : "text-stone"}`}>{item}</button>)}</div><button type="button" onClick={() => setPreviewKey((k) => k + 1)} title="Replay entrance animations" className="cursor-pointer rounded px-2 py-1 text-xs text-stone transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40">Replay</button></div><div key={"preview-" + previewKey} className={mode === "mobile" ? "mx-auto max-w-[375px]" : ""}>{blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}</div></div>
    </div>
    {picker && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Add block</h2><button type="button" onClick={() => setPicker(false)} aria-label="Close" className="cursor-pointer text-2xl text-stone hover:text-ink">&times;</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{blockTypes.filter((type) => type !== "FEATURED_PRODUCTS").map((type) => <button key={type} type="button" onClick={() => void addBlock(type)} className="cursor-pointer rounded-lg border border-stone/20 p-4 text-left transition hover:border-moss hover:bg-moss/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/40"><span className="font-display font-semibold">{labels[type]}</span><span className="mt-1 block text-xs text-stone">Add a {labels[type].toLowerCase()} block</span></button>)}</div></div></div>}
  </div></main>;
}

function SortableBlock({ block, selected, deletable, onSelect, onDelete }: { block: BlockRow; selected: boolean; deletable: boolean; onSelect: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 rounded-lg border p-3 ${selected ? "border-moss bg-moss/5" : "border-stone/20 bg-white"}`}><button type="button" {...attributes} {...listeners} aria-label={`Drag ${labels[block.type]}`} className="cursor-grab touch-none text-stone active:cursor-grabbing">&#8942;&#8942;</button><button type="button" onClick={onSelect} className="min-w-0 flex-1 cursor-pointer text-left"><span className="block truncate text-sm font-medium">{labels[block.type]}</span><span className="block text-xs text-stone">Order {block.order}</span></button>{deletable && <button type="button" onClick={onDelete} aria-label={`Delete ${labels[block.type]}`} className="cursor-pointer text-clay hover:text-ink">&times;</button>}</div>;
}

export function ContentEditor({ block, onChange, banner = false }: { block: BlockRow; onChange: (content: BlockContent) => void; banner?: boolean }) {
  const content = block.content as Record<string, unknown>;
  if (block.type === "HERO") return <HeroContentEditor content={content as HeroBlockContent} onChange={onChange} banner={banner} />;
  if (block.type === "FEATURED_PRODUCTS") return <FeaturedProductsContentEditor content={content as FeaturedBlockContent} onChange={onChange} />;
  if (block.type === "RICH_TEXT") return <label className={LABEL_CLS}>HTML body<textarea rows={12} value={String(content.html || "")} onChange={(e) => onChange({ html: e.target.value })} className={INPUT_CLS + " mt-4 resize-y font-mono"} /></label>;
  if (block.type === "BUTTON") return <div className="mt-4 space-y-4"><label className={LABEL_CLS}>Button label<input value={String(content.label || "")} onChange={(e) => onChange({ ...content, label: e.target.value } as BlockContent)} className={INPUT_CLS} /></label><label className={LABEL_CLS}>Button URL<input value={String(content.url || "")} onChange={(e) => onChange({ ...content, url: e.target.value } as BlockContent)} className={INPUT_CLS} /></label><label className={LABEL_CLS}>Variant<select value={String(content.variant || "primary")} onChange={(e) => onChange({ ...content, variant: e.target.value } as BlockContent)} className={INPUT_CLS}><option value="primary">Primary</option><option value="outline">Outline</option></select></label></div>;
  return <label className={LABEL_CLS}>Content JSON<textarea rows={14} value={JSON.stringify(content, null, 2)} onChange={(e) => { try { onChange(JSON.parse(e.target.value) as BlockContent); } catch { /* keep editing until valid JSON */ } }} className={INPUT_CLS + " mt-4 resize-y font-mono"} /></label>;
}

function HeroContentEditor({ content, onChange, banner = false }: { content: HeroBlockContent; onChange: (content: BlockContent) => void; banner?: boolean }) {
  const cta = content.cta;
  const set = (patch: Partial<HeroBlockContent>) => onChange({ ...content, ...patch } as BlockContent);
  return <div className="mt-4 space-y-4">
    <label className={LABEL_CLS}>Headline<textarea rows={2} value={content.heading ?? ""} onChange={(e) => set({ heading: e.target.value })} className={INPUT_CLS} /></label>
    <label className={LABEL_CLS}>Subtext<textarea rows={2} value={content.subtext ?? ""} onChange={(e) => set({ subtext: e.target.value })} className={INPUT_CLS} /></label>
    {!banner && <>
      <label className={LABEL_CLS}>Tagline<input value={content.tagline ?? ""} onChange={(e) => set({ tagline: e.target.value })} className={INPUT_CLS} /></label>
      <div className="rounded-lg border border-stone/20 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone"><input type="checkbox" checked={Boolean(content.backgroundImage)} onChange={(e) => set(e.target.checked ? { backgroundImage: { src: "", alt: "" } } : { backgroundImage: undefined })} className="h-4 w-4 cursor-pointer accent-moss" />Show background image</label>{content.backgroundImage && <div className="mt-3 grid gap-4 sm:grid-cols-2"><label className={LABEL_CLS}>Background image URL<input value={content.backgroundImage.src ?? ""} onChange={(e) => set({ backgroundImage: { src: e.target.value, alt: content.backgroundImage?.alt ?? "" } })} className={INPUT_CLS} /></label><label className={LABEL_CLS}>Image alt text<input value={content.backgroundImage.alt ?? ""} onChange={(e) => set({ backgroundImage: { src: content.backgroundImage?.src ?? "", alt: e.target.value } })} className={INPUT_CLS} /></label></div>}</div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={LABEL_CLS}>Products count<input value={content.trustProductCount ?? ""} onChange={(e) => set({ trustProductCount: e.target.value })} className={INPUT_CLS} /></label>
        <label className={LABEL_CLS}>Members count<input value={content.trustMemberCount ?? ""} onChange={(e) => set({ trustMemberCount: e.target.value })} className={INPUT_CLS} /></label>
        <label className={LABEL_CLS}>Rating<input value={content.trustRating ?? ""} onChange={(e) => set({ trustRating: e.target.value })} className={INPUT_CLS} /></label>
      </div>
    </>}
    <div className="rounded-lg border border-stone/20 p-4"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone"><input type="checkbox" checked={Boolean(cta)} onChange={(e) => set(e.target.checked ? { cta: { label: "", url: "/shop" } } : { cta: undefined })} className="h-4 w-4 cursor-pointer accent-moss" />Show CTA button</label>{cta && <div className="mt-3 grid gap-4 sm:grid-cols-2"><label className={LABEL_CLS}>Button label<input value={cta.label ?? ""} onChange={(e) => set({ cta: { ...cta, label: e.target.value } })} className={INPUT_CLS} /></label><label className={LABEL_CLS}>Button URL<input value={cta.url ?? ""} onChange={(e) => set({ cta: { ...cta, url: e.target.value } })} className={INPUT_CLS} /></label>{banner && <>
      <ColorField label="CTA background color" value={cta.ctaBackgroundColor ?? "#CA8A04"} onChange={(v) => set({ cta: { ...cta, ctaBackgroundColor: v } })} />
      <ColorField label="CTA text color" value={cta.ctaTextColor ?? "#FAFAF8"} onChange={(v) => set({ cta: { ...cta, ctaTextColor: v } })} />
    </>}</div>}</div>
  </div>;
}

export function StyleEditor({ block, onChange, banner = false }: { block: BlockRow; onChange: (styles: BlockStyles | HeroBlockStyles | FeaturedBlockStyles) => void; banner?: boolean }) {
  if (block.type === "HERO") return <HeroStyleEditor styles={block.styles as HeroBlockStyles} onChange={onChange} banner={banner} />;
  if (block.type === "FEATURED_PRODUCTS") return <FeaturedStyleEditor styles={block.styles as FeaturedBlockStyles} onChange={onChange} />;
  const s = block.styles as BlockStyles;
  const update = (key: keyof BlockStyles, value: unknown) => onChange({ ...s, [key]: value } as BlockStyles);
  return <div className="mt-5 space-y-5"><BreakpointField label="Padding top (px)" mobile={s.paddingTop.mobile} desktop={s.paddingTop.desktop} mobileMin={0} desktopMin={0} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingTop", { ...s.paddingTop, mobile: v })} onChangeDesktop={(v) => update("paddingTop", { ...s.paddingTop, desktop: v })} /><BreakpointField label="Padding bottom (px)" mobile={s.paddingBottom.mobile} desktop={s.paddingBottom.desktop} mobileMin={0} desktopMin={0} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingBottom", { ...s.paddingBottom, mobile: v })} onChangeDesktop={(v) => update("paddingBottom", { ...s.paddingBottom, desktop: v })} /><BreakpointField label="Horizontal padding (px)" mobile={s.paddingX.mobile} desktop={s.paddingX.desktop} mobileMin={0} desktopMin={0} mobileMax={200} desktopMax={200} onChangeMobile={(v) => update("paddingX", { ...s.paddingX, mobile: v })} onChangeDesktop={(v) => update("paddingX", { ...s.paddingX, desktop: v })} /><div className="grid gap-4 sm:grid-cols-2"><ColorField label="Background" value={s.backgroundColor} onChange={(v) => update("backgroundColor", v)} /><ColorField label="Text" value={s.textColor} onChange={(v) => update("textColor", v)} /></div><AnimationField value={s.animation} onChange={(animation) => update("animation", animation)} /><button type="button" onClick={() => onChange(BLOCK_DEFAULT_STYLES)} className="cursor-pointer text-sm text-stone underline hover:text-ink">Reset styles</button></div>;
}

function HeroStyleEditor({ styles, onChange, banner = false }: { styles: HeroBlockStyles; onChange: (styles: BlockStyles | HeroBlockStyles) => void; banner?: boolean }) {
  const update = (key: keyof HeroBlockStyles, value: unknown) => onChange({ ...styles, [key]: value } as HeroBlockStyles);
  // Banner rows carry `headingFontSize`; hero rows carry `headlineFontSize`.
  // Show only the key the row actually uses so edits can't bleed across.
  const fontSizeKey: "headlineFontSize" | "headingFontSize" = banner ? "headingFontSize" : "headlineFontSize";
  const fontSizeLabel = banner ? "Heading font size (px)" : "Headline font size (px)";
  const fontSize = styles[fontSizeKey] ?? (banner ? BANNER_BLOCK_DEFAULT_STYLES.headingFontSize! : HERO_BLOCK_DEFAULT_STYLES.headlineFontSize!);
  const resetDefaults = banner ? BANNER_BLOCK_DEFAULT_STYLES : HERO_BLOCK_DEFAULT_STYLES;
  return <div className="mt-5 space-y-5">
    <BreakpointField label={fontSizeLabel} mobile={fontSize.mobile} desktop={fontSize.desktop} mobileMin={16} desktopMin={16} mobileMax={banner ? 40 : 200} desktopMax={banner ? 120 : 200} onChangeMobile={(v) => update(fontSizeKey, { ...fontSize, mobile: v })} onChangeDesktop={(v) => update(fontSizeKey, { ...fontSize, desktop: v })} />
    <BreakpointField label="Padding top (px)" mobile={styles.paddingTop.mobile} desktop={styles.paddingTop.desktop} mobileMin={0} desktopMin={0} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingTop", { ...styles.paddingTop, mobile: v })} onChangeDesktop={(v) => update("paddingTop", { ...styles.paddingTop, desktop: v })} />
    <BreakpointField label="Padding bottom (px)" mobile={styles.paddingBottom.mobile} desktop={styles.paddingBottom.desktop} mobileMin={0} desktopMin={0} mobileMax={400} desktopMax={400} onChangeMobile={(v) => update("paddingBottom", { ...styles.paddingBottom, mobile: v })} onChangeDesktop={(v) => update("paddingBottom", { ...styles.paddingBottom, desktop: v })} />
    <BreakpointField label="Horizontal padding (px)" mobile={styles.paddingX.mobile} desktop={styles.paddingX.desktop} mobileMin={16} desktopMin={16} mobileMax={200} desktopMax={200} onChangeMobile={(v) => update("paddingX", { ...styles.paddingX, mobile: v })} onChangeDesktop={(v) => update("paddingX", { ...styles.paddingX, desktop: v })} />
    <div className="grid gap-4 sm:grid-cols-2"><ColorField label="Background" value={styles.backgroundColor} onChange={(v) => update("backgroundColor", v)} /><ColorField label="Text" value={styles.textColor} onChange={(v) => update("textColor", v)} /></div>
    <AnimationField value={styles.animation} onChange={(a) => update("animation", a)} />
    <button type="button" onClick={() => onChange(resetDefaults)} className="cursor-pointer text-sm text-stone underline hover:text-ink">Reset styles</button>
  </div>;
}

