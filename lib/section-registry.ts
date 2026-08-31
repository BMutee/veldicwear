// ─── Section Registry ────────────────────────────────────────────────────────
// The Shopify Horizon theme defines every section's editable settings in a
// {% schema %} tag, and the theme editor auto-generates form controls from
// that declaration — store owners never touch code. This registry applies the
// same logic to Veldic Wear: each homepage SiteSection declares its settings
// fields here, and /admin/editor renders friendly forms (with autosave) from
// this data. Adding a field here instantly adds the control to the editor.

export type SectionFieldType =
  | "text"
  | "textarea"
  | "color"
  | "number"
  | "toggle"
  | "link"
  | "select"
  | "repeater";

export type SectionFieldDef = {
  key: string;
  label: string;
  type: SectionFieldType;
  placeholder?: string;
  help?: string;
  /** number */
  min?: number;
  max?: number;
  step?: number;
  /** select */
  options?: { value: string; label: string }[];
  /** repeater */
  itemFields?: SectionFieldDef[];
  itemLabel?: string;
  addLabel?: string;
};

export type SectionDef = {
  /** SiteSection.key */
  key: string;
  /** Editor + sidebar display name */
  name: string;
  description?: string;
  /**
   * "json"   — content lives in SiteSection.content and is edited with the
   *            auto-generated settings form.
   * "blocks" — content lives in the Block model (hero, banner,
   *            featured-products); the editor embeds the block editor.
   */
  kind: "json" | "blocks";
  /** Default position for ensure-defaults backfill (spaced by 10) */
  position: number;
  /** Whether the section can be removed from the homepage (false = core) */
  deletable: boolean;
  fields: SectionFieldDef[];
  defaultContent: Record<string, unknown>;
};

const CTA_FIELD = (labelText = "Button label"): SectionFieldDef[] => [
  { key: "ctaText", label: labelText, type: "text" },
  { key: "ctaLink", label: "Button link", type: "link", placeholder: "/collection" },
];

