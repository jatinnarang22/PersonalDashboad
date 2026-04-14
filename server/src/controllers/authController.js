import { body } from 'express-validator';
import { User } from '../models/User.js';
import * as authService from '../services/authService.js';
import {
  mergeProfileFromUser,
  isProfileCompleteMerged,
} from '../utils/profileMerge.js';

export const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isString().notEmpty().withMessage('Password required'),
];

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const user = await authService.createUser(email, password);
    req.session.userId = user._id.toString();
    await saveSession(req);
    res.status(201).json({ user: authService.userPublic(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await authService.verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!authService.isBcryptHash(user.passwordHash)) {
      user.passwordHash = await authService.hashPassword(password);
      await user.save();
    }
    req.session.userId = user._id.toString();
    await saveSession(req);
    res.json({ user: authService.userPublic(user) });
  } catch (err) {
    next(err);
  }
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('sid');
    res.json({ ok: true });
  });
}

export async function me(req, res, next) {
  try {
    if (!req.session?.userId) {
      return res.json({ user: null, profileComplete: false });
    }
    const user = await User.findById(req.session.userId)
      .select('email profile')
      .lean();
    if (!user) {
      req.session.destroy(() => {});
      return res.json({ user: null, profileComplete: false });
    }
    const merged = mergeProfileFromUser(user);
    const profileComplete = isProfileCompleteMerged(merged);
    res.json({
      user: { id: user._id.toString(), email: user.email },
      profileComplete,
    });
  } catch (err) {
    next(err);
  }
}
