// In-memory rate limiter store (Zero extra dependencies required!)
const rateLimitStore = new Map();

/**
 * Custom zero-dependency Rate Limiter middleware
 * Keyed by user email or IP to prevent shared cloud proxy (Render/Vercel) IP lockouts
 */
const createRateLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const emailKey = req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : null;
    const ipKey = req.ip || (req.headers["x-forwarded-for"] ? String(req.headers["x-forwarded-for"]).split(",")[0] : "127.0.0.1");
    const identifier = emailKey || ipKey;

    const now = Date.now();
    const record = rateLimitStore.get(identifier) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    rateLimitStore.set(identifier, record);

    if (record.count > max) {
      console.log(`⚠️ [RATE LIMIT BLOCKED] Blocked rapid request attempt for: ${identifier}`);
      return res.status(429).json({ message });
    }

    next();
  };
};

export const otpRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many OTP requests for this email. Please try again after a few minutes.",
});

export const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many verification attempts. Please try again after a few minutes.",
});
