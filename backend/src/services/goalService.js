import { Goal } from '../models/Goal.js';

const DEFAULT_GOALS = {
  dailyStepsGoal: 8000,
  dailyCodingGoal: 4,
};

export async function getGoals() {
  let doc = await Goal.findOne().sort({ updatedAt: -1 }).lean();
  if (!doc) {
    const created = await Goal.create(DEFAULT_GOALS);
    return created.toObject();
  }
  return doc;
}

export async function upsertGoals(data) {
  let doc = await Goal.findOne().sort({ updatedAt: -1 });
  if (!doc) {
    doc = await Goal.create({
      dailyStepsGoal: data.dailyStepsGoal,
      dailyCodingGoal: data.dailyCodingGoal,
    });
    return doc.toObject();
  }
  if (data.dailyStepsGoal !== undefined) doc.dailyStepsGoal = data.dailyStepsGoal;
  if (data.dailyCodingGoal !== undefined) doc.dailyCodingGoal = data.dailyCodingGoal;
  await doc.save();
  return doc.toObject();
}
