"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
type HomepageData = {
  id: string;
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  heroImage: string;
  heroButtonText: string;
  heroButtonLink: string;
  trustProductCount: string;
  trustMemberCount: string;
  trustRating: string;
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
  updatedAt: Date;
};

type Props = {
  homepage: HomepageData;
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
        if (error) {
          console.error("Cloudinary upload error:", error);
          return;
        }
        if (result?.event === "success" && result?.info?.secure_url) {
          onUpload(result.info.secure_url);
        }
      }
    );
  }, [onUpload]);

  return upload;
}

export default function AdminHomepageClient({ homepage }: Props) {
  const [form, setForm] = useState({
    heroTitle: homepage.heroTitle,
    heroSubtitle: homepage.heroSubtitle,
    heroTagline: homepage.heroTagline,
    heroImage: homepage.heroImage,
    heroButtonText: homepage.heroButtonText,
    heroButtonLink: homepage.heroButtonLink,
    trustProductCount: homepage.trustProductCount,
    trustMemberCount: homepage.trustMemberCount,
    trustRating: homepage.trustRating,
    featuredSectionTitle: homepage.featuredSectionTitle,
    featuredSectionSubtitle: homepage.featuredSectionSubtitle,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleImageUpload = useCallback(
    (url: string) => {
      setForm((prev) => ({ ...prev, heroImage: url }));
    },
    []
  );
  const openImageUpload = useCloudinaryUpload(handleImageUpload);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.details ? data.details : [data.error || "Failed to save."]);
        setSaving(false);
        return;
      }

      setSuccessMsg("Homepage content saved successfully.");
      setSaving(false);
      router.refresh();
    } catch {
      setErrors(["Network error. Please try again."]);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-ink">
          Homepage Content
        </h1>
        <p className="text-stone mt-1 font-body text-sm">
          Edit hero banner, trust markers, and featured section copy.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-moss/20 bg-moss/5 px-4 py-3 text-sm text-moss font-body">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-stone/20 bg-white p-6 shadow-md space-y-6">
        {errors.length > 0 && (
          <div className="rounded-lg border border-clay/20 bg-clay/5 px-4 py-3">
            {errors.map((msg, idx) => (
              <p key={idx} className="text-sm text-red-700 font-body">{msg}</p>
            ))}
          </div>
        )}

        {/* ─── Hero Section ─── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
            Hero Banner
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Tagline <span className="text-xs text-stone">(e.g. "Fall / Winter 2026")</span>
              <input
                value={form.heroTagline}
                onChange={(e) => setForm({ ...form, heroTagline: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>

          <label className="space-y-1.5 text-sm font-medium text-stone font-body">
            Hero Title <span className="text-clay">*</span>
            <span className="text-xs text-stone ml-2">Use /n to split lines (e.g. "FORGE/nYOUR/nEDGE")</span>
            <textarea
              required
              rows={3}
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body resize-y font-display text-xl font-bold"
            />
          </label>

          <label className="space-y-1.5 text-sm font-medium text-stone font-body">
            Hero Subtitle <span className="text-clay">*</span>
            <textarea
              required
              rows={3}
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body resize-y"
            />
          </label>

          {/* Hero Image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone font-body">
              Hero Image <span className="text-clay">*</span>
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <input
                  value={form.heroImage}
                  onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
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
              {form.heroImage && (
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-stone/20 bg-white">
                  <img
                    src={form.heroImage}
                    alt="Hero preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              CTA Button Text <span className="text-clay">*</span>
              <input
                required
                value={form.heroButtonText}
                onChange={(e) => setForm({ ...form, heroButtonText: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              CTA Button Link <span className="text-clay">*</span>
              <input
                required
                value={form.heroButtonLink}
                onChange={(e) => setForm({ ...form, heroButtonLink: e.target.value })}
                placeholder="/shop"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>
        </fieldset>

        {/* ─── Separator ─── */}
        <hr className="border-stone/20" />

        {/* ─── Trust Markers ─── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
            Trust Markers
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Product Count
              <input
                value={form.trustProductCount}
                onChange={(e) => setForm({ ...form, trustProductCount: e.target.value })}
                placeholder="200+"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Member Count
              <input
                value={form.trustMemberCount}
                onChange={(e) => setForm({ ...form, trustMemberCount: e.target.value })}
                placeholder="50K+"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Rating
              <input
                value={form.trustRating}
                onChange={(e) => setForm({ ...form, trustRating: e.target.value })}
                placeholder="4.9"
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>
        </fieldset>

        {/* ─── Separator ─── */}
        <hr className="border-stone/20" />

        {/* ─── Featured Section ─── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-ink font-display uppercase tracking-wide">
            Featured Products Section
          </legend>
          <p className="text-xs text-stone font-body -mt-2">
            To feature products, toggle the &ldquo;Featured&rdquo; badge on individual products in the{" "}
            <a href="/admin/products" className="text-clay underline">Products page</a>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Section Title
              <input
                value={form.featuredSectionTitle}
                onChange={(e) => setForm({ ...form, featuredSectionTitle: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-stone font-body">
              Section Subtitle
              <input
                value={form.featuredSectionSubtitle}
                onChange={(e) => setForm({ ...form, featuredSectionSubtitle: e.target.value })}
                className="w-full rounded-lg border border-stone/20 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition font-body"
              />
            </label>
          </div>
        </fieldset>

        {/* ─── Actions ─── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone/20">
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-clay px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B57904] focus:outline-none focus:ring-2 focus:ring-[#CA8A04]/40 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}