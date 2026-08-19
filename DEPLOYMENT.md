# Veldic Wear — Vercel Deployment Guide

Your codebase is configured to deploy on Vercel (via `vercel.json`). Netlify has been removed.

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
   BETTER_AUTH_URL
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

## Environment Variables (Vercel)

```
DATABASE_URL              postgresql://neondb_owner:...?sslmode=require&uselibpqcompat=true&connect_timeout=60&pool_timeout=60
BETTER_AUTH_SECRET        ***REMOVED***...
BETTER_AUTH_URL           https://veldicwear.com
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