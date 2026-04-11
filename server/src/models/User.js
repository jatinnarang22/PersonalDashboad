import mongoose from 'mongoose';

/** Explicit schema so Mongoose tracks updates. */
const profileSchema = new mongoose.Schema(
  {
    displayName: { type: String, default: '' },
    email: { type: String, default: '' },
    bio: { type: String, default: '' },
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: '' },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: '' },
    timezone: { type: String, default: '' },
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    youtube: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    profile: { type: profileSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
