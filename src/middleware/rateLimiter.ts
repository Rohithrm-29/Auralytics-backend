import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';

export const rateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (_req, res) => {
    sendError(res, 'Too many login attempts, please try again later.', 'RATE_LIMIT_EXCEEDED', 429);
  },
});
