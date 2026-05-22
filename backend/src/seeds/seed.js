import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { DailyLog } from '../models/DailyLog.js';
import { Project } from '../models/Project.js';
import { Goal } from '../models/Goal.js';

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  await connectDB();

  await Promise.all([
    DailyLog.deleteMany({}),
    Project.deleteMany({}),
    Goal.deleteMany({}),
  ]);

  await Goal.create({
    dailyStepsGoal: 10000,
    dailyCodingGoal: 5,
  });

  const moods = ['productive', 'average', 'low'];
  const logs = [];
  for (let i = 0; i < 10; i++) {
    const date = daysAgo(i);
    logs.push({
      date,
      steps: 6000 + i * 400,
      screenTime: { instagram: 20 + i * 5, total: 120 + i * 10 },
      codingHours: 2 + (i % 4) * 0.5,
      mood: moods[i % 3],
      notes: i === 0 ? 'Seed entry for today' : `Backfilled day ${i}`,
    });
  }
  await DailyLog.insertMany(logs);

  await Project.insertMany([
    {
      name: 'Personal Dashboard',
      status: 'active',
      hoursSpent: 12,
      description: 'Full-stack life tracking app',
    },
    {
      name: 'Morning Run Streak',
      status: 'paused',
      hoursSpent: 0,
      description: 'Habit tracking',
    },
    {
      name: 'Read 12 books',
      status: 'completed',
      hoursSpent: 40,
      description: 'Annual reading goal',
    },
  ]);

  console.log('Seed completed: goals, projects, and daily logs.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
