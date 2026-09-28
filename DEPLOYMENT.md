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
   SUPPORT_EMAIL
   DEO_MAIL_API_KEY
   ```

4. Deploy — Vercel will build and deploy automatically.

---

## Environment Variables (Vercel)

```
DATABASE_URL              postgresql://neondb_owner:...?sslmode=verify-full&uselibpqcompat=true&connect_timeout=60&pool_timeout=60
BETTER_AUTH_SECRET        <REDACTED - set in Vercel, never commit>
BETTER_AUTH_URL           https://veldicwear.com
STRIPE_SECRET_KEY         sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  pk_test_...
STRIPE_WEBHOOK_SECRET     whsec_...
NEXT_PUBLIC_BASE_URL      https://veldicwear.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME  forveldicwear
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  ForVeldic
CJ_API_KEY                <REDACTED - set in Vercel, never commit>
CRON_SECRET               <REDACTED - set in Vercel, never commit>
ADMIN_SECRET              my-super-secret-key-change-this
# EMAIL (deomail.com API)
# EMAIL_FROM is the SENDING identity — it must stay a domain deomail has
# authorized or every send fails. The inboxes below are where customer mail is
# DELIVERED; changing those does not require re-authorizing the sender.
DEO_MAIL_API_KEY          <REDACTED - set in Vercel, never commit>
EMAIL_HOST                api.doemail.com  # deomail.com API endpoint
EMAIL_PORT                443  # HTTPS port for deomail.com API
EMAIL_USER                Info@veldicwear.com
EMAIL_PASS                # Leave empty - uses API key auth instead
EMAIL_FROM                Info@veldicwear.com
# Inboxes that must be monitored — where customer mail is delivered.
CONTACT_EMAIL_TO          info@veldicwear.com
SUPPORT_EMAIL             info@veldicwear.com
```
---

## Exchange Rates (Frankfurter) — Cron Setup

Frankfurter (`https://api.frankfurter.dev`) is free, keyless, and already wired into
`lib/exchange-rates.ts` as the default rate source. The only operational task is a
recurring job that calls the refresh endpoint to populate the `ExchangeRate` table.

The endpoint is `GET /api/cron/exchange-rates` and is protected by `CRON_SECRET`,
which the cron must present either as `?secret=` **or** as the `Authorization:
Bearer ${CRON_SECRET}` header that Vercel Cron attaches automatically.

### Option A — cron-job.org (Recommended, hourly, any host)

Matches the existing `cj-stock-sync` pattern:

1. Ensure `CRON_SECRET` is set in your env (already listed above).
2. Create a cron-job.org job calling **every hour**:
   ```
   https://veldicwear.com/api/cron/exchange-rates?secret=<CRON_SECRET>
   ```
   Use `0 * * * *` (hourly) or a manual hourly interval. ~24 req/day, zero cost.

### Option B — Vercel Cron (native, zero external dependency)

Already configured in `vercel.json`:
```json
"crons": [{ "path": "/api/cron/exchange-rates", "schedule": "0 12 * * *" }]
```
Runs once daily at 12:00 UTC. Vercel auto-sends `Authorization: Bearer $CRON_SECRET`,
so nothing secret is committed. **Caveat:** the Vercel Hobby tier limits cron to
~1 run/day — sufficient for the 24h staleness gate, but Hourly robustness requires
Option A.

### Verify

After a run, hit the endpoint once manually (browser/curl) with your secret and
expect:
```json
{ "success": true, "base": "USD", "rates": { "CAD": 1.36, "EUR": 0.92 }, "fetchedAt": "..." }
```
Then confirm the storefront renders CAD/EUR (via the currency picker) instead of
falling back to USD.