# Veldic Wear — Design System

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

## Brand identity

Veldic Wear is a premium lifestyle & activewear brand. The name draws on
"veld" (open grassland/terrain) — the brand voice and visuals lean into
terrain, ground, and movement rather than generic gym-culture imagery.

**Tagline:** Wear the Ground You Cover.
**Subhead:** Premium lifestyle & activewear for every journey.

**Tone:** Grounded, confident, unhurried. Not shouty gym-bro energy, not
soft wellness-brand energy. Think rugged-minimalist, closer to Vuori or
Fjällräven than Gymshark.

---

## Color

Tokens live in `globals.css` as CSS custom properties. Never hardcode hex
values in components — reference the variable.

| Token           | Hex       | Role                                              |
| --------------- | --------- | -------------------------------------------------- |
| `--color-bone`   | `#F3F7FC` | Page background (cool airy white)                  |
| `--color-white`  | `#FFFFFF` | Elevated surfaces (blended into glass)              |
| `--color-ink`    | `#1B2737` | Primary text — deep slate-ink                       |
| `--color-moss`   | `#2563EB` | Primary accent — CTAs, active nav state, links (blue)|
| `--color-clay`   | `#C2410C` | Secondary accent — sale tags, highlights (AA on light)|
| `--color-stone`  | `#5B6B85` | Muted text, secondary labels (WCAG AA)              |

**Rules:**
- Moss (blue) is the one accent allowed on primary CTAs. Never put moss and
  clay on the same CTA — clay is for badges/tags only, never buttons.
- Ink is a deep slate, not pure `#000`. Never substitute `#000000`.
- Max one accent-filled button per view. Everything else is outline/ghost.
- Page background is `--color-bone` (#F3F7FC). Cards use the **frosted glass
  surface** (translucent white + backdrop blur) over the body's color glow.

### Legacy palette migration (v2 → v3)

v2 stored earthy hex values directly in section/block rows. The render
parsers remap the exact legacy palette (`#171512`, `#FAFAF8`, `#CA8A04`,
`#CDCCCA`, `#A8A29E`) to the V3 values via `lib/section-shared.ts`
(`migrateSurfaceColor` / `migrateTextColor` / `migrateLinkHoverColor` /
`migrateAccentColor`). Merchant-customized colors are left untouched.

### Glass system

- `body` carries fixed radial color glows (blue / violet / sky).
- `.glass` / `.glass-strong`: translucent white fill + `backdrop-filter:
  blur(16–20px) saturate(1.6)` + 1px white hairline border +
  `--shadow-glass`.
- Navbar/footer: inline `color-mix(... , transparent)` of the stored
  background color + 20–24px blur → admin-chosen tints become glass tints.

### Form input borders (WCAG 1.4.11)

Form inputs use a darker ink-based border (`rgba(27, 39, 55, 0.25)`) set via
a global CSS rule in `globals.css`. Focus state uses `--color-moss`.

---

## Typography

| Role     | Font              | Weight        | Usage                                |
| -------- | ----------------- | ------------- | -------------------------------------- |
| Display  | Space Grotesk     | 600 (semibold)| Headlines, hero copy, section titles   |
| Body     | Inter             | 400 / 500     | Paragraph copy, nav, buttons           |
| Data/UI  | JetBrains Mono    | 400           | Prices, sizes, specs, SKU labels        |

**Scale** (defined as CSS vars in globals.css):
`--text-xs` 12px · `--text-sm` 14px · `--text-base` 16px ·
`--text-lg` 20px · `--text-xl` 28px · `--text-2xl` 40px · `--text-3xl` 56px

Display type is used with restraint — one hero headline, section titles.
Never apply the display face to body paragraphs or long-form copy.

---

## Layout

- Container max-width: 1280px, with 24px gutter on mobile, 64px on desktop.
- Grid: 12-column, `gap: 24px` desktop / `16px` mobile.
- Structural labels use terrain language where it fits a real hierarchy —
  e.g. product tiers as "Low ground / Mid ground / High ground" — never
  numbered 01/02/03 markers unless the content is a genuine sequence.

### Hero signature element

The hero background uses an animated topographic contour-line SVG —
thin elevation-map-style lines that draw in on page load (staggered
`pathLength` animation) and sit subtly behind the headline. This is the
one signature visual moment for the brand. Do not repeat this motif
decoratively elsewhere on the page — it belongs to the hero only, so it
stays meaningful.

---

## Motion (Framer Motion)

Motion tokens (durations/easing) are defined in globals.css and should be
imported into Framer Motion `transition` objects rather than re-declared
per component.

| Token             | Value                         | Usage                          |
| ----------------- | ------------------------------ | -------------------------------- |
| `--dur-fast`      | 150ms                          | Hover states                     |
| `--dur-base`      | 300ms                          | Standard reveals                 |
| `--dur-slow`      | 600ms                          | Hero sequence, page transitions  |
| `--ease-out`      | cubic-bezier(0.16, 1, 0.3, 1)  | Reveals, entrances                |
| `--ease-snap`     | cubic-bezier(0.4, 0, 0.2, 1)   | Hover/press feedback              |

**Patterns:**
- Hero load: contour lines draw in first (staggered 80ms per line), then
  headline fades/slides up 20px, then CTA. One orchestrated sequence.
- Scroll reveals: product cards animate in via `whileInView`, `opacity`
  0→1 + `y` 20px→0, staggered via `staggerChildren: 0.08`.
- Hover: cards scale to 1.02 + border color shifts to moss, 150ms,
  `--ease-snap`. Card hover also elevates `--shadow-card` → `--shadow-card-hover`.
- Do not add motion to every element. The hero contour animation is the
  one "signature" moment; everything else should feel quiet by comparison.

---

## Components

- **Buttons:** outline style by default (1px border, ink text). Primary
  CTA only: moss fill, white text, `--radius-md`, soft blue glow shadow.
- **Cards:** frosted glass (`--glass-bg` + 16px blur + white hairline
  border + `--shadow-glass`), `--radius-lg`. Hover: border → moss, shadow
  deepens, `translateY(-4px)`. Use the `.card` utility class.
- **Nav:** floating glass bar — translucent page color + 20px blur + ink
  text, moss underline on active/hover link state.
- **Badges/tags:** clay background at 12% opacity, clay text, used only
  for sale/new/limited labels — never as a primary color anywhere else.

---

## Voice & copy

- Sentence case always. No title case, no all-caps except tiny eyebrow
  labels where it reads as a design device, not shouting.
- Verb-first CTAs: "Shop new arrivals," "Explore activewear" — not
  "Click here" or "Learn more" alone.
- Copy leans grounded/confident, avoids generic fitness-brand hype words
  ("crush," "beast mode," "no excuses"). Prefer language rooted in
  terrain/movement: "ground," "journey," "terrain," "built for."

---

## Known exceptions

### Auth + account pages (login, register, forgot-password, reset-password,
account, wishlist, checkout, contact)

