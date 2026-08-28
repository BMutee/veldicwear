// Entry point for the CJ Dropshipping integration server.
// Boots the webhook handler so `npm start` / `npm run dev` work.
require('dotenv').config();
require('./cj-api/webhook-server');