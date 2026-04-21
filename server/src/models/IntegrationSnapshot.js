import mongoose from 'mongoose';

const integrationSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['github', 'wakatime', 'instagram', 'youtube'],
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

// one snapshot per user/platform/day
integrationSnapshotSchema.index({ userId: 1, platform: 1, date: 1 }, { unique: true });

export const IntegrationSnapshot = mongoose.model('IntegrationSnapshot', integrationSnapshotSchema);
