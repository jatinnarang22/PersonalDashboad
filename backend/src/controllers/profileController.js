import { User } from '../models/User.js';
import { mergeProfileFromUser } from '../utils/profileMerge.js';
import { defaultProfile } from '../constants/defaultProfile.js';

function sanitizeProfilePatch(body) {
  const b = body && typeof body === 'object' ? { ...body } : {};
  const num = (v) => {
    if (v === '' || v === undefined || v === null) return null;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  };
  if ('heightCm' in b) b.heightCm = num(b.heightCm);
  if ('weightKg' in b) b.weightKg = num(b.weightKg);
  for (const key of Object.keys(b)) {
    if (!(key in defaultProfile)) delete b[key];
  }
  return b;
}

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ profile: mergeProfileFromUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const body = sanitizeProfilePatch(req.body);
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const nextProfile = {
      ...mergeProfileFromUser(user),
      ...body,
      email: user.email,
    };
    user.set('profile', nextProfile);
    await user.save();
    res.json({ ok: true, profile: mergeProfileFromUser(user) });
  } catch (err) {
    next(err);
  }
}
