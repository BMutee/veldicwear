# Setting up Veldic Wear on a new PC

Your project is version-controlled on GitHub (`github.com/BMutee/veldicwear`), so
**you don't need to copy files over a cable/USB.** The steps below get you a
working install on any fresh Windows PC. The only thing you must carry over
separately is your **`.env`** (it's git-ignored on purpose — see Step 4).

---

## 1. Install prerequisites on the new PC

| Tool | Why | Link |
| ---- | --- | ---- |
| **Node.js** (LTS, ≥ 20) | The app runs on Node 24 features; LTS 20/22/24 all work | https://nodejs.org |
| **Git** | Clone & push the repo | https://git-scm.com |
| **VS Code** (optional) | Editing | https://code.visualstudio.com |

Verify:
```bash
node -v
npm -v
git --version
```

---

## 2. Clone the repo

```bash
git clone https://github.com/BMutee/veldicwear.git
cd veldicwear
```

If you push via SSH instead of HTTPS, also bring your SSH keys from the old PC
(`~/.ssh/id_ed25519` + `~/.ssh/id_ed25519.pub`) and add the private key on the
new machine — or just keep using HTTPS with a Personal Access Token.

---

## 3. Install dependencies

```bash
npm install
```
This also runs `prisma generate` automatically (it's the `postinstall` script),
so the Prisma client is built for the new machine.

---

## 4. Recreate `.env` (the important, non-optional step)

`.env` is git-ignored, so it is **not** in the repo. Start from the template:

```bash
copy .env.example .env     # Windows
# or: cp .env.example .env
```

Then paste your **real** values (from the old PC's `.env`) into the new one.
These are the variables the code actually reads:

**Must have (app won't run correctly without these):**
- `DATABASE_URL` — your Neon PostgreSQL URL (yours includes `sslmode=verify-full`)
- `BETTER_AUTH_SECRET` — session signing secret
- `BETTER_AUTH_URL` — e.g. `http://localhost:3000` for dev
- `NEXT_PUBLIC_BASE_URL` — e.g. `http://localhost:3000` for dev
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `CJ_API_KEY` (and `CJ_OPEN_ID` if your account uses it) — CJ Dropshipping
- `ADMIN_SECRET` — admin-guard secret
- `CRON_SECRET` — cron-job.org shared secret

**Email / notifications:**
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- `CONTACT_EMAIL_TO`, `DEO_MAIL_API_KEY`

**Optional / secondary:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
  (admin image uploads)
- `EXCHANGE_RATES_API_URL`
- `ORDER_TRACKING_SECRET`
- `PORT` (defaults to 3000), `NODE_ENV`

> **Security:** never paste `.env` contents into the GitHub repo. Copy it via
> USB, a private drive, or a private message to yourself.

Your **database is on Neon (cloud)**, so pointing the new `.env` at the same
`DATABASE_URL` gives you all your existing rows — nothing to copy for data.

---

## 5. Migrate + build the client

```bash
npx prisma migrate deploy     # apply any schema migrations to your DB
npx prisma generate           # (idempotent; safe to re-run)
```

---

## 6. Run it

```bash
npm run dev
```
Open `http://localhost:3000`.

---

## 7. Verify the CJ import works on the new machine

Everything is already wired to the same Neon DB and CJ API. Quick smoke check:

```bash
# Recreate an admin login (if not already in the DB)
npx tsx --env-file=.env scripts/create-admin.ts your@email.com yourPassword

# Re-import a real CJ product and confirm name + stock populate
npx tsx --env-file=.env scripts/verify-cj-import.ts 2508300653521615300
```
Or use the browser extension against the local endpoint (load the extension in
dev mode and set the store base URL to `http://localhost:3000`).

---

## 8. Load the browser extension (optional)

Edge: `edge://extensions` → enable **Developer mode** → **Load unpacked** →
select the `extension/` folder in this repo. Set your store URL + an API key
from `/admin/integrations`. Full instructions are in `extension/README.md`.

---

## Checklist

- [ ] Node.js + Git installed
- [ ] `git clone` + `npm install` completed
- [ ] `.env` recreated with all real values (Step 4) — the only manual transfer
- [ ] `npx prisma migrate deploy` succeeded
- [ ] `npm run dev` serves the site
- [ ] Imported one CJ product to confirm DB/API connectivity
- [ ] (Optional) extension loaded in Edge/Chrome