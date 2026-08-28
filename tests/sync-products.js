require('dotenv').config();
const fs = require('fs');
const path = require('path');
const CJClient = require('../cj-api/client');
const { extractList, productIdOf, assertApiEnabled } = require('./cj-util');

// NOTE: We do NOT sleep between requests here. cj-api/rate-limit.js already
// throttles every outbound CJ call to CJ's real QPS (~1 req/sec). Adding our
// own sleeps would only stack on top of that and slow the run for nothing.

async function syncProducts() {
  console.log('📦 Syncing products from CJ...\n');

  const client = new CJClient();
  const allProducts = [];
  let syncErrors = 0;

  const searches = [
    { keyword: 'hoodie', maxPages: 2 },
    { keyword: 't-shirt', maxPages: 2 },
    { keyword: 'sweatshirt', maxPages: 1 }
  ];

  for (const search of searches) {
    console.log(`\n🔍 Searching for: "${search.keyword}"`);

    for (let page = 1; page <= search.maxPages; page++) {
      let result;
      try {
        result = await client.searchProducts({
          keyword: search.keyword,
          page,
          size: 20,
          countryCode: 'US'
        });
      } catch (err) {
        console.error(`   Search failed (${search.keyword}, page ${page}):`, err.message);
        break;
      }

      assertApiEnabled(result);

      if (result.code !== 200) {
        console.error(`   Error (code=${result.code}): ${result.message}`);
        break;
      }

      // Tolerate every known response shape instead of betting on
      // data.content[0].productList specifically.
      const products = extractList(result);
      if (!products.length) {
        console.log(`   Page ${page}: no products returned — stopping this keyword.`);
        break;
      }
      console.log(`   Page ${page}: Found ${products.length} products`);

      for (const product of products) {
        const pid = productIdOf(product);
        if (!pid) continue;

        try {
          const details = await client.getProductDetails(pid);
          assertApiEnabled(details);

          if (details.code !== 200 || !details.data) {
            console.error(`   ⚠ Details failed for ${pid}: ${details.message}`);
            continue;
          }
          const p = details.data;
          const variants = Array.isArray(p.variants) ? p.variants : [];

          // Per-variant stock only makes sense against variant ids.
          const variantStock = {};
          for (const v of variants) {
            if (!v?.vid) continue;
            try {
              const stockResult = await client.getInventoryByVid(v.vid);
              if (stockResult.code === 200 && Array.isArray(stockResult.data)) {
                variantStock[v.vid] =
                  stockResult.data.reduce((sum, w) => sum + (w.totalInventoryNum || 0), 0) || 0;
              }
            } catch {
              // Stock is best-effort; a miss shouldn't kill the product record.
            }
          }

          allProducts.push({
            cj_id: p.pid ?? pid,
            sku: p.productSku ?? null,
            title: p.productNameEn ?? null,
            description:
              typeof p.description === 'string' && p.description.length
                ? p.description.replace(/<[^>]+>/g, '').trim().substring(0, 200) + '...'
                : null,
            main_image: p.bigImage ?? null,
            images: p.productImageSet || [],
            category: p.categoryName ?? null,
            base_price: p.sellPrice != null ? parseFloat(p.sellPrice) : null,
            variants: variants.map(v => ({
              cj_variant_id: v.vid ?? null,
              sku: v.variantSku ?? null,
              title: v.variantNameEn ?? null,
              price: v.variantSellPrice != null ? parseFloat(v.variantSellPrice) : null,
              weight_grams: v.variantWeight ?? null,
              stock: variantStock[v.vid] ?? 0
            })),
            logistics: p.productProEnSet || [],
            synced_at: new Date().toISOString()
          });

          console.log(
            `   ✓ ${p.productNameEn} (${variants.length} variants)`
          );
        } catch (err) {
          syncErrors++;
          console.error(`   ⚠ Skipped product ${pid}: ${err.message}`);
        }
      }
    }
  }

  // Always persist what we collected — even a partial run is useful.
  const outputPath = path.join(__dirname, '..', 'data', 'products.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));

  console.log(`\n✅ Synced ${allProducts.length} products${syncErrors ? ` (${syncErrors} skipped)` : ''}`);
  console.log(`📁 Saved to: ${outputPath}`);
}

syncProducts().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
