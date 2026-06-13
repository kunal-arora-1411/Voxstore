const rateLimit = require('express-rate-limit');

const generationLimitsEnabled = () => {
  if (process.env.GENERATION_LIMITS_ENABLED !== undefined) {
    return process.env.GENERATION_LIMITS_ENABLED === 'true';
  }
  return process.env.NODE_ENV === 'production';
};

const dailyGenerationLimit = Number.parseInt(process.env.DAILY_GENERATION_LIMIT || '3', 10);

// 10 generation requests per IP per hour (pre-auth safety net)
const ipLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many requests from this IP. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !generationLimitsEnabled(),
});

// Per-user daily cap in production; disabled by default during local development.
const userGenerateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: Number.isFinite(dailyGenerationLimit) && dailyGenerationLimit > 0
    ? dailyGenerationLimit
    : 3,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: `Daily generation limit reached (${dailyGenerationLimit || 3}/day). Try again tomorrow.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !generationLimitsEnabled() || !req.user,
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

module.exports = {
  analyticsLimiter,
  generationLimitsEnabled,
  ipLimiter,
  userGenerateLimiter,
};
