require('dotenv').config();
const CJClient = require('../cj-api/client');
const { extractList, productIdOf, assertApiEnabled } = require('./cj-util');

// NOTE: No manual sleeps — cj-api/rate-limit.js paces every CJ call at the
// account's real QPS (~1 req/sec).

async function testOrderFlow() {
  console.log('🛒 Testing CJ order flow (SANDBOX MODE)...\n');

  const client = new CJClient();

  try {
    // 1. Find a test product with stock
    console.log('1️⃣ Finding test product...');
    const searchResult = await client.searchProducts({ keyword: 'hoodie', size: 5 });
    assertApiEnabled(searchResult);

    if (searchResult.code !== 200) {
      throw new Error(`Search failed: ${searchResult.message}`);
    }

    let testProduct = null;
    for (const item of extractList(searchResult)) {
      const pid = productIdOf(item);
      if (!pid) continue;

      // Details FIRST — we need a real variant id (vid) before we can ask
      // about stock. The old code passed the *product* id to the variant
      // stock endpoint, which never matches.
      const details = await client.getProductDetails(pid);
      assertApiEnabled(details);
      if (details.code !== 200 || !details.data) continue;

      const variants = Array.isArray(details.data.variants) ? details.data.variants : [];
      for (const variant of variants) {
        if (!variant?.vid) continue;
        const stock = await client.getInventoryByVid(variant.vid);
        if (
          stock.code === 200 &&
          Array.isArray(stock.data) &&
          stock.data.some(w => (w.totalInventoryNum || 0) > 0)
        ) {
          details.data.variants = variants; // normalize shape
          testProduct = details.data;
          break;
        }
      }
      if (testProduct) break;
    }

    if (!testProduct) {
      throw new Error('No products with in-stock variants found');
    }

    const variant = testProduct.variants.find(v => v.vid);
    console.log(`   ✓ Selected: ${testProduct.productNameEn}`);
    console.log(`   Variant: ${variant.variantNameEn || 'Default'} (${variant.vid})`);

    // 2. Create order in sandbox
    console.log('\n2️⃣ Creating sandbox order...');
    const orderResult = await client.createOrder({
      orderNumber: 'TEST-' + Date.now(),
      shippingCountryCode: 'US',
      shippingCountry: 'United States',
      shippingProvince: 'CA',
      shippingCity: 'Los Angeles',
      shippingAddress: '123 Test Street',
      shippingCustomerName: 'Test User',
      shippingPhone: '5551234567',
      shippingZip: '90001',
      email: 'test@example.com',
      logisticName: 'USPS',
      fromCountryCode: 'CN',
      platform: 'api',
      shopLogisticsType: 2,
      isSandbox: 1,
      orderFlow: 1,
      products: [{
        vid: variant.vid,
        quantity: 1,
        storeLineItemId: 'test-line-001'
      }]
    });
    assertApiEnabled(orderResult);

    if (orderResult.code !== 200) {
      throw new Error(`Order failed (code=${orderResult.code}): ${orderResult.message}`);
    }

    const cjOrderId = orderResult.data?.orderId ?? orderResult.data?.orderIdList?.[0];
    if (!cjOrderId) {
      throw new Error(`Order response missing orderId: ${JSON.stringify(orderResult.data).slice(0, 300)}`);
    }
    console.log(`   ✓ Order created: ${cjOrderId}`);

    // 3. Add to cart and pay
    console.log('\n3️⃣ Processing payment...');
    const cartRes = await client.addToCart([cjOrderId]);
    if (cartRes.code !== 200) throw new Error(`addToCart failed: ${cartRes.message}`);

    const confirmRes = await client.confirmCart([cjOrderId]);
    if (confirmRes.code !== 200) throw new Error(`addCartConfirm failed: ${confirmRes.message}`);

    const parentOrder = await client.generateParentOrder(cjOrderId);
    if (parentOrder.code !== 200) {
      throw new Error(`generateParentOrder failed: ${parentOrder.message}`);
    }
    const payId = parentOrder.data?.payId;
    console.log(`   Pay ID: ${payId}`);

    const payRes = await client.payBalance(cjOrderId, payId);
    if (payRes.code !== 200) throw new Error(`payBalance failed: ${payRes.message}`);
    console.log('   ✓ Payment simulated');

    // 4. Update status to shipped
    console.log('\n4️⃣ Simulating fulfillment...');
    for (const [label, fn] of [
      ['→ UNSHIPPED', () => client.sandboxUpdateStatus(cjOrderId, 400)],
      ['→ SHIPPED', () => client.sandboxUpdateStatus(cjOrderId, 500)],
      ['→ Tracking set', () => client.sandboxUpdateTracking(cjOrderId, 'TEST123456789')]
    ]) {
      const res = await fn();
      if (res.code !== 200) throw new Error(`Sandbox ${label} failed: ${res.message}`);
      console.log(`   ✓ ${label}`);
    }

    // 5. Query order
    console.log('\n5️⃣ Verifying order...');
    const finalDetails = await client.getOrderDetails(cjOrderId);
    if (finalDetails.code !== 200) {
      throw new Error(`getOrderDetail failed: ${finalDetails.message}`);
    }
    console.log(`   ✓ Status: ${finalDetails.data?.orderStatus}`);
    console.log(`   ✓ Tracking: ${finalDetails.data?.trackNumber}`);

    console.log('\n🎉 Order flow test PASSED!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data));
    }
    process.exit(1);
  }
}

testOrderFlow();
