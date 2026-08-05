// In-memory rate limiter store (Zero extra dependencies required!)
const rateLimitStore = new Map();

/**
 * Custom zero-dependency Rate Limiter middleware
 */
const createRateLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const now = Date.now();

    const record = rateLimitStore.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    rateLimitStore.set(ip, record);

    if (record.count > max) {
      return res.status(429).json({ message });
    }

    next();
  };
};

export const otpRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many OTP requests from this IP. Please try again after 15 minutes.",
});

export const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: "Too many verification attempts. Please try again after 15 minutes.",
});
