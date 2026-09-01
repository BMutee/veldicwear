"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ttabCls } from "./theme-editor-ui";

function PagesTab() {
  const [pages, setPages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", content: "", ctaLabel: "", ctaUrl: "", seoTitle: "", metaDescription: "", published: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetch("/api/admin/cms/pages").then(r => r.json()).then(setPages).catch(() => {}); }, []);

  return (
    <div className="space-y-4">
      {success && <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      {errors.length > 0 && <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">{errors.map((m, i) => <p key={i} className="text-sm text-red-700">{m}</p>)}</div>}

      <button type="button" onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", slug: "", content: "", ctaLabel: "", ctaUrl: "", seoTitle: "", metaDescription: "", published: false }); setErrors([]); setSuccess(null); }}
        className="cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40">+ New Page</button>

      {showForm && (
        <form onSubmit={async (e) => {
          e.preventDefault(); setSaving(true); setErrors([]); setSuccess(null);
          const method = editing ? "PUT" : "POST";
          const url = editing ? `/api/admin/cms/pages/${editing.slug}` : "/api/admin/cms/pages";
          try {
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) { setErrors(data.details || [data.error]); setSaving(false); return; }
            setSuccess(editing ? "Page updated." : "Page created.");
            setSaving(false); setShowForm(false); setEditing(null); setForm({ title: "", slug: "", content: "", ctaLabel: "", ctaUrl: "", seoTitle: "", metaDescription: "", published: false });
            const list = await fetch("/api/admin/cms/pages").then(r => r.json()); setPages(list); router.refresh();
          } catch { setErrors(["Network error."]); setSaving(false); }
        }} className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-display text-ink">{editing ? "Edit Page" : "New Page"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Title <input required value={form.title} onChange={e => setForm({...form, title: e.target.value, slug: editing ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">Slug <input required value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 font-mono" /></label>
          </div>
          <label className="space-y-1 text-sm font-medium text-stone">Content (HTML) <textarea required rows={12} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 font-mono resize-y" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Button text (optional) <input value={form.ctaLabel} onChange={e => setForm({...form, ctaLabel: e.target.value})} placeholder="Shop new arrivals" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">Button link (optional) <input value={form.ctaUrl} onChange={e => setForm({...form, ctaUrl: e.target.value})} placeholder="/shop or https://example.com" className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">SEO Title <input value={form.seoTitle} onChange={e => setForm({...form, seoTitle: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">Meta Description <input value={form.metaDescription} onChange={e => setForm({...form, metaDescription: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer" /><span className="text-sm font-medium text-stone">Published</span></label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2 text-sm text-stone hover:bg-white">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        {pages.length === 0 ? <p className="px-6 py-8 text-sm text-stone text-center">No pages yet.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-stone/20 bg-white">
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Title</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Slug</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Updated</th>
            <th className="text-right px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Actions</th>
          </tr></thead><tbody className="divide-y divide-[#E2E8F0]">
            {pages.map((p: any) => (
              <tr key={p.id} className="hover:bg-white">
                <td className="px-4 py-3 font-medium text-ink">{p.title}</td>
                <td className="px-4 py-3 text-stone text-xs font-mono">/{p.slug}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.published ? "bg-moss/5 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{p.published ? "Published" : "Draft"}</span></td>
                <td className="px-4 py-3 text-xs text-stone">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditing(p); setShowForm(true); setForm({ title: p.title, slug: p.slug, content: p.content, ctaLabel: p.ctaLabel || "", ctaUrl: p.ctaUrl || "", seoTitle: p.seoTitle || "", metaDescription: p.metaDescription || "", published: p.published }); setErrors([]); setSuccess(null); }}
                    className="cursor-pointer rounded-lg border border-stone/20 px-3 py-1 text-xs font-medium text-stone hover:bg-white">Edit</button>
                  <a href={`/admin/pages/${p.slug}/blocks`} className="cursor-pointer rounded-lg border border-moss/20 px-3 py-1 text-xs font-medium text-moss hover:bg-moss/5">Blocks</a>
                  <button type="button" onClick={async () => { if (!confirm("Delete this page?")) return; await fetch(`/api/admin/cms/pages/${p.slug}`, { method: "DELETE" }); setPages((prev: any[]) => prev.filter((x: any) => x.slug !== p.slug)); }}
                    className="cursor-pointer rounded-lg border border-clay/20 px-3 py-1 text-xs font-medium text-clay hover:bg-clay/5">Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── FAQ ────────────────────────────────────────────
function FaqTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", answer: "", published: true, sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetch("/api/admin/cms/faq").then(r => r.json()).then(setItems).catch(() => {}); }, []);

  return (
    <div className="space-y-4">
      {success && <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      <button type="button" onClick={() => { setShowForm(true); setEditing(null); setForm({ question: "", answer: "", published: true, sortOrder: 0 }); }}
        className="cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-[#B57904]">+ New FAQ</button>

      {showForm && (
        <form onSubmit={async (e) => {
          e.preventDefault(); setSaving(true); setSuccess(null);
          const method = editing ? "PUT" : "POST";
          const body = editing ? { ...form, id: editing.id } : form;
          try {
            const res = await fetch("/api/admin/cms/faq", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) return; setSuccess(editing ? "FAQ updated." : "FAQ created."); setSaving(false);
            setShowForm(false); setEditing(null); setForm({ question: "", answer: "", published: true, sortOrder: 0 });
            const list = await fetch("/api/admin/cms/faq").then(r => r.json()); setItems(list); router.refresh();
          } catch { setSaving(false); }
        }} className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-display text-ink">{editing ? "Edit FAQ" : "New FAQ"}</h3>
          <label className="space-y-1 text-sm font-medium text-stone">Question <input required value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          <label className="space-y-1 text-sm font-medium text-stone">Answer <textarea required rows={4} value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 resize-y" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Sort Order <input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="flex items-center gap-2 cursor-pointer pt-6"><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer" /><span className="text-sm font-medium text-stone">Published</span></label>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-[#B57904] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2 text-sm text-stone hover:bg-white">Cancel</button></div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-lg border border-stone/20 bg-white p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-ink text-sm">{item.question}</p>
              <p className="text-xs text-stone mt-1 line-clamp-2">{item.answer}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-2 ${item.published ? "bg-moss/5 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{item.published ? "Published" : "Draft"}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { setEditing(item); setShowForm(true); setForm({ question: item.question, answer: item.answer, published: item.published, sortOrder: item.sortOrder }); }} className="cursor-pointer text-xs font-medium text-clay hover:underline">Edit</button>
              <button type="button" onClick={async () => { if (!confirm("Delete this FAQ?")) return; await fetch("/api/admin/cms/faq", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }); setItems((p: any[]) => p.filter((x: any) => x.id !== item.id)); }} className="cursor-pointer text-xs font-medium text-clay hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-stone py-4 text-center">No FAQs yet.</p>}
      </div>
    </div>
  );
}

// ─── Announcements ────────────────────────────
function AnnouncementsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ message: "", link: "", style: "info", active: false, startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetch("/api/admin/cms/announcements").then(r => r.json()).then(setItems).catch(() => {}); }, []);

  return (
    <div className="space-y-4">
      {success && <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      <button type="button" onClick={() => { setShowForm(true); setEditing(null); setForm({ message: "", link: "", style: "info", active: false, startDate: "", endDate: "" }); }}
        className="cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-[#B57904]">+ New Announcement</button>

      {showForm && (
        <form onSubmit={async (e) => {
          e.preventDefault(); setSaving(true); setSuccess(null);
          const method = editing ? "PUT" : "POST";
          const body = editing ? { ...form, id: editing.id } : form;
          try {
            const res = await fetch("/api/admin/cms/announcements", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) return; setSuccess(editing ? "Updated." : "Created."); setSaving(false);
            setShowForm(false); setEditing(null); setForm({ message: "", link: "", style: "info", active: false, startDate: "", endDate: "" });
            const list = await fetch("/api/admin/cms/announcements").then(r => r.json()); setItems(list); router.refresh();
          } catch { setSaving(false); }
        }} className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-display text-ink">{editing ? "Edit Announcement" : "New Announcement"}</h3>
          <label className="space-y-1 text-sm font-medium text-stone">Message <input required value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Link (optional) <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">Style <select value={form.style} onChange={e => setForm({...form, style: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"><option value="info">Info</option><option value="warning">Warning</option><option value="promo">Promo</option></select></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Start Date <input type="datetime-local" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">End Date <input type="datetime-local" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer" /><span className="text-sm font-medium text-stone">Active</span></label>
          <div className="flex gap-3"><button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-[#B57904] disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2 text-sm text-stone hover:bg-white">Cancel</button></div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-lg border border-stone/20 bg-white p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-ink text-sm">{item.message}</p>
              <div className="flex gap-2 mt-1 flex-wrap text-xs text-stone">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${item.active ? "bg-moss/5 text-green-700" : "bg-gray-50 text-gray-500"}`}>{item.active ? "Active" : "Inactive"}</span>
                <span>Style: {item.style}</span>
                {item.link && <span>Link: {item.link}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => { setEditing(item); setShowForm(true); setForm({ message: item.message, link: item.link || "", style: item.style, active: item.active, startDate: item.startDate || "", endDate: item.endDate || "" }); }} className="cursor-pointer text-xs font-medium text-clay hover:underline">Edit</button>
              <button type="button" onClick={async () => { if (!confirm("Delete?")) return; await fetch("/api/admin/cms/announcements", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) }); setItems((p: any[]) => p.filter((x: any) => x.id !== item.id)); }} className="cursor-pointer text-xs font-medium text-clay hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-stone py-4 text-center">No announcements yet.</p>}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState<any>({ storeName: "", logo: "", email: "", phone: "", address: "", instagram: "", facebook: "", twitter: "", tiktok: "", youtube: "", copyrightText: "", footerNavLinks: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(data => { setForm(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-stone">Loading...</p>;

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); setSuccess(null); try { const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) setSuccess("Settings saved."); setSaving(false); } catch { setSaving(false); } }}
      className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
      {success && <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      <h3 className="text-lg font-bold font-display text-ink">Store Settings</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {[["storeName","Store Name"],["logo","Logo URL"],["email","Email"],["phone","Phone"],["address","Address"],["instagram","Instagram URL"],["facebook","Facebook URL"],["twitter","Twitter/X URL"],["tiktok","TikTok URL"],["youtube","YouTube URL"]].map(([key, label]) => (
          <label key={key} className="space-y-1 text-sm font-medium text-stone">{label} <input value={form[key] || ""} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
        ))}
      </div>
      <label className="space-y-1 text-sm font-medium text-stone">Copyright Text <input value={form.copyrightText} onChange={e => setForm({...form, copyrightText: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" /></label>
      <label className="space-y-1 text-sm font-medium text-stone">Footer Nav Links (JSON, e.g. &#91;&#123;&quot;label&quot;:&quot;Privacy&quot;,&quot;href&quot;:&quot;/privacy&quot;&#125;&#93;) <textarea value={form.footerNavLinks || ""} onChange={e => setForm({...form, footerNavLinks: e.target.value})} rows={3} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 font-mono" /></label>
      <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-[#B57904] disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
    </form>
  );
}

// ─── Sections ────────────────────────────
const SECTION_DEFAULTS: Record<string, { label: string; defaultContent: any }> = {
  "brand-story": {
    label: "Brand Story",
    defaultContent: {
      badge: "Our Story",
      headline: "BUILT FOR THE\nUNDERGROUND",
      headlineAccent: "UNDERGROUND",
      paragraphs: [
        "Veldic Wear was born from the intersection of street culture, music, and raw self-expression. We don't follow trends — we set them.",
        "Every piece is crafted with premium materials, meticulous attention to detail, and a deep respect for the culture that shaped us. From the block to the stage, our gear is made to move, to stand out, and to last.",
        "This isn't just clothing. It's a statement. It's an identity. It's the uniform of those who dare to be different."
      ],
      stats: [
        { value: "2018", label: "Founded" },
        { value: "15+", label: "Drops" },
        { value: "100%", label: "Authentic" }
      ],
      ctaText: "Read Our Story",
      ctaLink: "/about",
      gradientFrom: "from-orange-400",
      gradientTo: "to-orange-600",
      accentColor: "orange"
    }
  },
  "lookbook": {
    label: "Lookbook",
    defaultContent: {
      badge: "Lookbook",
      headline: "CURATED LOOKS",
      description: "Pre-styled outfits designed to inspire your next fit.",
      looks: [
        { title: "Urban Edge", description: "Oversized silhouettes meet sharp tailoring", gradient: "from-orange-500/20 via-black to-zinc-900", accent: "bg-orange-500" },
        { title: "Midnight Luxe", description: "Dark tones elevated with premium textures", gradient: "from-zinc-900 via-black to-zinc-800", accent: "bg-zinc-400" },
        { title: "Street Minimal", description: "Clean lines, bold statements, zero compromise", gradient: "from-black via-zinc-900 to-orange-500/10", accent: "bg-orange-500" }
      ],
      ctaText: "View Full Lookbook",
      ctaLink: "/collection"
    }
  },
  "newsletter": {
    label: "Newsletter",
    defaultContent: {
      badge: "Stay Connected",
      headline: "NEVER MISS A DROP",
      description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      successMessage: "✓ You're in! Welcome to the Veldic community.",
      errorMessage: "Please enter a valid email address.",
      disclaimer: "No spam. Unsubscribe anytime. We respect your inbox."
    }
  },
  "social-feed": {
    label: "Social Feed",
    defaultContent: {
      badge: "Social",
      headline: "FOLLOW THE MOVEMENT",
      description: "Tag us in your fits for a chance to be featured.",
      posts: [
        { id: 1, label: "@veldicwear", gradient: "from-orange-500/20 to-black" },
        { id: 2, label: "#VELDIC", gradient: "from-zinc-800 to-black" },
        { id: 3, label: "STREET STYLE", gradient: "from-black to-orange-500/10" },
        { id: 4, label: "DROP 015", gradient: "from-zinc-900 to-black" },
        { id: 5, label: "COMMUNITY", gradient: "from-black to-zinc-800" },
        { id: 6, label: "EXCLUSIVE", gradient: "from-orange-500/10 to-zinc-900" }
      ],
      ctaLabel: "@veldicwear",
      ctaLink: "https://instagram.com/veldicwear"
    }
  },
  "footer": {
    label: "Footer",
    defaultContent: {
      brandDescription: "Performance-driven apparel engineered for the relentless. Train. Dominate. Repeat.",
      shopLinks: [
        { label: "All Products", href: "/shop" },
        { label: "Collections", href: "/collection" },
        { label: "New Arrivals", href: "/shop?category=new-arrivals" },
        { label: "Limited Edition", href: "/shop?category=limited" }
      ],
      supportLinks: [
        { label: "Contact", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "Shipping & Returns", href: "/shipping" },
        { label: "Size Guide", href: "/size-guide" }
      ],
      companyLinks: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" }
      ],
      paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"]
    }
  },
  "categories-header": {
    label: "Categories Section Header",
    defaultContent: {
      badge: "Collections",
      headline: "SHOP BY COLLECTION",
      description: "From statement outerwear to everyday essentials — find your look."
    }
  }
};

function SectionsTab() {
  const [sections, setSections] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", label: "", content: "{}", published: true });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => { fetch("/api/admin/sections").then(r => r.json()).then(setSections).catch(() => {}); }, []);

  const selectDefault = (key: string) => {
    const def = SECTION_DEFAULTS[key];
    if (def) {
      setForm({ key, label: def.label, content: JSON.stringify(def.defaultContent, null, 2), published: true });
    }
  };

  return (
    <div className="space-y-4">
      {success && <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss">{success}</div>}
      {errors.length > 0 && <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">{errors.map((m, i) => <p key={i} className="text-sm text-red-700">{m}</p>)}</div>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { setShowForm(true); setEditing(null); setForm({ key: "", label: "", content: "{}", published: true }); setErrors([]); setSuccess(null); }}
          className="cursor-pointer rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40">+ New Section</button>
        <span className="text-sm text-stone self-center ml-2">Quick-add:</span>
        {Object.entries(SECTION_DEFAULTS).map(([key, def]) => (
          <button key={key} type="button" onClick={() => { setShowForm(true); setEditing(null); selectDefault(key); setErrors([]); setSuccess(null); }}
            className="cursor-pointer rounded-lg border border-stone/20 px-3 py-2 text-xs font-medium text-stone hover:bg-white">
            + {def.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={async (e) => {
          e.preventDefault(); setSaving(true); setErrors([]); setSuccess(null);
          const contentToSave = form.content;
          try { JSON.parse(contentToSave); } catch { setErrors(["Content must be valid JSON."]); setSaving(false); return; }
          const method = editing ? "PUT" : "POST";
          const body = editing ? { id: editing.id, key: form.key, label: form.label, content: contentToSave, published: form.published } : { key: form.key, label: form.label, content: contentToSave, published: form.published };
          try {
            const res = await fetch("/api/admin/sections", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) { setErrors([data.error || "Failed to save."]); setSaving(false); return; }
            setSuccess(editing ? "Section updated." : "Section created.");
            setSaving(false); setShowForm(false); setEditing(null); setForm({ key: "", label: "", content: "{}", published: true });
            const list = await fetch("/api/admin/sections").then(r => r.json()); setSections(list); router.refresh();
          } catch { setErrors(["Network error."]); setSaving(false); }
        }} className="rounded-xl border border-stone/20 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold font-display text-ink">{editing ? "Edit Section" : "New Section"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-stone">Key <input required value={form.key} onChange={e => setForm({...form, key: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 font-mono" placeholder="e.g. brand-story" /></label>
            <label className="space-y-1 text-sm font-medium text-stone">Label <input required value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10" placeholder="e.g. Brand Story" /></label>
          </div>
          <label className="space-y-1 text-sm font-medium text-stone">Content (JSON) <textarea required rows={16} value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full rounded-lg border border-stone/20 px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 font-mono resize-y" /></label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="h-4 w-4 rounded border-stone/20 text-clay focus:ring-[#CA8A04]/40 cursor-pointer" /><span className="text-sm font-medium text-stone">Published</span></label>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-clay px-5 py-2 text-sm font-semibold text-white hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="cursor-pointer rounded-lg border border-stone/20 px-4 py-2 text-sm text-stone hover:bg-white">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-stone/20 bg-white shadow-sm">
        {sections.length === 0 ? <p className="px-6 py-8 text-sm text-stone text-center">No sections yet. Use the quick-add buttons above to create default sections.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-stone/20 bg-white">
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Key</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Label</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Updated</th>
            <th className="text-right px-4 py-3 font-semibold text-stone text-xs uppercase tracking-wider">Actions</th>
          </tr></thead><tbody className="divide-y divide-[#E2E8F0]">
            {sections.map((s: any) => (
              <tr key={s.id} className="hover:bg-white">
                <td className="px-4 py-3 font-medium text-ink font-mono text-xs">{s.key}</td>
                <td className="px-4 py-3 text-stone">{s.label}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.published ? "bg-moss/5 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{s.published ? "Published" : "Draft"}</span></td>
                <td className="px-4 py-3 text-xs text-stone">{new Date(s.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditing(s); setShowForm(true); setForm({ key: s.key, label: s.label, content: JSON.stringify(JSON.parse(s.content), null, 2), published: s.published }); setErrors([]); setSuccess(null); }}
                    className="cursor-pointer rounded-lg border border-stone/20 px-3 py-1 text-xs font-medium text-stone hover:bg-white">Edit</button>
                  <button type="button" onClick={async () => { if (!confirm("Delete this section?")) return; await fetch("/api/admin/sections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) }); setSections((prev: any[]) => prev.filter((x: any) => x.id !== s.id)); }}
                    className="cursor-pointer rounded-lg border border-clay/20 px-3 py-1 text-xs font-medium text-clay hover:bg-clay/5">Delete</button>
                </div></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────
export default function AdminCmsClient({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState("pages");
  const tabs = [
    { id: "pages", label: "Pages" },
    { id: "sections", label: "Sections" },
    { id: "faq", label: "FAQ" },
    { id: "announcements", label: "Announcements" },
    { id: "settings", label: "Settings" },
  ];

  if (embedded) {
    // Theme-editor panel: no page header (the panel provides one), editor-style
    // tabs, and a scoped Polaris restyle for the inner forms' inputs/labels/
    // submit buttons. Saves are immediate per action, so no flusher needed.
    return (
      <div className="cms-embedded space-y-4">
        <style>{`
          .cms-embedded input:not([type="checkbox"]):not([type="radio"]),
          .cms-embedded textarea,
          .cms-embedded select {
            width: 100%;
            border-radius: 8px;
            border: 1px solid #c9cccf;
            background: #ffffff;
            padding: 6px 12px;
            font-size: 13px;
            line-height: 1.45;
            color: #303030;
            outline: none;
          }
          .cms-embedded input:not([type="checkbox"]):not([type="radio"]):focus,
          .cms-embedded textarea:focus,
          .cms-embedded select:focus {
            border-color: #005bd3;
            box-shadow: 0 0 0 1px #005bd3;
          }
          .cms-embedded label { font-size: 12px; font-weight: 500; color: #616161; }
          .cms-embedded button[type="submit"] {
            border-radius: 8px;
            background: #303030;
            color: #ffffff;
            font-weight: 500;
            font-size: 13px;
            padding: 6px 14px;
            border: none;
            cursor: pointer;
          }
          .cms-embedded button[type="submit"]:hover { background: #000000; }
          .cms-embedded button[type="submit"]:disabled { opacity: 0.45; cursor: not-allowed; }
          .cms-embedded h3 { font-size: 14px; font-weight: 600; color: #303030; }
          .cms-embedded table { font-size: 13px; }
        `}</style>
        <div className="flex gap-1 border-b border-[#e3e3e3] pb-px" role="tablist" aria-label="Pages and content">
          {tabs.map(t => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={ttabCls(tab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "pages" && <PagesTab />}
        {tab === "sections" && <SectionsTab />}
        {tab === "faq" && <FaqTab />}
        {tab === "announcements" && <AnnouncementsTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-ink">Pages &amp; Content</h1>
        <p className="text-stone mt-1 font-body text-sm">Manage site pages, FAQs, announcements, store settings, and homepage sections.</p>
      </div>
      <div className="flex gap-1 border-b border-stone/20 pb-px">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`cursor-pointer px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px focus:outline-none ${tab === t.id ? "border-clay text-ink" : "border-transparent text-stone hover:text-stone"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "pages" && <PagesTab />}
      {tab === "sections" && <SectionsTab />}
      {tab === "faq" && <FaqTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}