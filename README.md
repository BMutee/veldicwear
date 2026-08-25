This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Architecture notes

- **Hero content** is a Block of type `HERO` owned by `SiteSection("hero")` via
  `sectionKey` (see `prisma/migrations/20260821130000_migrate_hero_to_block`).
  The live site renders it (`app/page.tsx` → `components/Hero.tsx`), and
  `/admin/homepage` edits it through the section-scoped block editor
  (`app/api/admin/sections/[key]/blocks`).
- **Banner content** is also a Block of type `HERO` owned by
  `SiteSection("banner")` via `sectionKey` (see
  `prisma/migrations/20260821140000_migrate_banner_to_block`) — by design,
  "Banner = Hero without a mandatory background image", so no new block type
  was added. The HERO content schema makes `backgroundImage` optional and the
  HERO CTA carries optional `ctaBackgroundColor`/`ctaTextColor` (banner-only;
  the Hero component never reads them and keeps its fixed `.btn-primary`
  design-system style). The live site renders the banner block
  (`app/page.tsx` → `components/Banner.tsx`), and `/admin/banner` edits it
  through the same section-scoped block editor.
- **FeaturedProducts content** is a Block of type `FEATURED_PRODUCTS` owned by
  `SiteSection("featured-products")` via `sectionKey` (see
  `prisma/migrations/20260821150000_add_featured_products_block` and the
  one-time `scripts/migrate-featured-products-block.ts`). Content is a
  **manually-curated, ordered list of product IDs** (`productIds`, 1–8, order
  = display order) plus the section title/subtitle. The live render
  (`app/page.tsx` → `components/FeaturedProducts.tsx`) queries
  `id in productIds AND active: true`, preserves the array order, and
  silently skips missing/inactive IDs. `/admin/featured-products` edits it via
  the block editor, whose product picker warns about any referenced product
  that is deleted or inactive. The picker's catalog comes from the
  admin-guarded `GET /api/admin/products`.
- **Storefront never shows unpublished products:** every customer-facing
  product query (`/shop`, `/collection`, `/collection/[slug]`,
  `/product/[id]`, search, FeaturedProducts) filters `active: true`. Admin
  product routes intentionally do NOT — admins must see inactive products to
  manage them. Cart pricing/checkout also intentionally don't filter, so
  items already in a cart keep pricing even if a product was deactivated.
- **Multi-currency foundation** (`lib/exchange-rates.ts` + the
  `20260822000000_add_currency_and_exchange_rates` migration): product prices
  stay in USD (base). CAD and EUR prices are DERIVED at render time from the
  `ExchangeRate` table (one row per currency, rate = units per 1 USD,
  `fetchedAt` freshness stamp). `refreshExchangeRates()` pulls live rates from
  the free Frankfurter/ECB API and upserts them — run hourly via
  `GET /api/cron/exchange-rates?secret=CRON_SECRET` (cron-job.org, same
  pattern as the CJ sync crons). `getConversionRate()` NEVER serves a rate
  older than `STALE_RATE_THRESHOLD_MS` (24h): it returns null and the caller
  falls back to USD. Converted prices use the shared `convertPrice()`
  rounding (nearest whole unit of the target currency) everywhere. Orders
  record `currency` (default USD) + `exchangeRateUsed` (the actual rate
  applied at purchase, stored permanently, null for existing orders). No
  picker and no checkout wiring yet — this is infrastructure only.
- **Currency auto-detection + navbar picker** (`proxy.ts`, `lib/currency-map.ts`,
  `components/CurrencyPicker.tsx`, `app/api/currency/route.ts`): on first visit
  Vercel's `x-vercel-ip-country` header maps country → currency (`US→USD`,
  `CA→CAD`, EU→EUR, else USD) and writes a `currency`/`currency_source=ip`
  cookie. A manual pick in the navbar globe writes `currency_source=manual`,
  which **permanently** overrides IP detection — proxy.ts always honours a
  recognised cookie and never re-overrides it. The two origins are kept
  distinct via the cookie. Absent geo (local dev, VPN) → USD fallback. The
  resolved currency + origin are forwarded as `x-viewer-currency(-source)`
  headers to the layout (rendered on `<html data-currency …>`), and the non-USD
  disclaimer prints for any non-USD currency regardless of origin. Detection
  only runs on Vercel (header auto-injected); localhost dev falls back to USD
  unless the header is simulated. Price display still reflects USD.
- The legacy `SiteSection("hero").content` JSON row and the legacy
  `Homepage` model are **deprecated and unused** — left in place but unread,
  retained only for historical data.
- The legacy `SiteSection("banner").content` JSON row and
  `lib/banner-section.ts` are **deprecated and unused** by app code — left in
  place but unread (only `scripts/migrate-banner-breakpoints.ts` still
  references the module), retained for historical data and as a rollback
  record for the banner migration.
- The legacy `SiteSection("featured-products").content` JSON row and
  `lib/featured-section.ts` are **deprecated and unused** by app code — left
  in place but unread (only
  `scripts/migrate-featured-products-block.ts` still references the module),
  retained for historical data and as a rollback record for the featured
  migration.
- Verification caveat (do not overclaim): the banner's "renders identically
  to the legacy strip" check was **data-fidelity + visual-invariant matching**,
  not a true old-vs-new component markup diff — the pre-migration Banner.tsx
  source was not recoverable from git or the transcript. The hero migration
  has the stronger byte-identical SSR-diff proof; the banner does not.
- **Entrance animations:** every section/block owner carries an admin-settable
  `animation` preset (`NONE | FADE | SLIDE_UP | SLIDE_IN` + `scrollTrigger`)
  in its styles schema, rendered through the shared `<Reveal>` component
  (`components/motion/Reveal.tsx`) using CSS transitions and
  IntersectionObserver — no animation library. The hidden initial state is
  pure CSS so SSR and first paint agree (no hydration mismatch, no layout
  shift), and `prefers-reduced-motion: reduce` fully disables all entrance
  animation site-wide via CSS regardless of admin settings. Admin controls
  live in each editor's Style tab plus a Replay button in the block preview.
- Other sections (navbar, footer) still read their `SiteSection` rows
  through their own `lib/*-section.ts` modules and `app/api/admin/*` routes;
  only the hero, banner, and featured-products have been migrated to the
  block system. Do not add new references to the legacy rows; they are safe
  to drop in a future migration.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
