# Plan: CJ Cost Price & Profit Margin

## Source
CJ's product/variant APIs expose `sellPrice`/`variantSellPrice` (retail) only.
They do NOT expose CJ's actual wholesale cost.  Therefore costPrice must
be a manually-entered field on ProductVariant.

## Steps
- [x] 1. Add `costPrice Float?` to ProductVariant in schema.prisma
- [x] 2. Schema applied — captured as migration `20260829180000_add_product_variant_cost_price` (13/13 applied, no drift)
- [x] 3. Update /api/admin/products/create to accept costPrice (+ validation)
- [x] 4. Update /api/admin/products/update to accept costPrice (+ validation)
- [x] 5. Show profit margin on /admin/products list (AdminProductsClient variant rows: `$profit (+pct%)` with color coding)
- [x] 6. Show profit on /admin/orders detail (Profit Breakdown card: per-item profit, margin %, known vs. excluded cost)
- [x] 7. Show profit summary on /admin dashboard (30-day Revenue / Cost / Profit + amber warning when cost not set)

## Status: DONE ✅
Verified live: DB column exists (`costPrice` in ProductVariant SELECT), variant rows return `costPrice`, order-detail joins cost at read time. Note: existing products have `NULL` costPrice until manually entered.