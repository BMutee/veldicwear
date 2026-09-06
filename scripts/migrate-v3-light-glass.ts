// =============================================================================
// V3 "Light-Modern / Glass" theme migration — persists the new palette into
// stored Section/Block style rows so the theme editor and every renderer see
// the new design (the render-time migration in lib/section-shared.ts is the
// defense-in-depth layer; this makes the stored data itself match).
//
// SAFETY: only rewrites a field when the stored value is one of the known v2
// legacy palette hexes (or an old dark social gradient) — merchant-customized
// colors/gradients are left untouched. Idempotent: re-running is a no-op.
// =============================================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// NOTE: sets are LOWERCASE — the map functions lowercase their input before
// membership checks (hex digits are case-insensitive, letters are not).
const LEGACY_INK = new Set(["#171512", "#1c1917"]);
const LEGACY_BONE = new Set(["#fafaf8", "#fafaf9"]);
const LEGACY_MUTED = new Set(["#cdccca", "#a8a29e"]);
const LEGACY_AMBER = new Set(["#ca8a04"]);
const V3 = {
  surface: "#F3F7FC",
  text: "#1B2737",
  accent: "#2563EB",
  muted: "#5B6B85",
  white: "#FFFFFF",
};
const LEGACY_POST_GRADIENTS: Record<string, string> = {
  "from-orange-500/20 to-black": "from-moss/20 to-violet-100",
  "from-zinc-800 to-black": "from-sky-100 to-moss/10",
  "from-ink to-moss/10": "from-violet-200 to-sky-100",
  "from-stone/20 to-ink": "from-stone/15 to-white",
  "from-ink to-stone/30": "from-moss/10 to-orange-100",
  "from-moss/10 to-stone/20": "from-orange-100 to-sky-100",
  "from-moss/20 to-ink": "from-moss/20 to-violet-100",
  "from-stone/30 to-ink": "from-sky-100 to-moss/10",
};

function mapSurface(v: unknown): unknown {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (LEGACY_INK.has(s) || LEGACY_BONE.has(s)) return V3.surface;
  return v;
}
function mapText(v: unknown): unknown {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (LEGACY_INK.has(s) || LEGACY_BONE.has(s)) return V3.text;
  if (LEGACY_MUTED.has(s)) return V3.muted;
  return v;
}
function mapHover(v: unknown): unknown {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (LEGACY_INK.has(s) || LEGACY_BONE.has(s) || LEGACY_MUTED.has(s)) return V3.accent;
  return v;
}
function mapAccent(v: unknown): unknown {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (LEGACY_AMBER.has(s)) return V3.accent;
  if (LEGACY_BONE.has(s)) return V3.white;
  return v;
}
function mapGradient(v: unknown): unknown {
  if (typeof v !== "string") return v;
  return LEGACY_POST_GRADIENTS[v] ?? v;
}

/** Mutate a JSON style object in place with the role-aware mappers. */
function migrateSectionRow(styles: Record<string, unknown> | null): boolean {
  if (!styles || typeof styles !== "object") return false;
  let changed = false;
  const map = [
    ["backgroundColor", mapSurface],
    ["textColor", mapText],
    ["linkColor", mapText],
    ["linkHoverColor", mapHover],
    ["ctaBackgroundColor", mapAccent],
    ["ctaTextColor", mapAccent],
  ] as const;
  for (const [key, fn] of map) {
    if (key in styles) {
      const next = (fn as (v: unknown) => unknown)(styles[key]);
      if (String(next) !== String(styles[key])) {
        styles[key] = next;
        changed = true;
      }
    }
  }
  return changed;
}
function migrateCtaAndPosts(content: Record<string, unknown> | null, social: boolean): boolean {
  if (!content || typeof content !== "object") return false;
  let changed = false;
  // Banner CTA colors live on content.cta for block rows.
  const cta = content.cta;
  if (cta && typeof cta === "object") {
    const ctaObj = cta as Record<string, unknown>;
    for (const key of ["ctaBackgroundColor", "ctaTextColor"] as const) {
      if (key in ctaObj) {
        const n = mapAccent(ctaObj[key]);
        if (String(n) !== String(ctaObj[key])) {
          ctaObj[key] = n;
          changed = true;
        }
      }
    }
  }
  // Social feed tile gradients.
  if (social && Array.isArray(content.posts)) {
    for (const post of content.posts as Record<string, unknown>[]) {
      if (post && typeof post === "object" && "gradient" in post) {
        const n = mapGradient(post.gradient);
        if (String(n) !== String(post.gradient)) {
          post.gradient = n;
          changed = true;
        }
      }
    }
  }
  return changed;
}

async function main() {
  // ── SiteSection rows ────────────────────────────────────────────────────────
  const sections = await prisma.siteSection.findMany({
    where: { key: { in: ["navbar", "hero", "banner", "featured-products", "footer", "social-feed"] } },
  });
  for (const section of sections) {
    const raw = section.content ? (JSON.parse(String(section.content)) as Record<string, unknown>) : null;
    if (!raw || typeof raw !== "object") continue;
    const styles = (raw.styles && typeof raw.styles === "object") ? raw.styles as Record<string, unknown> : null;
    let changed = migrateSectionRow(styles);
    if (section.key === "social-feed") changed = migrateCtaAndPosts(raw, true) || changed;
    if (changed) {
      await prisma.siteSection.update({ where: { id: section.id }, data: { content: JSON.stringify(raw) } });
      console.log("  updated section:", section.key);
    }
  }

  // ── Block rows ──────────────────────────────────────────────────────────────
  const blocks = await prisma.block.findMany({ where: { type: { in: ["HERO", "FEATURED_PRODUCTS"] } } });
  for (const block of blocks) {
    const styles = (block.styles && typeof block.styles === "object") ? block.styles as Record<string, unknown> : null;
    let changed = migrateSectionRow(styles);
    const content = (block.content && typeof block.content === "object") ? block.content as Record<string, unknown> : null;
    if (block.sectionKey === "banner") changed = migrateCtaAndPosts(content, false) || changed;
    if (changed) {
      const data: Record<string, object> = {};
      if (styles) data.styles = styles;
      if (content) data.content = content;
      await prisma.block.update({ where: { id: block.id }, data });
      console.log("  updated block:", block.sectionKey, block.type);
    }
  }

  console.log("V3 light-glass theme migration complete.");
}

main()
  .finally(() => prisma.$disconnect())
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  });