These pages previously used a separate hex system (`#1C1917`, `#FAFAF9`,
`#CA8A04`). As part of the v3 redesign those hexes were migrated to the V3
palette values (`#1B2737` ink, `#F3F7FC` bone, `#2563EB` accent). They still
write raw hex rather than the CSS tokens.

**Action item:** Convert these pages to token utilities (`text-ink`,
`bg-bone`, `bg-moss`) for a single source of truth the next time they're
touched.

---

## Anti-Patterns (Do NOT Use)

- ❌ Hardcoded hex values in components — always reference CSS variables.
- ❌ Black `#000000` — use ink `#1B2737` for near-black fills/text.
- ❌ Moss + clay on the same CTA. Clay is for badges/tags only.
- ❌ More than one accent-filled button per view.
- ❌ Flat cards without glass depth — use `.card` (frosted glass + shadow).
- ❌ Opaque dark sections (old `bg-ink` blocks) — the V3 look is light glass.
- ❌ Repeating the contour-line motif outside the hero.
- ❌ Gym-bro hype copy ("crush," "beast mode," "no excuses").
- ❌ Title case / all-caps body copy (sentence case only).
- ❌ `01/02/03` numbered labels unless a genuine sequence.
- ❌ Emojis as icons — use SVG icons (Heroicons, Lucide, Simple Icons).
- ❌ Missing `cursor:pointer` on clickable elements.
- ❌ Layout-shifting hovers — avoid transform-only hovers that jump layout.
- ❌ Low-contrast text — maintain 4.5:1 minimum.
- ❌ Low-contrast form input borders — use the global CSS rule, not just
  Tailwind `border-stone/20` (insufficient for WCAG 1.4.11).
- ❌ Instant state changes — use transitions (150–300ms).
- ❌ Invisible focus states.

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No hardcoded hex — CSS variables referenced throughout.
- [ ] No emojis as icons (SVG only)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Cards use `--shadow-card` for depth (not flat on white)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Form input borders meet WCAG 1.4.11 (3:1 non-text contrast)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
- [ ] Display type only on headlines/section titles, not body copy
- [ ] Max one moss-filled button per view
- [ ] Contour-line motif confined to the hero