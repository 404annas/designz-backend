import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.model.js';
import Session from '../models/Session.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import apiResponse from '../utils/apiResponse.js';
import { loginSchema } from '../schemas/auth.schema.js';

export const login = asyncHandler(async (req, res) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return apiResponse(res, 400, false, 'Invalid data', validation.error);
  }

  const { email, password } = validation.data;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return apiResponse(res, 401, false, 'Invalid credentials');
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await Session.create({
    userId: user._id,
    token,
    expiresAt,
  });

  res.cookie('emc_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return apiResponse(res, 200, true, 'Logged in successfully', {
    name: user.name,
    email: user.email,
    role: user.role,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.emc_session;
  if (token) {
    await Session.deleteOne({ token });
  }
  res.clearCookie('emc_session');
  return apiResponse(res, 200, true, 'Logged out successfully');
});

export const me = asyncHandler(async (req, res) => {
  return apiResponse(res, 200, true, 'User profile', {
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});
