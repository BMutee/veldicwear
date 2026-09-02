// ─── Localization (locales/<lang>.schema.json equivalent) ───────────────────
// Schema definitions never hardcode display text: labels reference dictionary
// keys through the `t:` indirection prefix, resolved at render time. Adding a
// language = adding a dictionary, not touching any schema.

type Dict = Record<string, string>;

const en: Dict = {
  // Section names
  "sections.hero.name": "Hero",
  "sections.banner.name": "Promo banner",
  "sections.categories-header.name": "Categories",
  "sections.featured-products.name": "Featured products",
  "sections.lookbook.name": "Lookbook",
  "sections.brand-story.name": "Brand story",
  "sections.newsletter.name": "Newsletter",
  "sections.social-feed.name": "Social feed",

  // Static (private) block names
  "blocks._hero-content.name": "Hero content",
  "blocks._banner-content.name": "Banner content",
  "blocks._featured-products.name": "Featured products picker",

  // Shared field labels
  "fields.group_content": "Content",
  "fields.group_style": "Style",
  "fields.group_motion": "Motion",
  "fields.badge": "Eyebrow badge",
  "fields.headline": "Headline",
  "fields.description": "Description",
  "fields.cta_label": "Button label",
  "fields.cta_link": "Button link",
  "fields.heading": "Heading",
  "fields.subtext": "Subtext",
  "fields.tagline": "Tagline",
  "fields.background_image": "Background image",
  "fields.background_image_alt": "Background image alt text",
  "fields.cta_background_color": "Button background",
  "fields.cta_text_color": "Button text color",
  "fields.trust_products": "Trust badge — products",
  "fields.trust_members": "Trust badge — members",
  "fields.trust_rating": "Trust badge — rating",
  "fields.padding_top": "Padding top",
  "fields.padding_bottom": "Padding bottom",
  "fields.padding_x": "Padding sides",
  "fields.headline_font_size": "Headline size",
  "fields.heading_font_size": "Heading size",
  "fields.background_color": "Background color",
  "fields.text_color": "Text color",
  "fields.animation": "Animation",
  "fields.animation_scroll_trigger": "Animate on scroll",
  "fields.product_ids": "Products",
  "fields.section_title": "Section title",
  "fields.section_subtitle": "Section subtitle",
  "fields.looks": "Looks",
  "fields.look_title": "Title",
  "fields.look_description": "Description",
  "fields.look_background": "Card background",
  "fields.accent_line": "Accent line",
  "fields.paragraphs": "Paragraphs",
  "fields.paragraph_text": "Text",
  "fields.stats": "Stats",
  "fields.stat_value": "Value",
  "fields.stat_label": "Label",
  "fields.placeholder": "Input placeholder",
  "fields.button_text": "Button text",
  "fields.success_message": "Success message",
  "fields.error_message": "Error message",
  "fields.disclaimer": "Disclaimer",
  "fields.posts": "Tiles",
  "fields.tile_label": "Label",
  "fields.tile_gradient": "Tile gradient",

  // Global theme settings
  "settings.groups.brand": "Brand",
  "settings.groups.contact": "Contact",
  "settings.groups.social": "Social links",
  "settings.groups.footer": "Footer",
  "settings.store_name": "Store name",
  "settings.logo": "Logo",
  "settings.currency": "Currency",
  "settings.currency_symbol": "Currency symbol",
  "settings.email": "Email",
  "settings.phone": "Phone",
  "settings.address": "Address",
  "settings.copyright": "Copyright text",

  // Editor chrome
  "editor.theme_settings": "Theme settings",
  "editor.site_chrome": "Site chrome",
  "editor.sections": "Homepage sections",
  "editor.add_section": "Add section",
  "editor.hidden": "Hidden",
  "editor.static_block": "Locked",
};

/** Resolve a `t:` reference (or passthrough plain text) to display text. */
export function t(key: string | undefined | null): string {
  if (!key) return "";
  if (!key.startsWith("t:")) return key;
  const id = key.slice(2);
  return en[id] ?? humanize(id);
}

/** "sections.hero.name" → "Hero name"-style fallback so typos stay readable. */
function humanize(id: string): string {
  const last = id.split(".").pop() ?? id;
  return last.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
