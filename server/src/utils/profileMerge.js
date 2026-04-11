import { defaultProfile } from '../constants/defaultProfile.js';

export function profileToPlain(profile) {
  if (!profile || typeof profile !== 'object') return {};
  return profile.toObject ? profile.toObject() : { ...profile };
}

/** Merged profile for API + completion checks (drops legacy keys). */
export function mergeProfileFromUser(user) {
  const p = profileToPlain(user.profile);
  const out = { ...defaultProfile };
  for (const key of Object.keys(defaultProfile)) {
    if (key === 'email') continue;
    if (p[key] !== undefined && p[key] !== null && p[key] !== '') {
      out[key] = p[key];
    }
  }
  out.email = user.email;
  return out;
}

/**
 * True when the user has set a display name and at least one other meaningful field
 * (so we can skip the onboarding profile screen).
 */
export function isProfileCompleteMerged(p) {
  const name = String(p.displayName || '').trim();
  if (!name) return false;
  if (String(p.phone || '').trim()) return true;
  const h = p.heightCm;
  const w = p.weightKg;
  if (
    h != null &&
    w != null &&
    Number.isFinite(Number(h)) &&
    Number.isFinite(Number(w))
  ) {
    return true;
  }
  if (String(p.dateOfBirth || '').trim()) return true;
  if (String(p.bio || '').trim()) return true;
  if (String(p.city || '').trim() || String(p.country || '').trim()) return true;
  return false;
}
