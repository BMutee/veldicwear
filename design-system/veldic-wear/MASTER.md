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
| `--color-ink`    | `#171512` | Primary text, nav background, footer               |
| `--color-bone`   | `#FAFAF8` | Page background (near-white)                        |
| `--color-white`  | `#FFFFFF` | Card surfaces, product tiles, form inputs           |
| `--color-moss`   | `#455A38` | Primary accent — CTAs, active nav state, links      |
| `--color-clay`   | `#B5602E` | Secondary accent — sale tags, highlights (sparingly)|
| `--color-stone`  | `#8C8677` | Muted text, dividers, secondary labels              |

**Rules:**
- Moss is the one accent allowed on primary CTAs. Never put moss and clay
  on the same CTA — clay is for badges/tags only, never buttons.
- Ink is a warm near-black, not pure `#000`. Never substitute `#000000`.
- Max one accent-filled button per view. Everything else is outline/ghost.
- Page background is `--color-bone` (#FAFAF8, near-white). Card surfaces
  use `--color-white` (#FFFFFF) with `--shadow-card` for depth separation.

### Form input borders (WCAG 1.4.11)

Form inputs (`input`, `textarea`, `select`) use a darker, ink-based border
(`rgba(23, 21, 18, 0.25)`) set via a global CSS rule in `globals.css`.
This overrides the lighter Tailwind `border-stone/20` class to meet the
3:1 non-text contrast minimum. Focus state uses `--color-moss`.

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
  CTA only: moss fill, white text, `--radius-md`, no shadow.
- **Cards:** white background (`--color-white`), 1px stone/8% border,
  `--radius-lg`, `--shadow-card` for depth. Hover: border → moss,
  shadow elevates, scale 1.02. Use the `.card` utility class.
- **Nav:** ink background, bone text, moss underline on active/hover
  link state.
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

### Auth pages (login, register, forgot-password, reset-password)

These pages use a **separate hex-based styling system** (e.g. `border-[#1C1917]/20`,
`bg-white`, `text-[#1C1917]`) instead of the design token system (`border-stone/20`,
`bg-white`, `text-ink`). The hex values are close but not identical:
- Auth uses `#1C1917` vs token `--color-ink: #171512` (both near-black, ~0.3% difference)

**Action item:** Migrate auth pages onto the token system next time that code
is touched. Until then, a future rebrand or color tweak will silently miss
these four pages.

---

## Anti-Patterns (Do NOT Use)

- ❌ Hardcoded hex values in components — always reference CSS variables.
- ❌ Black `#000000` — use ink `#171512` for near-black fills/text.
- ❌ Moss + clay on the same CTA. Clay is for badges/tags only.
- ❌ More than one accent-filled button per view.
- ❌ Flat cards without shadow — use `--shadow-card` for depth on white.
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