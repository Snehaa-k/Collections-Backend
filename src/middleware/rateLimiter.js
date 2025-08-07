const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Uses memory store by default (works without Redis)
  });
};

// General API rate limiting
const apiLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  'Too many requests, please try again later'
);

// Strict rate limiting for auth endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

// Bulk operations rate limiting
const bulkLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  10, // 10 bulk operations
  'Too many bulk operations, please try again later'
);

console.log('⚠️  Using memory-based rate limiting (Redis not required)');

module.exports = {
  apiLimiter,
  authLimiter,
  bulkLimiter
};