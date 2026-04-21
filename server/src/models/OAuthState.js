import mongoose from 'mongoose';

/** Short-lived OAuth `state` → user binding (survives server restart; TTL auto-cleanup). */
const oauthStateSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['github', 'youtube', 'instagram'],
      required: true,
      index: true,
    },
    state: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: false }
);

oauthStateSchema.index({ kind: 1, state: 1 }, { unique: true });

oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthState = mongoose.model('OAuthState', oauthStateSchema);
