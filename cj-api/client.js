const axios = require('axios');
const CJAuth = require('./auth');
const { throttle } = require('./rate-limit');

class CJClient {
  constructor() {
    this.auth = new CJAuth();
    this.baseURL = 'https://developers.cjdropshipping.com';
    this.version = 'v1';
  }

  async request(method, endpoint, data = null, params = null) {
    try {
      const token = await this.auth.getAccessToken();

      const config = {
        method,
        url: `${this.baseURL}/api2.0/${this.version}${endpoint}`,
        headers: {
          'CJ-Access-Token': token,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data) config.data = data;
      if (params) config.params = params;

      await throttle();
      const response = await axios(config);

      // Handle token expiry
      if (response.data.code === 1600001 || response.data.code === 1600003) {
        console.log('[CJ Client] Token expired, refreshing...');
        await this.auth.refreshAccessToken();
        config.headers['CJ-Access-Token'] = this.auth.accessToken;
        await throttle();
        const retryResponse = await axios(config);
        return retryResponse.data;
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('[CJ Client] API Error:', {
          status: error.response.status,
          code: error.response.data?.code,
          message: error.response.data?.message,
          endpoint
        });
        return error.response.data;
      }
      throw error;
    }
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getCategories() {
    return await this.request('GET', '/product/getCategory');
  }

  async searchProducts({
    keyword = '',
    page = 1,
    size = 20,
    categoryId = null,
    countryCode = 'US',
    startPrice = null,
    endPrice = null,
    sort = 'desc',
    orderBy = 0,
    features = ['enable_description', 'enable_category']
  } = {}) {
    const params = { page, size, sort, orderBy };
    if (keyword) params.keyWord = keyword;
    if (categoryId) params.categoryId = categoryId;
    if (countryCode) params.countryCode = countryCode;
    if (startPrice) params.startSellPrice = startPrice;
    if (endPrice) params.endSellPrice = endPrice;
    if (features.length) params.features = features;

    return await this.request('GET', '/product/listV2', null, params);
  }

  async getProductDetails(pid, countryCode = null) {
    const params = { pid };
    if (countryCode) params.countryCode = countryCode;
    return await this.request('GET', '/product/query', null, params);
  }

  async getInventoryByPid(pid) {
    return await this.request('GET', '/product/stock/getInventoryByPid', null, { pid });
  }

  async getInventoryByVid(vid) {
    return await this.request('GET', '/product/stock/queryByVid', null, { vid });
  }

  async getProductReviews(pid, score = null, pageNum = 1, pageSize = 20) {
    const params = { pid, pageNum, pageSize };
    if (score) params.score = score;
    return await this.request('GET', '/product/productComments', null, params);
  }

  // ============================================
  // FREIGHT / LOGISTICS
  // ============================================

  async calculateFreightSimple({ startCountry, endCountry, products }) {
    return await this.request('POST', '/logistic/freightCalculate', {
      startCountryCode: startCountry,
      endCountryCode: endCountry,
      products
    });
  }

  async calculateFreightAdvanced(reqDTOS) {
    return await this.request('POST', '/logistic/freightCalculateTip', { reqDTOS });
  }

  async trackShipment(trackNumbers) {
    return await this.request('GET', '/logistic/trackInfo', null, {
      trackNumber: trackNumbers
    });
  }
// ============================================
  // ORDERS
  // ============================================

  async createOrder(orderData) {
    const payload = {
      platform: 'api',
      orderFlow: 1,
      isSandbox: 1,
      ...orderData
    };
    return await this.request('POST', '/shopping/order/createOrderV3', payload);
  }

  async addToCart(cjOrderIds) {
    return await this.request('POST', '/shopping/order/addCart', {
      cjOrderIdList: cjOrderIds
    });
  }

  async confirmCart(cjOrderIds) {
    return await this.request('POST', '/shopping/order/addCartConfirm', {
      cjOrderIdList: cjOrderIds
    });
  }

  async generateParentOrder(shipmentOrderId) {
    return await this.request('POST', '/shopping/order/saveGenerateParentOrder', {
      shipmentOrderId
    });
  }

  async payBalance(shipmentOrderId, payId = null) {
    const payload = { shipmentOrderId };
    if (payId) payload.payId = payId;
    return await this.request('POST', '/shopping/pay/payBalanceV2', payload);
  }

  async getOrderDetails(orderId) {
    return await this.request('GET', '/shopping/order/getOrderDetail', null, { orderId });
  }

  async listOrders({ pageNum = 1, pageSize = 20, status = null } = {}) {
    const params = { pageNum, pageSize };
    if (status) params.status = status;
    return await this.request('GET', '/shopping/order/list', null, params);
  }

  async getBalance() {
    return await this.request('GET', '/shopping/pay/getBalance');
  }

  // ============================================
  // SANDBOX HELPERS (for testing)
  // ============================================

  async sandboxSimulatePay(orderId) {
    return await this.request('POST', '/shopping/sandbox/simulatePay', { orderId });
  }

  async sandboxUpdateStatus(orderId, targetStatus) {
    return await this.request('POST', '/shopping/sandbox/updateStatus', {
      orderId,
      targetStatus
    });
  }

  async sandboxUpdateTracking(orderId, trackNumber) {
    return await this.request('POST', '/shopping/sandbox/updateTrackNumber', {
      orderId,
      trackNumber
    });
  }

  // ============================================
  // WAREHOUSES
  // ============================================

  async getWarehouses() {
    return await this.request('GET', '/product/globalWarehouseList');
  }

  async getWarehouseDetails(storageId) {
    return await this.request('GET', '/warehouse/detail', null, { id: storageId });
  }

  // ============================================
  // SETTINGS
  // ============================================

  async getSettings() {
    return await this.request('GET', '/setting/get');
  }

  // ============================================
  // WEBHOOK MANAGEMENT
  // ============================================

  async setupWebhooks(webhookConfig) {
    return await this.request('POST', '/webhook/set', webhookConfig);
  }
}

module.exports = CJClient;