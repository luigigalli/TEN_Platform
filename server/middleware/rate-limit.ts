import rateLimit from "express-rate-limit";
import { env } from "../config/environment";

// General rate limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: "Too many password reset attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for failed login attempts
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed attempts per hour
  skipSuccessfulRequests: true, // Don't count successful logins
  message: "Too many failed login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
