# Site Sections Admin Plan

## Architecture
- New `SiteSection` model stores section content as JSON
- Each section has a unique `key` (e.g., "brand-story", "footer", etc.)
- API routes for admin CRUD and public read
- Section components fetch from public API with inline fallback defaults
- Admin Sections tab in existing CMS page

## Sections to Make Editable
1. **brand-story** - Story text, stats, CTA
2. **lookbook** - Look cards, section header, CTA
3. **newsletter** - Header text, form labels, messages
4. **social-feed** - Posts, section header, CTA
5. **footer** - All links, brand info, social icons, payments, copyright
6. **categories** - Section header text (content is already dynamic from Collections)

## Files to Create/Modify
1. `prisma/schema.prisma` - Add SiteSection model
2. `app/api/admin/sections/route.ts` - Admin CRUD
3. `app/api/admin/sections/[key]/route.ts` - Admin single section
4. `app/api/sections/[key]/route.ts` - Public read
5. `components/AdminCmsClient.tsx` - Add Sections tab
6. `components/BrandStory.tsx` - Fetch from API
7. `components/Lookbook.tsx` - Fetch from API
8. `components/Newsletter.tsx` - Fetch from API
9. `components/SocialFeed.tsx` - Fetch from API
10. `components/Footer.tsx` - Fetch from API
11. `components/Categories.tsx` - Accept content props for header
12. `app/page.tsx` - Pass section data
13. `app/layout.tsx` - Pass footer data
14. `prisma/seed.ts` - Seed default sections