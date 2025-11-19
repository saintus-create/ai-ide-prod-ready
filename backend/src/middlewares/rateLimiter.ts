import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 120, // limit each IP to 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests – try again later' },
});