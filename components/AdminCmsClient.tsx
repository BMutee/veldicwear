"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Tabs,
  Textarea,
  Toggle,
} from "@/components/admin-ui/primitives";
import { Modal, ConfirmDialog } from "@/components/admin-ui/Modal";
import { useToast } from "@/components/admin-ui/toast";
import { DataTable, type Column } from "@/components/admin-ui/DataTable";

export default function AdminCmsClient() {
  const [tab, setTab] = useState("pages");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages & Content"
        description="Manage site pages, FAQs, announcements, store settings, and homepage sections."
      />

      <Tabs
        tabs={[
          { id: "pages", label: "Pages" },
          { id: "sections", label: "Sections" },
          { id: "faq", label: "FAQ" },
          { id: "announcements", label: "Announcements" },
          { id: "settings", label: "Settings" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "pages" && <PagesTab />}
      {tab === "sections" && <SectionsTab />}
      {tab === "faq" && <FaqTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

// __PAGES__
type CmsPage = {
  id: string;
  title: string;
  slug: string;
  content: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  published: boolean;
  updatedAt: string;
};

const emptyPageForm = {
  title: "",
  slug: "",
  content: "",
  ctaLabel: "",
  ctaUrl: "",
  seoTitle: "",
  metaDescription: "",
  published: false,
};

function PagesTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPageForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cms/pages")
      .then((r) => r.json())
      .then(setPages)
      .catch(() => {});
  }, []);

  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPageForm);
    setShowForm(true);
  };

  const openEdit = (page: CmsPage) => {
    setEditing(page);
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content,
      ctaLabel: page.ctaLabel || "",
      ctaUrl: page.ctaUrl || "",
      seoTitle: page.seoTitle || "",
      metaDescription: page.metaDescription || "",
      published: page.published,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/cms/pages/${editing.slug}` : "/api/admin/cms/pages";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", (data.details?.[0] as string) || data.error || "Failed to save page.");
        setSaving(false);
        return;
      }
      toast("success", editing ? "Page updated." : "Page created.");
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm(emptyPageForm);
      const list = await fetch("/api/admin/cms/pages").then((r) => r.json());
      setPages(list);
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setSaving(false);
    }
  };

  // __PAGES_PART2__
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/cms/pages/${deleteTarget.slug}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error || "Failed to delete page.");
        setDeleteTarget(null);
        return;
      }
      setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "Page deleted.");
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<CmsPage>[] = [
    {
      key: "title",
      header: "Title",
      render: (p) => <span className="font-medium text-ink">{p.title}</span>,
      sortValue: (p) => p.title,
    },
    {
      key: "slug",
      header: "Slug",
      hideOnMobile: true,
      render: (p) => <code className="text-xs text-stone">/{p.slug}</code>,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={p.published ? "success" : "neutral"}>{p.published ? "Published" : "Draft"}</Badge>,
    },
    {
      key: "updated",
      header: "Updated",
      hideOnMobile: true,
      render: (p) => (
        <span className="text-xs text-stone">
          {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
      sortValue: (p) => new Date(p.updatedAt).getTime(),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(p)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(p)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        rows={pages}
        rowKey={(p) => p.id}
        searchValue={(p) => `${p.title} ${p.slug}`}
        searchPlaceholder="Search pagesâ€¦"
        emptyState="No pages yet."
        toolbar={<Button onClick={openCreate}>+ New Page</Button>}
      />

      {showForm && (
        <Modal
          open
          onClose={() => setShowForm(false)}
          title={editing ? "Edit Page" : "New Page"}
          description="Custom HTML page rendered at /<slug>."
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      title: v,
                      slug: editing ? prev.slug : slugify(v),
                    }))
                  }
                  placeholder="e.g. About Us"
                  required
                />
              </Field>
              <Field label="Slug">
                <Input value={form.slug} onChange={(v) => setForm((prev) => ({ ...prev, slug: v }))} required className="font-mono" />
              </Field>
            </div>

            <Field label="Content (HTML)">
              <Textarea
                value={form.content}
                onChange={(v) => setForm((prev) => ({ ...prev, content: v }))}
                rows={12}
                required
                className="font-mono"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Button text (optional)">
                <Input value={form.ctaLabel} onChange={(v) => setForm((prev) => ({ ...prev, ctaLabel: v }))} placeholder="Shop new arrivals" />
              </Field>
              <Field label="Button link (optional)">
                <Input value={form.ctaUrl} onChange={(v) => setForm((prev) => ({ ...prev, ctaUrl: v }))} placeholder="/shop or https://â€¦" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title">
                <Input value={form.seoTitle} onChange={(v) => setForm((prev) => ({ ...prev, seoTitle: v }))} />
              </Field>
              <Field label="Meta description">
                <Input value={form.metaDescription} onChange={(v) => setForm((prev) => ({ ...prev, metaDescription: v }))} />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={form.published} onChange={(v) => setForm((prev) => ({ ...prev, published: v }))} />
              <span className="text-sm font-medium text-stone">Published</span>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone/20 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save changes" : "Create page"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Page"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}

// __SECTIONS__
type SectionRow = {
  id: string;
  key: string;
  label: string;
  content: string;
  published: boolean;
};

const SECTION_DEFAULTS: Record<string, { label: string; defaultContent: unknown }> = {
  "brand-story": {
    label: "Brand Story",
    defaultContent: {
      badge: "Our Story",
      headline: "BUILT FOR THE\nUNDERGROUND",
      headlineAccent: "UNDERGROUND",
      paragraphs: [
        "Veldic Wear was born from the intersection of street culture, music, and raw self-expression. We don't follow trends â€” we set them.",
        "Every piece is crafted with premium materials, meticulous attention to detail, and a deep respect for the culture that shaped us.",
        "This isn't just clothing. It's a statement. It's an identity. It's the uniform of those who dare to be different.",
      ],
      stats: [
        { value: "2018", label: "Founded" },
        { value: "15+", label: "Drops" },
        { value: "100%", label: "Authentic" },
      ],
      ctaText: "Read Our Story",
      ctaLink: "/about",
      gradientFrom: "from-orange-400",
      gradientTo: "to-orange-600",
      accentColor: "orange",
    },
  },
  lookbook: {
    label: "Lookbook",
    defaultContent: {
      badge: "Lookbook",
      headline: "CURATED LOOKS",
      description: "Pre-styled outfits designed to inspire your next fit.",
      looks: [
        { title: "Urban Edge", description: "Oversized silhouettes meet sharp tailoring", gradient: "from-orange-500/20 via-black to-zinc-900", accent: "bg-orange-500" },
        { title: "Midnight Luxe", description: "Dark tones elevated with premium textures", gradient: "from-zinc-900 via-black to-zinc-800", accent: "bg-zinc-400" },
        { title: "Street Minimal", description: "Clean lines, bold statements, zero compromise", gradient: "from-black via-zinc-900 to-orange-500/10", accent: "bg-orange-500" },
      ],
      ctaText: "View Full Lookbook",
      ctaLink: "/collection",
    },
  },
  newsletter: {
    label: "Newsletter",
    defaultContent: {
      badge: "Stay Connected",
      headline: "NEVER MISS A DROP",
      description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      successMessage: "âœ“ You're in! Welcome to the Veldic community.",
      errorMessage: "Please enter a valid email address.",
      disclaimer: "No spam. Unsubscribe anytime. We respect your inbox.",
    },
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
        { id: 6, label: "EXCLUSIVE", gradient: "from-orange-500/10 to-zinc-900" },
      ],
      ctaLabel: "@veldicwear",
      ctaLink: "https://instagram.com/veldicwear",
    },
  },
  footer: {
    label: "Footer",
    defaultContent: {
      brandDescription: "Performance-driven apparel engineered for the relentless. Train. Dominate. Repeat.",
      shopLinks: [
        { label: "All Products", href: "/shop" },
        { label: "Collections", href: "/collection" },
        { label: "New Arrivals", href: "/shop?category=new-arrivals" },
        { label: "Limited Edition", href: "/shop?category=limited" },
      ],
      supportLinks: [
        { label: "Contact", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "Shipping & Returns", href: "/shipping" },
      ],
      companyLinks: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
      ],
      paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"],
    },
  },
  "categories-header": {
    label: "Categories Section Header",
    defaultContent: {
      badge: "Collections",
      headline: "SHOP BY COLLECTION",
      description: "From statement outerwear to everyday essentials â€” find your look.",
    },
  },
};

// __SECTIONS_PART2__
function SectionsTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: "", label: "", content: "{}", published: true });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/sections")
      .then((r) => r.json())
      .then(setSections)
      .catch(() => {});
  }, []);

  const selectDefault = (key: string) => {
    const def = SECTION_DEFAULTS[key];
    if (def) {
      setForm({ key, label: def.label, content: JSON.stringify(def.defaultContent, null, 2), published: true });
    }
  };

  const openCreate = (key = "", label = "") => {
    setEditing(null);
    if (key && label) selectDefault(key);
    else setForm({ key: "", label: "", content: "{}", published: true });
    setShowForm(true);
  };

  const openEdit = (row: SectionRow) => {
    setEditing(row);
    setForm({ key: row.key, label: row.label, content: row.content, published: row.published });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      JSON.parse(form.content);
    } catch {
      toast("error", "Content must be valid JSON.");
      setSaving(false);
      return;
    }

    const method = editing ? "PUT" : "POST";
    const body = editing
      ? { id: editing.id, key: form.key, label: form.label, content: form.content, published: form.published }
      : { key: form.key, label: form.label, content: form.content, published: form.published };

    try {
      const res = await fetch("/api/admin/sections", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Failed to save.");
        setSaving(false);
        return;
      }
      toast("success", editing ? "Section updated." : "Section created.");
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm({ key: "", label: "", content: "{}", published: true });
      const list = await fetch("/api/admin/sections").then((r) => r.json());
      setSections(list);
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setSaving(false);
    }
  };

  // __SECTIONS_PART3__
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/sections/${deleteTarget.key}`, { method: "DELETE" });
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "Section deleted.");
      router.refresh();
    } catch {
      setSections((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "Section deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SectionRow>[] = [
    {
      key: "key",
      header: "Key",
      render: (s) => <code className="text-xs text-stone">{s.key}</code>,
    },
    {
      key: "label",
      header: "Label",
      render: (s) => <span className="font-medium text-ink">{s.label}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <Badge tone={s.published ? "success" : "neutral"}>{s.published ? "Published" : "Hidden"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEdit(s)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(s)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => openCreate()}>+ New Section</Button>
        <span className="ml-1 self-center text-sm text-stone">Quick-add:</span>
        {Object.entries(SECTION_DEFAULTS).map(([key, def]) => (
          <Button key={key} variant="secondary" size="sm" onClick={() => openCreate(key, def.label)}>
            + {def.label}
          </Button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={sections}
        rowKey={(s) => s.id}
        searchValue={(s) => `${s.key} ${s.label}`}
        searchPlaceholder="Search sectionsâ€¦"
        emptyState="No sections yet. Use the quick-add buttons above to create default sections."
      />

      {showForm && (
        <Modal
          open
          onClose={() => setShowForm(false)}
          title={editing ? "Edit Section" : "New Section"}
          description="Homepage section stored as a JSON content document."
          wide
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Key">
                <Input value={form.key} onChange={(v) => setForm((prev) => ({ ...prev, key: v }))} required className="font-mono" placeholder="e.g. brand-story" />
              </Field>
              <Field label="Label">
                <Input value={form.label} onChange={(v) => setForm((prev) => ({ ...prev, label: v }))} required placeholder="e.g. Brand Story" />
              </Field>
            </div>

            <Field label="Content (JSON)">
              <Textarea
                value={form.content}
                onChange={(v) => setForm((prev) => ({ ...prev, content: v }))}
                rows={16}
                required
                className="font-mono"
              />
            </Field>

            <div className="flex items-center gap-2">
              <Toggle checked={form.published} onChange={(v) => setForm((prev) => ({ ...prev, published: v }))} />
              <span className="text-sm font-medium text-stone">Published</span>
            </div>

            <div className="flex justify-end gap-2 border-t border-stone/20 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create section"}</Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        loading={deleting}
      />
    </div>
  );
}

// __FAQ__
type FaqItem = {
  id: string;
  question: string;
  answer: string;
  published: boolean;
  sortOrder: number;
};

const emptyFaqForm = { question: "", answer: "", published: true, sortOrder: 0 };

function FaqTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyFaqForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cms/faq")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFaqForm);
    setShowForm(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditing(item);
    setForm({ question: item.question, answer: item.answer, published: item.published, sortOrder: item.sortOrder });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editing ? "PUT" : "POST";
      const res = await fetch("/api/admin/cms/faq", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Failed to save FAQ.");
        setSaving(false);
        return;
      }
      toast("success", editing ? "FAQ updated." : "FAQ created.");
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm(emptyFaqForm);
      const list = await fetch("/api/admin/cms/faq").then((r) => r.json());
      setItems(list);
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/admin/cms/faq", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "FAQ deleted.");
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // __FAQ_PART2__
  return (
    <div className="space-y-4">
      <div>
        <Button onClick={openCreate}>+ New FAQ</Button>
      </div>

      {showForm && (
        <Modal
          open
          onClose={() => setShowForm(false)}
          title={editing ? "Edit FAQ" : "New FAQ"}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Question">
              <Input value={form.question} onChange={(v) => setForm((prev) => ({ ...prev, question: v }))} required />
            </Field>
            <Field label="Answer">
              <Textarea value={form.answer} onChange={(v) => setForm((prev) => ({ ...prev, answer: v }))} rows={4} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sort order">
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(v) => setForm((prev) => ({ ...prev, sortOrder: parseInt(v) || 0 }))}
                />
              </Field>
              <div className="flex items-end gap-2 pb-1">
                <Toggle checked={form.published} onChange={(v) => setForm((prev) => ({ ...prev, published: v }))} />
                <span className="text-sm font-medium text-stone">Published</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone/20 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create FAQ"}</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{item.question}</p>
              <p className="mt-1 line-clamp-2 text-xs text-stone">{item.answer}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={item.published ? "success" : "warning"}>{item.published ? "Published" : "Draft"}</Badge>
                {item.sortOrder !== 0 && <span className="text-xs text-stone">Order: {item.sortOrder}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>Delete</Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-stone">No FAQs yet.</p>}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete FAQ"
        message={`Delete "${deleteTarget?.question}"?`}
        loading={deleting}
      />
    </div>
  );
}

// __ANNOUNCEMENTS__
type AnnouncementItem = {
  id: string;
  message: string;
  link: string | null;
  style: string;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
};

const emptyAnnouncementForm = { message: "", link: "", style: "info", active: false, startDate: "", endDate: "" };

function AnnouncementsTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAnnouncementForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cms/announcements")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAnnouncementForm);
    setShowForm(true);
  };

  const openEdit = (item: AnnouncementItem) => {
    setEditing(item);
    setForm({
      message: item.message,
      link: item.link || "",
      style: item.style,
      active: item.active,
      startDate: item.startDate || "",
      endDate: item.endDate || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editing ? "PUT" : "POST";
      const res = await fetch("/api/admin/cms/announcements", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error || "Failed to save announcement.");
        setSaving(false);
        return;
      }
      toast("success", editing ? "Announcement updated." : "Announcement created.");
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setForm(emptyAnnouncementForm);
      const list = await fetch("/api/admin/cms/announcements").then((r) => r.json());
      setItems(list);
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/admin/cms/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setItems((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast("success", "Announcement deleted.");
      router.refresh();
    } catch {
      toast("error", "Network error.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // __ANNOUNCEMENTS_PART2__
  return (
    <div className="space-y-4">
      <div>
        <Button onClick={openCreate}>+ New Announcement</Button>
      </div>

      {showForm && (
        <Modal
          open
          onClose={() => setShowForm(false)}
          title={editing ? "Edit Announcement" : "New Announcement"}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Message">
              <Input value={form.message} onChange={(v) => setForm((prev) => ({ ...prev, message: v }))} required placeholder="e.g. Free shipping over $75" />
            </Field>
            <Field label="Link (optional)">
              <Input value={form.link} onChange={(v) => setForm((prev) => ({ ...prev, link: v }))} placeholder="/shop" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Style">
                <Select
                  value={form.style}
                  onChange={(v) => setForm((prev) => ({ ...prev, style: v }))}
                  options={[
                    { value: "info", label: "Info" },
                    { value: "success", label: "Success" },
                    { value: "warning", label: "Warning" },
                    { value: "accent", label: "Accent" },
                  ]}
                />
              </Field>
              <div className="flex items-end gap-2 pb-1">
                <Toggle checked={form.active} onChange={(v) => setForm((prev) => ({ ...prev, active: v }))} />
                <span className="text-sm font-medium text-stone">Active</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date">
                <Input type="date" value={form.startDate} onChange={(v) => setForm((prev) => ({ ...prev, startDate: v }))} />
              </Field>
              <Field label="End date">
                <Input type="date" value={form.endDate} onChange={(v) => setForm((prev) => ({ ...prev, endDate: v }))} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-stone/20 pt-4">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? "Save changes" : "Create announcement"}</Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="flex items-start justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{item.message}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone">
                <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
                <span>Style: {item.style}</span>
                {item.link && <span>Link: {item.link}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>Delete</Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-stone">No announcements yet.</p>}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete Announcement"
        message={`Delete "${deleteTarget?.message}"?`}
        loading={deleting}
      />
    </div>
  );
}

// __SETTINGS__
const SETTINGS_FIELDS: { key: string; label: string }[] = [
  { key: "storeName", label: "Store name" },
  { key: "logo", label: "Logo URL" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "twitter", label: "Twitter / X URL" },
  { key: "tiktok", label: "TikTok URL" },
  { key: "youtube", label: "YouTube URL" },
];

function SettingsTab() {
  const { toast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setForm(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast("success", "Settings saved.");
      else toast("error", "Failed to save settings.");
    } catch {
      toast("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-6 text-center text-sm text-stone">Loadingâ€¦</p>;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <h3 className="text-base font-semibold text-ink">Store settings</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {SETTINGS_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <Input
                value={form[key] || ""}
                onChange={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
                placeholder={key.includes("URL") || key === "logo" ? "https://â€¦" : undefined}
              />
            </Field>
          ))}
        </div>

        <Field label="Copyright text">
          <Input
            value={form.copyrightText || ""}
            onChange={(v) => setForm((prev) => ({ ...prev, copyrightText: v }))}
            placeholder="All rights reserved."
          />
        </Field>

        <Field label="Footer nav links (JSON)" hint={`e.g. [{"label":"Privacy","href":"/privacy"}]`}>
          <Textarea
            value={form.footerNavLinks || ""}
            onChange={(v) => setForm((prev) => ({ ...prev, footerNavLinks: v }))}
            rows={3}
            className="font-mono"
          />
        </Field>

        <div className="flex justify-end border-t border-stone/20 pt-4">
          <Button type="submit" loading={saving}>Save settings</Button>
        </div>
      </form>
    </Card>
  );
}
