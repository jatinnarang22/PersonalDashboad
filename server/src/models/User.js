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

const youtubeIntegrationSchema = new mongoose.Schema(
  {
    refreshToken: { type: String, default: '' },
    channelId: { type: String, default: '' },
    channelTitle: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const instagramIntegrationSchema = new mongoose.Schema(
  {
    pageAccessToken: { type: String, default: '' },
    igUserId: { type: String, default: '' },
    username: { type: String, default: '' },
    tokenExpiresAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
  },
  { _id: false }
);

const githubIntegrationSchema = new mongoose.Schema(
  {
    personalAccessToken: { type: String, default: '' },
    username: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
    lastSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const wakatimeIntegrationSchema = new mongoose.Schema(
  {
    apiKey: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
    lastSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    lastSyncedAt: { type: Date, default: null },
  },
  { _id: false }
);

const integrationsSchema = new mongoose.Schema(
  {
    youtube: { type: youtubeIntegrationSchema, default: () => ({}) },
    instagram: { type: instagramIntegrationSchema, default: () => ({}) },
    github: { type: githubIntegrationSchema, default: () => ({}) },
    wakatime: { type: wakatimeIntegrationSchema, default: () => ({}) },
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
    integrations: { type: integrationsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
