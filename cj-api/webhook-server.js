const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const OPEN_ID = process.env.CJ_OPEN_ID;

// CRITICAL: Raw body parser for signature verification
app.use('/api/webhooks/cj', express.raw({ type: 'application/json' }));

// Signature verification function
function verifyCJSignature(rawBody, signature) {
  if (!signature || !OPEN_ID) return false;

  const hmac = crypto.createHmac('sha256', String(OPEN_ID));
  hmac.update(rawBody);
  const computed = hmac.digest('base64');

  const sigBuf = Buffer.from(signature);
  const computedBuf = Buffer.from(computed);

  if (sigBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, computedBuf);
}

// Product webhook
app.post('/api/webhooks/cj/product', (req, res) => {
  const rawBody = req.body.toString('utf8');
  const signature = req.headers['sign'];

  if (!verifyCJSignature(rawBody, signature)) {
    console.error('[Webhook] Invalid signature for product');
    return res.status(401).json({ code: 401, message: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  console.log('[Product Webhook]', payload.messageType, payload.params?.pid);

  // Update product in your database here
  // Handle INSERT/UPDATE/DELETE

  res.status(200).json({ code: 200, result: 'success', message: 'ok' });
});

// Order webhook
app.post('/api/webhooks/cj/order', (req, res) => {
  const rawBody = req.body.toString('utf8');
  const signature = req.headers['sign'];

  if (!verifyCJSignature(rawBody, signature)) {
    return res.status(401).json({ code: 401, message: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  console.log('[Order Webhook]', payload.messageType, payload.params?.orderNumber);

  // Update order status here
  // payload.params.orderStatus, .trackNumber, .trackingProvider

  res.status(200).json({ code: 200, result: 'success', message: 'ok' });
});

// Logistics webhook
app.post('/api/webhooks/cj/logistics', (req, res) => {
  const rawBody = req.body.toString('utf8');
  const signature = req.headers['sign'];

  if (!verifyCJSignature(rawBody, signature)) {
    return res.status(401).json({ code: 401, message: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  console.log('[Logistics Webhook]', payload.params?.trackingNumber);

  // Update tracking here
  // payload.params.trackingStatus, .logisticsTrackEvents

  res.status(200).json({ code: 200, result: 'success', message: 'ok' });
});

// Stock webhook
app.post('/api/webhooks/cj/stock', (req, res) => {
  const rawBody = req.body.toString('utf8');
  const signature = req.headers['sign'];

  if (!verifyCJSignature(rawBody, signature)) {
    return res.status(401).json({ code: 401, message: 'Invalid signature' });
  }

  const payload = JSON.parse(rawBody);
  console.log('[Stock Webhook]', Object.keys(payload.params || {}).length, 'variants');

  // Update stock levels here
  // payload.params contains vid -> stock info

  res.status(200).json({ code: 200, result: 'success', message: 'ok' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CJ Webhook server running on port ${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/webhooks/cj/product`);
  console.log(`   POST /api/webhooks/cj/order`);
  console.log(`   POST /api/webhooks/cj/logistics`);
  console.log(`   POST /api/webhooks/cj/stock`);
  console.log(`   GET  /health`);
});

module.exports = app;