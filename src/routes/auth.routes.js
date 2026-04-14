import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
});

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
