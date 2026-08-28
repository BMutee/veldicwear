// Shared helpers for the test scripts.
//
// CJ's list endpoints have returned products under a few different shapes
// across versions (v1 `data.list`, v2 `data.content[0].productList`, plus a
// bare `data` array for some stock/comment responses). Instead of betting on
// one shape, `extractList` tolerates the known variants so the tests stay
// working even if CJ tweaks the response wrapper.

function extractList(result, key = 'productList') {
  if (!result || result.code !== 200) {
    throw new Error(
      `CJ API error (code=${result?.code}): ${result?.message ?? 'unknown error'}`
    );
  }
  const data = result.data;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];

  // v2: { content: [ { productList: [...] } ] }
  const viaContent = data.content?.[0]?.[key];
  if (Array.isArray(viaContent)) return viaContent;

  // plain list wrapper: { list: [...] }
  const viaList = data[key];
  if (Array.isArray(viaList)) return viaList;

  // generic top-level array
  if (Array.isArray(data.list)) return data.list;

  return [];
}

// Convert a list/search item into a stable product id string for later
// detail / inventory calls. listV2 items expose `.id` (and often `.pid`).
function productIdOf(item) {
  return String(item?.pid ?? item?.id ?? '');
}

// CJ suspends API access on accounts that haven't authorized their API store.
// Detect that specific failure early so we can print actionable guidance
// instead of failing cryptically page-by-page.
function assertApiEnabled(result) {
  if (result && result.code !== 200 && /disabled|reactivate/i.test(result.message || '')) {
    console.error('\n❌ Your CJ API access is DISABLED for this endpoint.');
    console.error('   Fix: sign in at https://cjdropshipping.com → My CJ → Authorization');
    console.error('        (cjdropshipping.com/my.html#/authorize/APIStores) and');
    console.error('        reactivate / authorize your API store, then re-run.');
    process.exit(1);
  }
}

module.exports = { extractList, productIdOf, assertApiEnabled };