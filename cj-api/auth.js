const axios = require('axios');
const { throttle } = require('./rate-limit');

const CJ_CONFIG = {
  BASE_URL: 'https://developers.cjdropshipping.com',
  API_KEY: process.env.CJ_API_KEY,
  VERSION: 'v1'
};

// Module-scoped token cache so every CJAuth/CJClient instance shares the same
// token for the process lifetime. CJ also caches tokens server-side for 24h,
// so this mirrors the server behaviour and avoids redundant auth round-trips.
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;
let openId = null;

class CJAuth {
  get accessToken() {
    return accessToken;
  }
  get refreshToken() {
    return refreshToken;
  }
  get tokenExpiry() {
    return tokenExpiry;
  }
  get openId() {
    return openId;
  }

  async getAccessToken() {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      console.log('[CJ Auth] Using cached token');
      return accessToken;
    }

    try {
      console.log('[CJ Auth] Requesting new access token...');
      await throttle();
      const response = await axios.post(
        `${CJ_CONFIG.BASE_URL}/api2.0/${CJ_CONFIG.VERSION}/authentication/getAccessToken`,
        { apiKey: CJ_CONFIG.API_KEY },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      if (response.data.code === 200 && response.data.result === true) {
        const data = response.data.data;
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        openId = data.openId;
        // Set expiry to 5 minutes before actual expiry for safety
        const expiryTime = new Date(data.accessTokenExpiryDate).getTime();
        tokenExpiry = expiryTime - (5 * 60 * 1000);

        console.log('[CJ Auth] ✓ New token obtained');
        console.log('[CJ Auth] openId:', openId);
        console.log('[CJ Auth] Expires:', new Date(tokenExpiry).toISOString());
        return accessToken;
      }
      throw new Error(`Auth failed: ${response.data.message}`);
    } catch (error) {
      console.error('[CJ Auth] ✗ Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      console.log('[CJ Auth] Refreshing token...');
      await throttle();
      const response = await axios.post(
        `${CJ_CONFIG.BASE_URL}/api2.0/${CJ_CONFIG.VERSION}/authentication/refreshAccessToken`,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      if (response.data.code === 200 && response.data.result === true) {
        const data = response.data.data;
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        const expiryTime = new Date(data.accessTokenExpiryDate).getTime();
        tokenExpiry = expiryTime - (5 * 60 * 1000);
        console.log('[CJ Auth] ✓ Token refreshed');
        return accessToken;
      }
      throw new Error(`Refresh failed: ${response.data.message}`);
    } catch (error) {
      console.error('[CJ Auth] ✗ Refresh error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = CJAuth;