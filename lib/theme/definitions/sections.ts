// ─── Section definitions ({% schema %} equivalent for sections/*.liquid) ────
// Each definition declares: display name (t:), editable settings, which block
// types it accepts (static blocks pre-wired), starter presets, and placement
// restrictions. Definitions are versioned with the codebase and are READ-ONLY
// to the editor — merchants only ever mutate instance documents.
//
// Definition `type` keys match the legacy SiteSection.key values so the
// one-time migration in lib/theme/document.ts carries existing data over.

import type { SectionDef } from "../types";

const SECTION_HEADER_FIELDS = [
  { id: "badge", label: "t:fields.badge", type: "text" as const },
  { id: "headline", label: "t:fields.headline", type: "text" as const },
  { id: "description", label: "t:fields.description", type: "textarea" as const },
];

const CTA_FIELDS = [
  { id: "ctaText", label: "t:fields.cta_label", type: "text" as const },
  { id: "ctaLink", label: "t:fields.cta_link", type: "link" as const, placeholder: "/collection" },
];

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "hero",
    name: "t:sections.hero.name",
    description: "Full-height hero with background image and call to action.",
    locked: true,
    settings: [],
    blocks: [{ type: "_hero-content", max: 1 }],
    presets: [
      {
        name: "Hero",
        blocks: [{ type: "_hero-content", static: true }],
      },
    ],
  },
  {
    type: "banner",
    name: "t:sections.banner.name",
    description: "Slim promo strip for campaigns and offers.",
    locked: true,
    settings: [],
    blocks: [{ type: "_banner-content", max: 1 }],
    presets: [
      {
        name: "Promo banner",
        blocks: [{ type: "_banner-content", static: true }],
      },
    ],
  },
  {
    type: "categories-header",
    name: "t:sections.categories-header.name",
    description: "Shop-by-terrain collection grid. Cards come from your Collections.",
    locked: true,
    settings: SECTION_HEADER_FIELDS,
    blocks: [],
    presets: [
      {
        name: "Categories",
        settings: {
          badge: "Collections",
          headline: "Shop by terrain",
          description: "From low ground to high ground — find your journey.",
        },
      },
    ],
  },
  {
    type: "featured-products",
    name: "t:sections.featured-products.name",
    description: "Pinned products first, auto-filled with newest arrivals (up to 8).",
    locked: true,
    settings: [],
    blocks: [{ type: "_featured-products", max: 1 }],
    presets: [
      {
        name: "Featured products",
        blocks: [{ type: "_featured-products", static: true }],
      },
    ],
  },
  {
    type: "lookbook",
    name: "t:sections.lookbook.name",
    description: "Curated look cards with a call to action.",
    settings: [
      ...SECTION_HEADER_FIELDS,
      {
        id: "looks",
        label: "t:fields.looks",
        type: "repeater",
        item_label: "look",
        add_label: "Add look",
        item_fields: [
          { id: "title", label: "t:fields.look_title", type: "text" },
          { id: "description", label: "t:fields.look_description", type: "text" },
          {
            id: "background",
            label: "t:fields.look_background",
            type: "select",
            options: [
              { value: "bg-stone/10", label: "Stone 10%" },
              { value: "bg-stone/20", label: "Stone 20%" },
              { value: "bg-stone/30", label: "Stone 30%" },
              { value: "bg-moss/10", label: "Moss 10%" },
              { value: "bg-moss/20", label: "Moss 20%" },
            ],
          },
        ],
      },
      ...CTA_FIELDS,
    ],
    blocks: [],
    presets: [
      {
        name: "Lookbook",
        settings: {
          badge: "Lookbook",
          headline: "Curated looks",
          description: "Pre-styled outfits designed to inspire your next journey.",
          looks: [
            { title: "Low Ground", description: "Easy layers for everyday terrain", background: "bg-stone/10" },
            { title: "Mid Ground", description: "Versatile pieces for shifting weather", background: "bg-stone/20" },
            { title: "High Ground", description: "Technical kit for the long way up", background: "bg-stone/30" },
          ],
          ctaText: "View full lookbook",
          ctaLink: "/collection",
        },
      },
    ],
  },
  {
    type: "brand-story",
    name: "t:sections.brand-story.name",
    description: "Dark storytelling section with stats and call to action.",
    settings: [
      { id: "badge", label: "t:fields.badge", type: "text" },
      { id: "headline", label: "t:fields.headline", type: "textarea", info: "Use newlines to break lines. A line exactly matching the accent line highlights in moss." },
      { id: "headlineAccent", label: "t:fields.accent_line", type: "text", info: "Must match one headline line exactly — it renders in moss." },
      {
        id: "paragraphs",
        label: "t:fields.paragraphs",
        type: "repeater",
        item_label: "paragraph",
        add_label: "Add paragraph",
        item_fields: [{ id: "text", label: "t:fields.paragraph_text", type: "textarea" }],
      },
      {
        id: "stats",
        label: "t:fields.stats",
        type: "repeater",
        item_label: "stat",
        add_label: "Add stat",
        item_fields: [
          { id: "value", label: "t:fields.stat_value", type: "text", placeholder: "2018" },
          { id: "label", label: "t:fields.stat_label", type: "text", placeholder: "Founded" },
        ],
      },
      ...CTA_FIELDS,
    ],
    blocks: [],
    presets: [
      {
        name: "Brand story",
        settings: {
          badge: "Our story",
          headline: "Built for the\nground you cover",
          headlineAccent: "ground you cover",
          paragraphs: [
            { text: "Veldic Wear is rooted in the open terrain — the veld, the trail, the long way home. We design for the journey, not the image." },
            { text: "Every piece is cut from premium fabrics, made to move with you and last beyond the season. Built for the ground, not the gym mirror." },
            { text: "This is clothing for people who measure progress in miles and mornings, not hype." },
          ],
          stats: [
            { value: "2018", label: "Founded" },
            { value: "40+", label: "Drops" },
            { value: "100%", label: "Ground-ready" },
          ],
          ctaText: "Read our story",
          ctaLink: "/about",
        },
      },
    ],
  },
  {
    type: "newsletter",
    name: "t:sections.newsletter.name",
    description: "Email signup with custom messaging.",
    settings: [
      ...SECTION_HEADER_FIELDS,
      { id: "placeholder", label: "t:fields.placeholder", type: "text" },
      { id: "buttonText", label: "t:fields.button_text", type: "text" },
      { id: "successMessage", label: "t:fields.success_message", type: "text" },
      { id: "errorMessage", label: "t:fields.error_message", type: "text" },
      { id: "disclaimer", label: "t:fields.disclaimer", type: "text" },
    ],
    blocks: [],
    presets: [
      {
        name: "Newsletter",
        settings: {
          badge: "Stay connected",
          headline: "Never miss a drop",
          description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
          placeholder: "Enter your email",
          buttonText: "Subscribe",
          successMessage: "You're in! Welcome to the Veldic community.",
          errorMessage: "Please enter a valid email address.",
          disclaimer: "No spam. Unsubscribe anytime.",
        },
      },
    ],
  },
  {
    type: "social-feed",
    name: "t:sections.social-feed.name",
    description: "Instagram-style tile grid linking to your profile.",
    settings: [
      ...SECTION_HEADER_FIELDS,
      {
        id: "posts",
        label: "t:fields.posts",
        type: "repeater",
        item_label: "tile",
        add_label: "Add tile",
        max_items: 12,
        item_fields: [
          { id: "label", label: "t:fields.tile_label", type: "text", placeholder: "@veldicwear" },
          {
            id: "gradient",
            label: "t:fields.tile_gradient",
            type: "select",
            options: [
              { value: "from-moss/20 to-violet-100", label: "Blue → Lavender" },
              { value: "from-sky-100 to-moss/10", label: "Sky → Blue" },
              { value: "from-violet-200 to-sky-100", label: "Lavender → Sky" },
              { value: "from-stone/15 to-white", label: "Slate → White" },
              { value: "from-moss/10 to-orange-100", label: "Blue → Peach" },
              { value: "from-orange-100 to-sky-100", label: "Peach → Sky" },
            ],
          },
        ],
      },
      { id: "ctaLabel", label: "t:fields.cta_label", type: "text" },
      { id: "ctaLink", label: "t:fields.cta_link", type: "link", placeholder: "https://instagram.com/veldicwear" },
    ],
    blocks: [],
    presets: [
      {
        name: "Social feed",
        settings: {
          badge: "Social",
          headline: "Follow the journey",
          description: "Tag us in your fits for a chance to be featured.",
          posts: [
            { label: "@veldicwear", gradient: "from-moss/20 to-violet-100" },
            { label: "#VELDIC", gradient: "from-sky-100 to-moss/10" },
            { label: "TRAIL READY", gradient: "from-violet-200 to-sky-100" },
            { label: "DROP 015", gradient: "from-stone/15 to-white" },
            { label: "COMMUNITY", gradient: "from-moss/10 to-orange-100" },
            { label: "EXCLUSIVE", gradient: "from-orange-100 to-sky-100" },
          ],
          ctaLabel: "@veldicwear",
          ctaLink: "https://instagram.com/veldicwear",
        },
      },
    ],
  },
];

/** Registry lookup by section definition type. */
export function getSectionDef(type: string): SectionDef | undefined {
  return SECTION_DEFS.find((section) => section.type === type);
}
