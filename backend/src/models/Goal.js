import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    dailyStepsGoal: { type: Number, required: true, min: 0 },
    dailyCodingGoal: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Goal = mongoose.model('Goal', goalSchema);
