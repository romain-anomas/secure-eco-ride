import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message } },
  });

export const apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests. Please try again shortly.');
export const loginLimiter = make(15 * 60 * 1000, 10, 'Too many sign-in attempts. Try again in 15 minutes.');
export const bookingLimiter = make(60 * 60 * 1000, 15, 'Too many booking requests from this device. Please call us to book.');
export const contactLimiter = make(60 * 60 * 1000, 10, 'Too many messages. Please call us instead.');
