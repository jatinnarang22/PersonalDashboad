import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const SALT_ROUNDS = 10;
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, passwordHash) {
  if (typeof plain !== 'string' || typeof passwordHash !== 'string') return false;
  if (!isBcryptHash(passwordHash)) {
    // Backward compatibility for legacy plain-text records.
    return plain === passwordHash;
  }
  return bcrypt.compare(plain, passwordHash);
}

export function isBcryptHash(value) {
  return typeof value === 'string' && BCRYPT_HASH_RE.test(value);
}

export async function createUser(email, password) {
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    profile: { email },
  });
  return user;
}

export function userPublic(user) {
  return {
    id: user._id.toString(),
    email: user.email,
  };
}
