-- Multi-currency foundation (data model + rate infrastructure ONLY —
-- no picker, no checkout wiring in this phase).
--
-- 1. Currency enum: USD is the base/storefront currency; CAD and EUR are the
--    supported converted currencies.
--
-- 2. ExchangeRate table: one row per non-USD currency. `rate` is units of that
--    currency per 1 USD (e.g. 1.3665 = CAD 1.3665 per USD 1.00). `fetchedAt`
--    records when the live source was last pulled; lib/exchange-rates.ts uses
--    it with STALE_RATE_THRESHOLD_MS to refuse rates older than the threshold.
--
-- 3. Order additions:
--    - `currency`        : NOT NULL DEFAULT 'USD' — Postgres materializes the
--                          default into every EXISTING row during ALTER, so
--                          existing orders are backfilled to 'USD' with no
--                          explicit UPDATE.
--    - `exchangeRateUsed`: nullable DECIMAL(18,6) — NULL for every existing
--                          order (they were charged in USD), as intended.
--    The column records the ACTUAL rate applied at purchase time and is never
--    recomputed later (see lib/exchange-rates.ts docs).
CREATE TYPE "Currency" AS ENUM ('USD', 'CAD', 'EUR');

CREATE TABLE "ExchangeRate" (
    "id"        TEXT NOT NULL,
    "currency"  "Currency" NOT NULL,
    "rate"      DECIMAL(18,6) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRate_currency_key" ON "ExchangeRate"("currency");

ALTER TABLE "Order"
ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN "exchangeRateUsed" DECIMAL(18,6);
