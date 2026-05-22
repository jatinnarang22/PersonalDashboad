import { IntegrationSnapshot } from '../models/IntegrationSnapshot.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function saveSnapshot(userId, platform, data) {
  const date = todayISO();
  try {
    await IntegrationSnapshot.findOneAndUpdate(
      { userId, platform, date },
      { $set: { data } },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Non-fatal: summary/cache still works even if snapshot write fails.
    console.warn(`[snapshot] save failed platform=${platform} user=${userId}: ${err.message}`);
  }
}

export async function getSnapshots(userId, platform, days = 7) {
  const safeDays = Math.max(1, Math.min(180, Number(days) || 7));
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - safeDays + 1);
  const fromISO = from.toISOString().slice(0, 10);

  return IntegrationSnapshot.find({
    userId,
    platform,
    date: { $gte: fromISO },
  })
    .sort({ date: 1 })
    .lean();
}
