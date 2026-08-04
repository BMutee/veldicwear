# Veldic Wear — Netlify Deployment Guide

Your codebase is ready to deploy. The `netlify.toml` is already configured correctly.

## Option 1: Git + Netlify UI (Recommended)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Deploy v2 design system + fixes"
git push origin main
```

### Step 2: Connect to Netlify
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → choose `veldicwear` repo
4. Netlify will auto-detect `netlify.toml` (build command: `npm run build`, publish: `.next`)

### Step 3: Add Environment Variables
In **Site settings** → **Environment variables**, add (all from your `.env`):

```
DATABASE_URL              postgresql://neondb_owner:...&pgbouncer=true&connect_timeout=15&pool_timeout=15
BETTER_AUTH_SECRET        5ed3833a91e0a1d0459...
STRIPE_SECRET_KEY         sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_test_...
STRIPE_WEBHOOK_SECRET     whsec_...
NEXT_PUBLIC_BASE_URL      https://veldicwear.com  (⚠️ change from localhost)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  forveldicwear
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  ForVeldic
CJ_API_KEY                CJ5156597@api@...
CRON_SECRET               d78332c15a9aea8...
ADMIN_SECRET              my-super-secret-key-change-this
EMAIL_HOST                smtp.gmail.com
EMAIL_PORT                587
EMAIL_USER                khalildigital.contact@gmail.com
EMAIL_PASS                fahj zhbz lter mqjm
EMAIL_FROM                "Veldic Wear <khalildigital.contact@gmail.com>"
CONTACT_EMAIL_TO          khalildigital.contact@gmail.com
DEO_MAIL_API_KEY          deo_live_...
```

### Step 4: Deploy
Click **"Deploy site"**. Netlify will:
1. Run `npm install`
2. Run `npm run build`
3. Install `@netlify/plugin-nextjs` for SSR/API routes
4. Deploy to `https://[random-name].netlify.app`

### Step 5: Custom Domain
1. **Domain settings** → **Add custom domain** → `veldicwear.com`
2. Update DNS at your registrar:
   - Apex (`veldicwear.com`): `A` record → Netlify load balancer IP
   - `www.veldicwear.com`: `CNAME` → `[your-site].netlify.app`
3. SSL auto-provisioned

### Step 6: Post-Deploy
1. **Run migrations**: `npx prisma migrate deploy` (locally against prod DB, or via Netlify CLI)
2. **Update Stripe webhook**: Change to `https://veldicwear.com/api/webhooks/stripe`
3. **Update CJ webhook**: Change to `https://veldicwear.com/api/webhook/cj`
4. **Test**: Checkout, admin, auth flows in production

---

## Option 2: Netlify CLI (Deploy from local)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize (creates site or connects to existing)
netlify init

# Deploy to production
netlify deploy --prod
```

---

## Option 3: Drag & Drop (Manual)

1. Run `npm run build` locally
2. Go to https://app.netlify.com/drop
3. Drag the `.next` folder
4. Add environment variables in site settings

---

## Auto-Deploy Setup

Once connected to GitHub:
- Every push to `main` → auto-deploy to production
- Every pull request → preview deploy at `https://deploy-preview-[id]--[site].netlify.app`

---

## Troubleshooting

**Build fails with "Module not found"**
- Run `npm install` locally first to verify all dependencies

**Database connection error**
- Verify `DATABASE_URL` includes `pgbouncer=true&connect_timeout=15&pool_timeout=15`
- Neon serverless requires this for connection pooling

**Stripe webhook fails**
- Update webhook URL in Stripe dashboard to production domain
- Verify `STRIPE_WEBHOOK_SECRET` matches the production webhook

**Admin pages show 500 error**
- Run `npx prisma migrate deploy` against production database
- Verify all migrations are applied

---

## What I Cannot Do

I cannot directly deploy to Netlify because:
1. **No authentication** — I don't have access to your Netlify account or GitHub credentials
2. **No interactive UI** — Deployment requires OAuth flow through the Netlify dashboard
3. **Sensitive secrets** — Your `.env` contains production keys that shouldn't be shared

The fastest path is Option 1 (Git + Netlify UI) — should take ~5 minutes:
1. `git push` your code
2. Connect repo in Netlify dashboard
3. Add env vars
4. Click deploy

Once connected, all future deploys are automatic via Git pushes.