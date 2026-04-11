import mongoose from 'mongoose';

const screenTimeSchema = new mongoose.Schema(
  {
    instagram: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    steps: { type: Number, required: true, min: 0 },
    screenTime: { type: screenTimeSchema, required: true },
    codingHours: { type: Number, required: true, min: 0 },
    mood: {
      type: String,
      required: true,
      enum: ['productive', 'average', 'low'],
    },
    notes: { type: String, default: '' },
    /** Free-form daily numbers (calories, music min, job apps, …). See dailyMetricKeys.js */
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
