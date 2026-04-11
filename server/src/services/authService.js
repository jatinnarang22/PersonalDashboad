import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const SALT_ROUNDS = 10;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain, passwordHash) {
  return bcrypt.compare(plain, passwordHash);
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
