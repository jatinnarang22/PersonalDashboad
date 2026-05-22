import { DailyLog } from '../models/DailyLog.js';
import { DAILY_METRIC_KEYS } from '../constants/dailyMetricKeys.js';

function sanitizeMetrics(input) {
  if (!input || typeof input !== 'object') return {};
  const out = {};
  for (const key of DAILY_METRIC_KEYS) {
    if (input[key] === undefined || input[key] === null || input[key] === '') continue;
    const n = Number(input[key]);
    if (Number.isFinite(n) && n >= 0) out[key] = n;
  }
  return out;
}

function normalizeDate(dateInput) {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  return d.toISOString().slice(0, 10);
}

export async function createLog(data) {
  const date = normalizeDate(data.date);
  const st = data.screenTime && typeof data.screenTime === 'object' ? data.screenTime : {};
  const existing = await DailyLog.findOne({ date }).lean();
  const prevMetrics =
    existing?.metrics && typeof existing.metrics === 'object' ? existing.metrics : {};
  const nextMetrics =
    data.metrics !== undefined
      ? { ...prevMetrics, ...sanitizeMetrics(data.metrics) }
      : prevMetrics;

  const payload = {
    date,
    steps: data.steps,
    screenTime: {
      instagram: st.instagram ?? 0,
      total: st.total ?? 0,
    },
    codingHours: data.codingHours,
    mood: data.mood,
    notes: data.notes ?? '',
    metrics: nextMetrics,
  };
  const doc = await DailyLog.findOneAndUpdate({ date }, payload, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  return doc;
}

export async function getAllLogs() {
  return DailyLog.find().sort({ date: -1 }).lean();
}

export async function getLogByDate(dateParam) {
  const date = normalizeDate(dateParam);
  return DailyLog.findOne({ date }).lean();
}

export async function getLogsInRange(startDate, endDate) {
  return DailyLog.find({
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: 1 })
    .lean();
}
