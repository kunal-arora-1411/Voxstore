const rateLimit = require('express-rate-limit');

// 10 generation requests per IP per hour (pre-auth safety net)
const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many requests from this IP. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3 generation requests per authenticated user per day
const userGenerateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Daily generation limit reached (3/day). Try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.user, // skip if no user (ipLimiter covers that)
});

// Lightweight limiter for analytics ping endpoint (100/IP/hour)
const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many analytics pings.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { ipLimiter, userGenerateLimiter, analyticsLimiter };
