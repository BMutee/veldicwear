# Veldic Wear — Deployment Guide

Your codebase is ready to deploy. This guide covers Netlify and Vercel configurations.

---

## Vercel Deployment

### Option 1: Vercel Dashboard (Recommended)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. Connect to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository (`veldicwear`)
   - Vercel auto-detects Next.js

3. Environment Variables:
   In **Project Settings** → **Environment Variables**, add (from your `.env`):

   ```
   DATABASE_URL
   BETTER_AUTH_SECRET
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_BASE_URL
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
   CJ_API_KEY
   CRON_SECRET
   ADMIN_SECRET
   EMAIL_HOST
   EMAIL_PORT
   EMAIL_USER
   EMAIL_PASS
   EMAIL_FROM
   CONTACT_EMAIL_TO
   DEO_MAIL_API_KEY
   ```

4. Deploy — Vercel will build and deploy automatically.

---

## Netlify Deployment

### Option 1: Git + Netlify UI (Recommended)

1. Push to GitHub
2. Go to https://app.netlify.com → Add new site → Import from GitHub
3. Netlify auto-detects `netlify.toml` (build: `npm run build`, publish: `.next`)
4. Add Environment Variables in Site settings
5. Deploy

### Option 2-3: Netlify CLI or Drag & Drop

See original guide for CLI/drag-drop options.

---

## Environment Variables (Both Platforms)

```
DATABASE_URL              postgresql://neondb_owner:...&pgbouncer=true&connect_timeout=15&pool_timeout=15
BETTER_AUTH_SECRET        ***REMOVED***...
STRIPE_SECRET_KEY         sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_test_...
STRIPE_WEBHOOK_SECRET     whsec_...
NEXT_PUBLIC_BASE_URL      https://veldicwear.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  forveldicwear
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  ForVeldic
CJ_API_KEY                ***REMOVED***...
CRON_SECRET               ***REMOVED***...
ADMIN_SECRET              my-super-secret-key-change-this
# EMAIL (deomail.com API - replaces Gmail SMTP)
DEO_MAIL_API_KEY          ***REMOVED***
EMAIL_HOST                api.doemail.com  # deomail.com API endpoint
EMAIL_PORT                443  # HTTPS port for deomail.com API
EMAIL_USER                Info@veldicwear.com
EMAIL_PASS                # Leave empty - uses API key auth instead
EMAIL_FROM                Info@veldicwear.com
CONTACT_EMAIL_TO          Info@veldicwear.com
# OLD GMAIL (remove/comment out when ready to switch fully):
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=khalildigital.contact@gmail.com
# EMAIL_PASS=***REMOVED***
# EMAIL_FROM="Veldic Wear <khalildigital.contact@gmail.com>"
# CONTACT_EMAIL_TO=khalildigital.contact@gmail.com
```