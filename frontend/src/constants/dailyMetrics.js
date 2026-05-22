/** Labels for DailyLog.metrics — keys must match server dailyMetricKeys.js */
export const DAILY_METRIC_FIELDS = [
  { key: 'caloriesBurned', label: 'Calories burned (est.)', suffix: 'kcal' },
  { key: 'distanceKm', label: 'Walking / running distance', suffix: 'km' },
  { key: 'runningMinutes', label: 'Running / active training', suffix: 'min' },
  { key: 'activeMinutes', label: 'Other active time', suffix: 'min' },
  { key: 'musicMinutes', label: 'Music / podcasts listening', suffix: 'min' },
  { key: 'linkedinOutreach', label: 'LinkedIn messages / outreach (manual)', suffix: '' },
  { key: 'jobApplications', label: 'Job applications sent', suffix: '' },
  { key: 'sleepHours', label: 'Sleep (last night)', suffix: 'hrs' },
];

export function emptyMetricsForm() {
  return Object.fromEntries(DAILY_METRIC_FIELDS.map(({ key }) => [key, '']));
}

export function metricsFromServer(m) {
  const base = emptyMetricsForm();
  if (!m || typeof m !== 'object') return base;
  for (const { key } of DAILY_METRIC_FIELDS) {
    const v = m[key];
    if (v != null && v !== '') base[key] = String(v);
  }
  return base;
}

export function metricsToPayload(formObj) {
  const out = {};
  for (const { key } of DAILY_METRIC_FIELDS) {
    const raw = formObj[key];
    if (raw === '' || raw === null || raw === undefined) continue;
    const n = parseFloat(String(raw));
    if (Number.isFinite(n) && n >= 0) out[key] = n;
  }
  return out;
}
