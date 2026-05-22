import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['active', 'completed', 'paused'],
    },
    hoursSpent: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);