const SECTION_HEADER_FIELDS: SectionFieldDef[] = [
  { key: "badge", label: "Eyebrow badge", type: "text" },
  { key: "headline", label: "Headline", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
];

export const SECTION_REGISTRY: SectionDef[] = [
  {
    key: "hero",
    name: "Hero",
    description: "Full-height hero with background image and call to action.",
    kind: "blocks",
    position: 10,
    deletable: false,
    fields: [],
    defaultContent: {},
  },
  {
    key: "banner",
    name: "Promo banner",
    description: "Slim promo strip for campaigns and offers.",
    kind: "blocks",
    position: 20,
    deletable: false,
    fields: [],
    defaultContent: {},
  },
  {
    key: "categories-header",
    name: "Categories",
    description: "Shop-by-terrain collection grid. Cards come from your Collections.",
    kind: "json",
    position: 30,
    deletable: false,
    fields: SECTION_HEADER_FIELDS,
    defaultContent: {
      badge: "Collections",
      headline: "Shop by terrain",
      description: "From low ground to high ground — find your journey.",
    },
  },
  {
    key: "featured-products",
    name: "Featured products",
    description: "Hand-picked product grid (up to 8 products).",
    kind: "blocks",
    position: 40,
    deletable: false,
    fields: [],
    defaultContent: {},
  },
  {
    key: "lookbook",
    name: "Lookbook",
    description: "Curated look cards with a call to action.",
    kind: "json",
    position: 50,
    deletable: true,
    fields: [
      ...SECTION_HEADER_FIELDS,
      {
        key: "looks",
        label: "Looks",
        type: "repeater",
        itemLabel: "look",
        addLabel: "Add look",
        itemFields: [
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "text" },
          {
            key: "background",
            label: "Card background",
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
      ...CTA_FIELD("CTA label"),
    ],
    defaultContent: {
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
  {
    key: "brand-story",
    name: "Brand story",
    description: "Dark storytelling section with stats and call to action.",
    kind: "json",
    position: 60,
    deletable: true,
    fields: [
      { key: "badge", label: "Eyebrow badge", type: "text" },
      { key: "headline", label: "Headline", type: "textarea", help: "Use newlines to break lines. A line exactly matching the accent line highlights in moss." },
      { key: "headlineAccent", label: "Accent line", type: "text", help: "Must match one headline line exactly — it renders in moss." },
      {
        key: "paragraphs",
        label: "Paragraphs",
        type: "repeater",
        itemLabel: "paragraph",
        addLabel: "Add paragraph",
        itemFields: [{ key: "text", label: "Text", type: "textarea" }],
      },
      {
        key: "stats",
        label: "Stats",
        type: "repeater",
        itemLabel: "stat",
        addLabel: "Add stat",
        itemFields: [
          { key: "value", label: "Value", type: "text", placeholder: "2018" },
          { key: "label", label: "Label", type: "text", placeholder: "Founded" },
        ],
      },
      ...CTA_FIELD("CTA label"),
    ],
    defaultContent: {
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
  {
    key: "newsletter",
    name: "Newsletter",
    description: "Email signup with custom messaging.",
    kind: "json",
    position: 70,
    deletable: true,
    fields: [
      { key: "badge", label: "Eyebrow badge", type: "text" },
      { key: "headline", label: "Headline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "placeholder", label: "Input placeholder", type: "text" },
      { key: "buttonText", label: "Button label", type: "text" },
      { key: "successMessage", label: "Success message", type: "text" },
      { key: "errorMessage", label: "Error message", type: "text" },
      { key: "disclaimer", label: "Disclaimer", type: "text" },
    ],
    defaultContent: {
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
  {
    key: "social-feed",
    name: "Social feed",
    description: "Instagram-style tile grid linking to your profile.",
    kind: "json",
    position: 80,
    deletable: true,
    fields: [
      ...SECTION_HEADER_FIELDS,
      {
        key: "posts",
        label: "Tiles",
        type: "repeater",
        itemLabel: "tile",
        addLabel: "Add tile",
        itemFields: [
          { key: "label", label: "Label", type: "text", placeholder: "@veldicwear" },
          {
            key: "gradient",
            label: "Tile gradient",
            type: "select",
            options: [
              { value: "from-moss/20 to-ink", label: "Moss → Ink" },
              { value: "from-stone/30 to-ink", label: "Stone → Ink" },
              { value: "from-ink to-moss/10", label: "Ink → Moss" },
              { value: "from-stone/20 to-ink", label: "Faded stone" },
              { value: "from-ink to-stone/30", label: "Ink → Stone" },
              { value: "from-moss/10 to-stone/20", label: "Moss → Stone" },
            ],
          },
        ],
      },
      { key: "ctaLabel", label: "CTA label", type: "text" },
      { key: "ctaLink", label: "CTA link", type: "link", placeholder: "https://instagram.com/veldicwear" },
    ],
    defaultContent: {
      badge: "Social",
      headline: "Follow the journey",
      description: "Tag us in your fits for a chance to be featured.",
      posts: [
        { label: "@veldicwear", gradient: "from-moss/20 to-ink" },
        { label: "#VELDIC", gradient: "from-stone/30 to-ink" },
        { label: "TRAIL READY", gradient: "from-ink to-moss/10" },
        { label: "DROP 015", gradient: "from-stone/20 to-ink" },
        { label: "COMMUNITY", gradient: "from-ink to-stone/30" },
        { label: "EXCLUSIVE", gradient: "from-moss/10 to-stone/20" },
      ],
      ctaLabel: "@veldicwear",
      ctaLink: "https://instagram.com/veldicwear",
    },
  },
];

/** Registry lookup by SiteSection.key */
export function getSectionDef(key: string): SectionDef | undefined {
  return SECTION_REGISTRY.find((section) => section.key === key);
}

/**
 * Homepage render order (Shopify JSON-template logic): the ordered list of
 * section keys. Used both as the backfill default and as the homepage's
 * fallback when the DB is unreachable.
 */
export const DEFAULT_HOME_ORDER: string[] = SECTION_REGISTRY.map((s) => s.key);
