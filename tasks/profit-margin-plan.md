# Plan: CJ Cost Price & Profit Margin

## Source
CJ's product/variant APIs expose `sellPrice`/`variantSellPrice` (retail) only.
They do NOT expose CJ's actual wholesale cost.  Therefore costPrice must
be a manually-entered field on ProductVariant.

## Steps
1. Add `costPrice Float?` to ProductVariant in schema.prisma
2. Push schema → database
3. Update /api/admin/products/create to accept costPrice
4. Update /api/admin/products/update to accept costPrice
5. Show profit margin on /admin/products list
6. Show profit on /admin/orders detail
7. Show profit summary on /admin dashboard