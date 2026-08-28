// Shared minimum-interval throttle so every outgoing CJ API request is paced
// to the account's QPS limit. Discovered live: CJ returns
//   { code: 1600200, message: 'Too Many Requests, QPS limit is 1 time/1second' }
// on this account, so we keep >= 1.1s between requests (a little headroom).
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 2200;

async function throttle() {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastRequestTime);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();
}

module.exports = { throttle };
