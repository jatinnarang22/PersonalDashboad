import mongoose from 'mongoose';
import { OAuthState } from '../models/OAuthState.js';

const TTL_MS = 15 * 60 * 1000;

export async function saveOAuthState(kind, state, userId) {
  const uid = userId ? String(userId).trim() : '';
  if (!uid || !mongoose.Types.ObjectId.isValid(uid)) {
    throw new Error('OAuth requires an authenticated session before starting.');
  }
  await OAuthState.findOneAndUpdate(
    { kind, state },
    {
      userId: new mongoose.Types.ObjectId(uid),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
    { upsert: true }
  );
}

/** Returns user id string or null if missing/expired. */
export async function takeOAuthState(kind, state) {
  if (!state) return null;
  const doc = await OAuthState.findOneAndDelete({ kind, state });
  if (!doc) return null;
  if (doc.expiresAt.getTime() < Date.now()) return null;
  return doc.userId.toString();
}
