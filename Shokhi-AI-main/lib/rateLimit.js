/**
 * Sliding-Window Rate Limiter Helper for Shokhi AI
 */

const RATE_LIMIT_STORE = new Map();

export function checkRateLimit(clientId, limitPerMinute = 10) {
  const now = Date.now() / 1000;
  const windowStart = now - 60.0;

  let timestamps = RATE_LIMIT_STORE.get(clientId) || [];
  timestamps = timestamps.filter(t => t > windowStart);

  if (timestamps.length >= limitPerMinute) {
    const retryAfter = Math.ceil(60 - (now - timestamps[0]));
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfter)
    };
  }

  timestamps.push(now);
  RATE_LIMIT_STORE.set(clientId, timestamps);

  return {
    allowed: true,
    retryAfterSeconds: 0
  };
}
