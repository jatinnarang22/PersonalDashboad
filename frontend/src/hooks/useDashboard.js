import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import '../chartSetup.js';
import {
  logsApi,
  projectsApi,
  goalsApi,
  insightsApi,
  todayISO,
  integrationsApi,
  integrationOAuthStartUrl,
} from '../services/api.js';
import {
  DAILY_METRIC_FIELDS,
  emptyMetricsForm,
  metricsFromServer,
  metricsToPayload,
} from '../constants/dailyMetrics.js';

export { DAILY_METRIC_FIELDS };

const moodLabels = {
  productive: 'Productive',
  average: 'Average',
  low: 'Low',
};

export const dashboardTabs = [
  { key: 'overview', label: 'Overview', hint: 'Daily snapshot' },
  { key: 'performance', label: 'Performance', hint: 'Goals and trends' },
  { key: 'integrations', label: 'Integrations', hint: 'API connections' },
  { key: 'rag', label: 'RAG Workspace', hint: 'AI pipeline' },
];

export const reportWindowTabs = [
  { key: 'day', label: 'Day on day' },
  { key: 'week', label: 'Week on week' },
  { key: 'month', label: 'Month on month' },
];

export const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, color: '#cbd5e1' },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      ticks: { color: '#94a3b8' },
    },
    y: {
      stacked: true,
      title: { display: true, text: 'Minutes', color: '#94a3b8' },
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
    },
  },
};


export function useDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const [integrationBanner, setIntegrationBanner] = useState(null);
const [integrationStatus, setIntegrationStatus] = useState(null);
const [ytSummary, setYtSummary] = useState(null);
const [igSummary, setIgSummary] = useState(null);
const [ghSummary, setGhSummary] = useState(null);
const [wtSummary, setWtSummary] = useState(null);
const [igSummaryError, setIgSummaryError] = useState('');
const [ghError, setGhError] = useState('');
const [wtError, setWtError] = useState('');
const [integrationsLoading, setIntegrationsLoading] = useState(false);

const [goals, setGoals] = useState(null);
const [insights, setInsights] = useState(null);
const [todayLog, setTodayLog] = useState(null);
const [allLogs, setAllLogs] = useState([]);
const [projects, setProjects] = useState([]);

const [form, setForm] = useState({
  steps: 0,
  instagram: 0,
  totalScreen: 0,
  codingHours: 0,
  mood: 'average',
  notes: '',
});

const [metricsForm, setMetricsForm] = useState(emptyMetricsForm());

const [newProject, setNewProject] = useState({
  name: '',
  status: 'active',
  hoursSpent: 0,
  description: '',
});

const [goalsForm, setGoalsForm] = useState({ dailyStepsGoal: 8000, dailyCodingGoal: 4 });
const [goalsSubmitting, setGoalsSubmitting] = useState(false);

const [formSubmitting, setFormSubmitting] = useState(false);
const [projectSubmitting, setProjectSubmitting] = useState(false);

const [igManualPageToken, setIgManualPageToken] = useState('');
const [igManualIgUserId, setIgManualIgUserId] = useState('');
const [igUserAccessToken, setIgUserAccessToken] = useState('');
const [igManualBusy, setIgManualBusy] = useState(false);
const [igUserTokenBusy, setIgUserTokenBusy] = useState(false);
/** Shown under Option A so you don’t miss validation errors (global error is easy to miss). */
const [igManualError, setIgManualError] = useState('');
const [ghToken, setGhToken] = useState('');
const [ghBusy, setGhBusy] = useState(false);
const [wtApiKey, setWtApiKey] = useState('');
const [wtBusy, setWtBusy] = useState(false);
const [showDetailedIntegrations, setShowDetailedIntegrations] = useState(false);

const today = useMemo(() => todayISO(), []);
const [selectedDate, setSelectedDate] = useState(todayISO());
const [chartWindowOffset, setChartWindowOffset] = useState(0);
const [currentTheme, setCurrentTheme] = useState('night');
const isDayTheme = useMemo(() => currentTheme === 'day', [currentTheme]);
const [activeTab, setActiveTab] = useState('overview');
const [reportWindow, setReportWindow] = useState('day');
/** Last 7 days from DB, or synthetic week so charts always show a useful preview. */
function buildDemoWeekLogs() {
  const moods = ['productive', 'average', 'low'];
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    const wave = 6 - i;
    out.push({
      date,
      steps: 5100 + wave * 320,
      screenTime: { instagram: 18 + wave * 6, total: 125 + wave * 14 },
      codingHours: Math.round((1.25 + (wave % 5) * 0.85) * 100) / 100,
      mood: moods[wave % 3],
      notes: '',
    });
  }
  return out;
}

const chartWeek = useMemo(() => {
  const sorted = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) {
    return { logs: buildDemoWeekLogs(), isDemo: true };
  }
  const safeOffset = Math.max(0, Number(chartWindowOffset) || 0);
  const end = Math.max(0, sorted.length - safeOffset);
  const start = Math.max(0, end - 7);
  const logs = sorted.slice(start, end);
  return { logs: logs.length ? logs : sorted.slice(-7), isDemo: false };
}, [allLogs, chartWindowOffset]);

const [sampleWeekBusy, setSampleWeekBusy] = useState(false);

function instagramPreviewSummary(username = '') {
  return {
    username: username || 'your_instagram',
    biography:
      'Connected, but live Instagram metrics are currently unavailable. Re-sync token to fetch real values.',
    followersCount: null,
    followsCount: null,
    mediaCount: null,
    recentMedia: [],
    note: 'No demo numbers are shown. Values appear only when live Instagram API returns data.',
  };
}

async function insertSampleWeek() {
  setSampleWeekBusy(true);
  setError('');
  try {
    const moods = ['productive', 'average', 'low'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const date = d.toISOString().slice(0, 10);
      const wave = 6 - i;
      await logsApi.create({
        date,
        steps: 5100 + wave * 320,
        screenTime: { instagram: 18 + wave * 6, total: 125 + wave * 14 },
        codingHours: Math.round((1.25 + (wave % 5) * 0.85) * 100) / 100,
        mood: moods[wave % 3],
        notes: wave === 6 ? 'Sample week (you can edit or delete)' : '',
      });
    }
    await load();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not save sample week');
  } finally {
    setSampleWeekBusy(false);
  }
}

const lineChartData = useMemo(() => ({
  labels: chartWeek.logs.map((l) => l.date.slice(5)),
  datasets: [
    {
      label: 'Steps',
      data: chartWeek.logs.map((l) => l.steps),
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.2)',
      fill: true,
      tension: 0.35,
      yAxisID: 'y',
    },
    {
      label: 'Coding hours',
      data: chartWeek.logs.map((l) => l.codingHours),
      borderColor: '#94a3b8',
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      fill: true,
      tension: 0.35,
      yAxisID: 'y1',
    },
  ],
}), []);

const lineChartOptions = useMemo(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, color: '#cbd5e1' },
    },
  },
  scales: {
    y: {
      type: 'linear',
      position: 'left',
      title: { display: true, text: 'Steps', color: '#94a3b8' },
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(56, 189, 248, 0.14)' },
    },
    y1: {
      type: 'linear',
      position: 'right',
      title: { display: true, text: 'Hours', color: '#94a3b8' },
      ticks: { color: '#94a3b8' },
      grid: { drawOnChartArea: false },
    },
    x: {
      ticks: { color: '#94a3b8' },
      grid: { display: false },
    },
  },
}), []);

const barChartData = useMemo(() => {
  const logs = chartWeek.logs;
  const labels = logs.map((l) => l.date.slice(5));
  const ig = logs.map((l) => l.screenTime?.instagram ?? 0);
  const other = logs.map((l) => {
    const t = l.screenTime?.total ?? 0;
    const i = l.screenTime?.instagram ?? 0;
    return Math.max(0, t - i);
  });
  return {
    labels,
    datasets: [
      {
        label: 'Instagram (min)',
        data: ig,
        backgroundColor: 'rgba(14, 165, 233, 0.55)',
        borderRadius: 6,
      },
      {
        label: 'Other screen (min)',
        data: other,
        backgroundColor: 'rgba(148, 163, 184, 0.35)',
        borderRadius: 6,
      },
    ],
  };
}, [chartWeek]);

const sortedLogs = useMemo(
  () => [...allLogs].sort((a, b) => a.date.localeCompare(b.date)),
  [allLogs]
);

const selectedLog = useMemo(
  () => sortedLogs.find((l) => l.date === selectedDate) || null,
  [sortedLogs, selectedDate]
);
const latestLog = useMemo(() => sortedLogs[sortedLogs.length - 1] || null, [sortedLogs]);
const displayLog = useMemo(() => selectedLog || latestLog || todayLog || null, [selectedLog, latestLog, todayLog]);

const selectedDateLabel = useMemo(
  () => (selectedDate === today ? 'Today' : selectedDate),
  [selectedDate, today]
);

const chartWindowInfo = useMemo(() => {
  const logs = chartWeek.logs;
  const first = logs[0]?.date || null;
  const last = logs[logs.length - 1]?.date || null;
  const hasOlder = sortedLogs.length > chartWindowOffset + 7;
  const hasNewer = chartWindowOffset > 0;
  return { first, last, hasOlder, hasNewer };
});

const summarySteps = useMemo(
  () =>
    displayLog?.steps ??
    (selectedDate === today ? insights?.today?.steps : null) ??
    0,
  [displayLog, selectedDate, today, insights]
);
const summaryCoding = useMemo(
  () =>
    displayLog?.codingHours ??
    (selectedDate === today ? insights?.today?.codingHours : null) ??
    0,
  [displayLog, selectedDate, today, insights]
);
const summaryIg = useMemo(() => {
  const m = displayLog?.screenTime?.instagram;
  if (m != null) return `${m} min`;
  if (selectedDate === today && insights?.today?.instagramMinutes != null) {
    return `${insights.today.instagramMinutes} min`;
  }
  return '0 min';
});
const summaryMood = useMemo(() => {
  const m =
    displayLog?.mood ??
    (selectedDate === today ? insights?.today?.mood : null);
  return m ? moodLabels[m] || m : '—';
});

const [showAdvancedLog, setShowAdvancedLog] = useState(false);

const yesterdayLog = useMemo(() => {
  const logs = sortedLogs;
  if (!logs.length) return null;
  const todayIdx = logs.findIndex((l) => l.date === today);
  if (todayIdx > 0) return logs[todayIdx - 1];
  if (todayIdx === -1) return logs[logs.length - 1] || null;
  return null;
});

const todayScore = useMemo(() => {
  const stepsNow = asNumber(
    displayLog?.steps ??
      (selectedDate === today ? insights?.today?.steps : null)
  );
  const codingNow = asNumber(
    displayLog?.codingHours ??
      (selectedDate === today ? insights?.today?.codingHours : null)
  );
  const igNow = asNumber(
    displayLog?.screenTime?.instagram ??
      (selectedDate === today ? insights?.today?.instagramMinutes : null)
  );

  let score = 30;
  score += Math.min(25, Math.round((codingNow / Math.max(1, goals?.dailyCodingGoal || 4)) * 25));
  score += Math.min(25, Math.round((stepsNow / Math.max(1, goals?.dailyStepsGoal || 8000)) * 25));
  score += igNow <= 30 ? 20 : igNow <= 60 ? 12 : 4;
  return Math.max(0, Math.min(100, score));
});

const codingDelta = useMemo(() => {
  const now = asNumber(
    displayLog?.codingHours ??
      (selectedDate === today ? insights?.today?.codingHours : null)
  );
  const prev = asNumber(yesterdayLog?.codingHours);
  if (!now && !prev) return null;
  if (!prev) return { sign: '+', pct: 100, text: `Started tracking at ${now.toFixed(1)}h` };
  const delta = ((now - prev) / Math.max(0.25, prev)) * 100;
  const sign = delta >= 0 ? '+' : '';
  return {
    sign,
    pct: Math.round(delta),
    text: `${now.toFixed(1)}h (${sign}${Math.round(delta)}% vs yesterday)`,
  };
});

const focusStatus = useMemo(() => {
  const igNow = asNumber(
    displayLog?.screenTime?.instagram ??
      (selectedDate === today ? insights?.today?.instagramMinutes : null)
  );
  if (igNow >= 90) return { label: 'High distraction', tone: 'text-red-300' };
  if (igNow >= 45) return { label: 'Moderate focus', tone: 'text-sky-300/90' };
  return { label: 'Strong focus', tone: 'text-teal-200' };
});

const chartInsights = useMemo(() => {
  const logs = chartWeek.logs || [];
  if (logs.length < 2) return [];
  const coding = logs.map((l) => asNumber(l.codingHours));
  const first = coding[0];
  const last = coding[coding.length - 1];
  const bestIdx = coding.reduce((best, cur, idx, arr) => (cur > arr[best] ? idx : best), 0);
  const weekendDrop = logs
    .filter((l) => ['6', '0'].includes(String(new Date(`${l.date}T00:00:00Z`).getUTCDay())))
    .reduce((s, l) => s + asNumber(l.codingHours), 0);
  const weekdayCount = Math.max(1, logs.length - 2);
  const weekdayAvg =
    logs
      .filter((l) => !['6', '0'].includes(String(new Date(`${l.date}T00:00:00Z`).getUTCDay())))
      .reduce((s, l) => s + asNumber(l.codingHours), 0) / weekdayCount;
  const weekendAvg = weekendDrop / 2;
  const growthPct = first ? Math.round(((last - first) / Math.max(0.25, first)) * 100) : 0;
  return [
    `${growthPct >= 0 ? '⬆' : '⬇'} Coding ${growthPct >= 0 ? 'increased' : 'decreased'} by ${Math.abs(growthPct)}% over this window`,
    `🎯 Best day: ${logs[bestIdx]?.date || '—'} (${coding[bestIdx].toFixed(1)}h)`,
    `📉 Weekend pattern: ${weekendAvg < weekdayAvg ? 'lower output than weekdays' : 'stable with weekdays'}`,
  ];
});

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function scaleTo100(value, maxExpected) {
  const safeMax = Math.max(1, asNumber(maxExpected));
  return Math.min(100, Math.round((asNumber(value) / safeMax) * 100));
}

const integrationHealth = useMemo(() => {
  const s = integrationStatus || {};
  const connected = [
    Boolean(s.youtube?.connected),
    Boolean(s.instagram?.connected),
    Boolean(s.github?.connected),
    Boolean(s.wakatime?.connected),
  ].filter(Boolean).length;
  const total = 4;
  const pct = Math.round((connected / total) * 100);
  return { connected, total, pct };
});

const stepsGoalPct = useMemo(() => {
  const goal = asNumber(goals?.dailyStepsGoal);
  if (!goal) return 0;
  return Math.min(100, Math.round((asNumber(summarySteps) / goal) * 100));
});

const codingGoalPct = useMemo(() => {
  const goal = asNumber(goals?.dailyCodingGoal);
  if (!goal) return 0;
  return Math.min(100, Math.round((asNumber(summaryCoding) / goal) * 100));
});

const commandCenterCards = useMemo(() => [
  {
    key: 'yt',
    title: 'YouTube',
    value:
      ytSummary?.subscriberCount != null
        ? `${ytSummary.subscriberCount} subscribers`
        : 'Not connected',
    sub: ytSummary
      ? `${ytSummary.likedVideos?.length || 0} recent likes`
      : 'Connect to pull channel signals',
  },
  {
    key: 'wt',
    title: 'WakaTime',
    value: wtSummary?.todayText || 'Not connected',
    sub: wtSummary
      ? `7d: ${wtSummary.totalText7d || '0 secs'}`
      : 'Connect API key to import coding time',
  },
  {
    key: 'gh',
    title: 'GitHub',
    value:
      ghSummary?.commitsLast7Days != null
        ? `${ghSummary.commitsLast7Days} commits (7d)`
        : 'Not connected',
    sub: ghSummary
      ? `${ghSummary.eventsLast7Days || 0} events in 7 days`
      : 'Connect via OAuth or PAT under Integrations',
  },
  {
    key: 'ig',
    title: 'Instagram',
    value:
      igSummary?.followersCount != null
        ? `${igSummary.followersCount} followers`
        : 'Not connected',
    sub: igSummary
      ? `${igSummary.mediaCount ?? 0} posts tracked`
      : 'Connect token to import profile stats',
  },
  {
    key: 'sync',
    title: 'Integration health',
    value: `${integrationHealth.connected}/${integrationHealth.total} connected`,
    sub: `${integrationHealth.pct}% of command center online`,
  },
]);

const [showPlatformPulse, setShowPlatformPulse] = useState(true);

const platform3dRows = useMemo(() => {
  const s = integrationStatus || {};
  const youtubeLikes = asNumber(ytSummary?.likedVideos?.length);
  const youtubeSubs = asNumber(ytSummary?.subscriberCount);
  const igFollowers = asNumber(igSummary?.followersCount);
  const igPosts = asNumber(igSummary?.mediaCount);
  const ghCommits = asNumber(ghSummary?.commitsLast7Days);
  const ghEvents = asNumber(ghSummary?.eventsLast7Days);
  const wtTodayHours = asNumber(wtSummary?.todaySeconds) / 3600;
  const wtWeekHours = asNumber(wtSummary?.totalSeconds7d) / 3600;

  const rows = [
    {
      name: 'Instagram',
      connected: Boolean(s.instagram?.connected),
      intensity: scaleTo100(igFollowers, 5000),
      consistency: scaleTo100(igPosts, 200),
    },
    {
      name: 'GitHub',
      connected: Boolean(s.github?.connected),
      intensity: scaleTo100(ghCommits, 40),
      consistency: scaleTo100(ghEvents, 120),
    },
    {
      name: 'WakaTime',
      connected: Boolean(s.wakatime?.connected),
      intensity: scaleTo100(wtTodayHours, 8),
      consistency: scaleTo100(wtWeekHours, 45),
    },
    {
      name: 'YouTube',
      connected: Boolean(s.youtube?.connected),
      intensity: scaleTo100(youtubeSubs, 5000),
      consistency: scaleTo100(youtubeLikes, 30),
    },
  ];
  const filtered = rows.filter((r) => r.connected || r.intensity + r.consistency > 0);
  return filtered.length ? filtered : rows;
});

const platform3dData = useMemo(() => ({
  labels: platform3dRows.map((r) => r.name),
  datasets: [
    {
      label: 'Intensity score',
      data: platform3dRows.map((r) => r.intensity),
      backgroundColor:
        currentTheme === 'day' ? 'rgba(59, 130, 246, 0.84)' : 'rgba(56, 189, 248, 0.82)',
      borderColor: currentTheme === 'day' ? '#1d4ed8' : '#d8b36d',
      borderWidth: 1.2,
      borderRadius: 8,
    },
    {
      label: 'Consistency score',
      data: platform3dRows.map((r) => r.consistency),
      backgroundColor:
        currentTheme === 'day' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(148, 163, 184, 0.75)',
      borderColor: currentTheme === 'day' ? '#6366f1' : '#cbd5e1',
      borderWidth: 1.2,
      borderRadius: 8,
    },
  ],
}), []);

const platformPulseBreakdown = useMemo(() =>
  platform3dRows.map((r) => ({
    name: r.name,
    score: Math.round((r.intensity + r.consistency) / 2),
    reason:
      r.name === 'GitHub'
        ? `${asNumber(ghSummary?.commitsLast7Days)} commits in 7d`
        : r.name === 'WakaTime'
          ? `${wtSummary?.todayText || 'No today data'}`
          : r.name === 'Instagram'
            ? `${asNumber(igSummary?.followersCount)} followers`
            : `${asNumber(ytSummary?.subscriberCount)} subscribers`,
  }))
);

const platformPulseScore = useMemo(() => {
  const list = platformPulseBreakdown;
  if (!list.length) return 0;
  return Math.round(list.reduce((s, x) => s + x.score, 0) / list.length);
});

const platform3dOptions = useMemo(() => {
  const day = currentTheme === 'day';
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          color: day ? '#334155' : '#cbd5e1',
        },
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            return `${ctx.dataset.label}: ${ctx.parsed.y}/100`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: day ? '#64748b' : '#94a3b8' },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: day ? '#64748b' : '#94a3b8' },
        grid: { color: day ? 'rgba(71, 85, 105, 0.12)' : 'rgba(148, 163, 184, 0.14)' },
        title: { display: true, text: 'Score', color: day ? '#64748b' : '#94a3b8' },
      },
    },
  };
});

function isTokenExpired(iso) {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return t <= Date.now();
}

function openIntegrationsManager() {
  setShowDetailedIntegrations(true);
  setTimeout(() => {
    const el = document.getElementById('integration-manager');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}

const integrationOverview = useMemo(() => {
  const s = integrationStatus || {};
  const igExpired = isTokenExpired(s.instagram?.tokenExpiresAt);
  return [
    {
      key: 'youtube',
      name: 'YouTube',
      connected: Boolean(s.youtube?.connected),
      detail: s.youtube?.connected
        ? s.youtube.channelTitle || 'Connected'
        : 'Not connected',
      warning: '',
    },
    {
      key: 'instagram',
      name: 'Instagram',
      connected: Boolean(s.instagram?.connected),
      detail: s.instagram?.connected
        ? s.instagram.username
          ? `@${s.instagram.username}`
          : 'Connected'
        : 'Not connected',
      warning: igExpired ? 'Token expired — reconnect required' : '',
    },
    {
      key: 'github',
      name: 'GitHub',
      connected: Boolean(s.github?.connected),
      detail: s.github?.connected
        ? s.github.username || 'Connected'
        : 'Not connected',
      warning: ghError ? 'Needs attention' : '',
    },
    {
      key: 'wakatime',
      name: 'WakaTime',
      connected: Boolean(s.wakatime?.connected),
      detail: s.wakatime?.connected
        ? wtSummary?.todayText || 'Connected'
        : 'Not connected',
      warning: wtError ? 'Needs attention' : '',
    },
  ];
});

function summaryMetric(key) {
  const v = displayLog?.metrics?.[key];
  if (v == null || v === '') {
    if (key === 'caloriesBurned') {
      const steps = Number(displayLog?.steps || 0);
      return steps ? `${Math.round(steps * 0.04)}` : 'Not logged';
    }
    return 'Not logged';
  }
  if (key === 'sleepHours') return `${v} hrs`;
  return String(v);
}

function hydrateFormFromSelectedDate() {
  const log = selectedLog;
  if (!log) {
    setForm({
      steps: 0,
      instagram: 0,
      totalScreen: 0,
      codingHours: 0,
      mood: 'average',
      notes: '',
    });
    setMetricsForm(emptyMetricsForm());
    return;
  }
  setForm({
    steps: log.steps,
    instagram: log.screenTime?.instagram ?? 0,
    totalScreen: log.screenTime?.total ?? 0,
    codingHours: log.codingHours,
    mood: log.mood,
    notes: log.notes ?? '',
  });
  setMetricsForm(metricsFromServer(log.metrics));
}

function shiftSelectedDate(days) {
  const d = new Date(`${selectedDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  setSelectedDate(d.toISOString().slice(0, 10));
}

function shiftChartWindow(days) {
  const maxOffset = Math.max(0, sortedLogs.length - 7);
  const next = chartWindowOffset + days;
  setChartWindowOffset(Math.max(0, Math.min(maxOffset, next)));
}

async function load() {
  setLoading(true);
  setError('');
  try {
    const [g, ins, logs, projs] = await Promise.all([
      goalsApi.get(),
      insightsApi.today(),
      logsApi.list(),
      projectsApi.list(),
    ]);
    setGoals(g.data);
    setGoalsForm({
      dailyStepsGoal: g.data.dailyStepsGoal,
      dailyCodingGoal: g.data.dailyCodingGoal,
    });
    setInsights(ins.data);
    setAllLogs(logs.data);
    setProjects(projs.data);

    setTodayLog(logs.data.find((x) => x.date === today) || null);
    hydrateFormFromSelectedDate();
    await loadIntegrations();
  } catch (e) {
    setError(
      e.response?.data?.error ||
        e.message ||
        'Failed to load dashboard. Is the API running?'
    );
  } finally {
    setLoading(false);
  }
}

async function loadIntegrations() {
  setIntegrationsLoading(true);
  setIgSummaryError('');
  setGhError('');
  setWtError('');
  try {
    setYtSummary(null);
    setIgSummary(null);
    setGhSummary(null);
    setWtSummary(null);

    let { data } = await integrationsApi.status();
    if (!data.github?.connected) {
      try {
        const gh = await integrationsApi.githubSummary();
        if (gh.data?.connected && gh.data?.summary) {
          data = {
            ...data,
            github: {
              ...data.github,
              connected: true,
              username: gh.data.summary.username || data.github?.username || '',
            },
          };
          setGhSummary(gh.data.summary);
        }
      } catch {
        /* status is source of truth if summary fails */
      }
    }
    setIntegrationStatus(data);
    if (data.youtube?.connected) {
      try {
        const s = await integrationsApi.youtubeSummary();
        setYtSummary(s.data.summary);
      } catch {
        setYtSummary(null);
      }
    }
    if (data.instagram?.connected) {
      try {
        const s = await integrationsApi.instagramSummary();
        setIgSummary(s.data.summary);
      } catch (e) {
        setIgSummaryError(
          e.response?.data?.error ||
            e.message ||
            'Instagram is connected but the API did not return profile stats.'
        );
        setIgSummary(instagramPreviewSummary(data.instagram.username || ''));
      }
    }
    if (data.github?.connected && !ghSummary) {
      try {
        const s = await integrationsApi.githubSummary();
        setGhSummary(s.data.summary);
      } catch (e) {
        setGhError(e.response?.data?.error || e.message || 'Could not load GitHub summary.');
      }
    }
    if (data.wakatime?.connected) {
      try {
        const s = await integrationsApi.wakatimeSummary();
        setWtSummary(s.data.summary);
      } catch (e) {
        setWtError(e.response?.data?.error || e.message || 'Could not load WakaTime summary.');
      }
    }
  } catch {
    setIntegrationStatus(null);
  } finally {
    setIntegrationsLoading(false);
  }
}

function connectYoutube() {
  window.location.href = integrationOAuthStartUrl('youtube');
}

function connectInstagram() {
  window.location.href = integrationOAuthStartUrl('instagram');
}

async function disconnectYoutube() {
  setError('');
  try {
    await integrationsApi.youtubeDisconnect();
    await loadIntegrations();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not disconnect YouTube');
  }
}

async function disconnectInstagram() {
  setError('');
  try {
    await integrationsApi.instagramDisconnect();
    await loadIntegrations();
    setIgManualPageToken('');
    setIgManualIgUserId('');
    setIgUserAccessToken('');
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not disconnect Instagram');
  }
}

async function submitGithubToken() {
  setGhBusy(true);
  setGhError('');
  setError('');
  try {
    await integrationsApi.githubConnect({
      personalAccessToken: ghToken.trim(),
    });
    setGhToken('');
    setIntegrationBanner({
      kind: 'success',
      text: 'GitHub connected. Recent activity is now available below.',
    });
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not connect GitHub token.';
    setGhError(msg);
    setError(msg);
  } finally {
    setGhBusy(false);
  }
}

async function disconnectGithub() {
  setGhError('');
  setError('');
  try {
    await integrationsApi.githubDisconnect();
    setGhSummary(null);
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not disconnect GitHub.';
    setGhError(msg);
    setError(msg);
  }
}

async function submitWakaTimeKey() {
  setWtBusy(true);
  setWtError('');
  setError('');
  try {
    await integrationsApi.wakatimeConnect({ apiKey: wtApiKey.trim() });
    setWtApiKey('');
    setIntegrationBanner({
      kind: 'success',
      text: 'WakaTime connected. Coding summary is now available below.',
    });
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not connect WakaTime.';
    setWtError(msg);
    setError(msg);
  } finally {
    setWtBusy(false);
  }
}

async function disconnectWakaTime() {
  setWtError('');
  setError('');
  try {
    await integrationsApi.wakatimeDisconnect();
    setWtSummary(null);
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not disconnect WakaTime.';
    setWtError(msg);
    setError(msg);
  }
}

async function submitInstagramManual() {
  setIgManualError('');
  const tok = igManualPageToken.trim();
  const id = igManualIgUserId.trim();
  if (!/^\d{8,30}$/.test(id)) {
    const msg =
      'Instagram User ID must be digits only (e.g. 17841407995283128 from Graph API). Do not put your email here.';
    setIgManualError(msg);
    setError(msg);
    return;
  }
  // Meta user/page tokens are long; allow common chars in signed tokens
  if (tok.includes('@') || !/^EAA[a-zA-Z0-9_-]{50,}$/.test(tok)) {
    const msg =
      'Page access token must be the long Meta token from Graph API (starts with EAA…). Not your password or email.';
    setIgManualError(msg);
    setError(msg);
    return;
  }
  setIgManualBusy(true);
  setError('');
  try {
    await integrationsApi.instagramManual({
      pageAccessToken: tok,
      igUserId: id,
    });
    setIgManualPageToken('');
    setIgManualIgUserId('');
    setIgManualError('');
    setIntegrationBanner({
      kind: 'success',
      text: 'Instagram connected with your Page token. Profile data loads below.',
    });
    await loadIntegrations();
  } catch (e) {
    let msg =
      e.response?.data?.error || e.message || 'Invalid Page token or Instagram User ID';
    if (e.response?.status === 401) {
      msg = 'Not logged in. Log in on this site again, then save (session expired).';
    }
    setIgManualError(msg);
    setError(msg);
  } finally {
    setIgManualBusy(false);
  }
}

async function submitInstagramUserToken() {
  setIgUserTokenBusy(true);
  setError('');
  try {
    await integrationsApi.instagramFromUserToken({
      userAccessToken: igUserAccessToken.trim(),
    });
    setIgUserAccessToken('');
    setIntegrationBanner({
      kind: 'success',
      text: 'Instagram connected from user token. Profile data loads below.',
    });
    await loadIntegrations();
  } catch (e) {
    setError(
      e.response?.data?.error ||
        e.message ||
        'Token could not load Instagram. It needs instagram_basic + pages_show_list (not public_profile only).'
    );
  } finally {
    setIgUserTokenBusy(false);
  }
}

async function submitLog() {
  setFormSubmitting(true);
  setError('');
  try {
    await logsApi.create({
      date: selectedDate,
      steps: Number(form.steps),
      screenTime: {
        instagram: Number(form.instagram),
        total: Number(form.totalScreen),
      },
      codingHours: Number(form.codingHours),
      mood: form.mood,
      notes: form.notes,
      metrics: metricsToPayload(metricsForm),
    });
    await load();
  } catch (e) {
    const msg =
      e.response?.data?.error ||
      (e.response?.data?.errors && JSON.stringify(e.response.data.errors)) ||
      e.message;
    setError(typeof msg === 'string' ? msg : 'Could not save log');
  } finally {
    setFormSubmitting(false);
  }
}

async function addProject() {
  setProjectSubmitting(true);
  setError('');
  try {
    await projectsApi.create({
      name: newProject.name,
      status: newProject.status,
      hoursSpent: Number(newProject.hoursSpent),
      description: newProject.description,
    });
    setNewProject({
      name: '',
      status: 'active',
      hoursSpent: 0,
      description: '',
    });
    await load();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not create project');
  } finally {
    setProjectSubmitting(false);
  }
}

async function updateProjectStatus(id, status) {
  setError('');
  try {
    await projectsApi.update(id, { status });
    await load();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not update project');
  }
}

async function saveGoals() {
  setGoalsSubmitting(true);
  setError('');
  try {
    await goalsApi.save({
      dailyStepsGoal: Number(goalsForm.dailyStepsGoal),
      dailyCodingGoal: Number(goalsForm.dailyCodingGoal),
    });
    await load();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Could not save goals');
  } finally {
    setGoalsSubmitting(false);
  }
}

  useEffect(() => {
    setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'night');
    const observer = new MutationObserver(() => {
      setCurrentTheme(document.documentElement.getAttribute('data-theme') || 'night');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const integration = searchParams.get('integration');
    const msg = searchParams.get('msg');
    if (integration === 'youtube_ok') {
      setIntegrationBanner({ kind: 'success', text: 'YouTube connected.' });
    } else if (integration === 'instagram_ok') {
      setIntegrationBanner({ kind: 'success', text: 'Instagram connected.' });
    } else if (integration === 'github_ok') {
      setIntegrationBanner({
        kind: 'success',
        text: 'GitHub connected. Summary data loads below.',
      });
    } else if (
      integration === 'youtube_err' ||
      integration === 'instagram_err' ||
      integration === 'github_err'
    ) {
      setIntegrationBanner({
        kind: 'error',
        text: `Connection failed: ${msg ? String(msg).replace(/_/g, ' ') : 'unknown error'}`,
      });
    }
    (async () => {
      await load();
      if (integration) {
        navigate({ pathname: location.pathname, search: '' }, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    hydrateFormFromSelectedDate();
  }, [selectedDate, selectedLog]);

  return {
    moodLabels,
    dashboardTabs,
    reportWindowTabs,
    barChartOptions,
    loading,
    error,
    integrationBanner,
    setIntegrationBanner,
    integrationStatus,
    ytSummary,
    igSummary,
    ghSummary,
    wtSummary,
    igSummaryError,
    ghError,
    wtError,
    integrationsLoading,
    goals,
    insights,
    todayLog,
    allLogs,
    projects,
    form,
    setForm,
    metricsForm,
    setMetricsForm,
    newProject,
    setNewProject,
    goalsForm,
    setGoalsForm,
    goalsSubmitting,
    formSubmitting,
    projectSubmitting,
    igManualPageToken,
    setIgManualPageToken,
    igManualIgUserId,
    setIgManualIgUserId,
    igUserAccessToken,
    setIgUserAccessToken,
    igManualBusy,
    igUserTokenBusy,
    igManualError,
    ghToken,
    setGhToken,
    ghBusy,
    wtApiKey,
    setWtApiKey,
    wtBusy,
    showDetailedIntegrations,
    setShowDetailedIntegrations,
    today,
    selectedDate,
    setSelectedDate,
    chartWindowOffset,
    currentTheme,
    isDayTheme,
    activeTab,
    setActiveTab,
    reportWindow,
    setReportWindow,
    sampleWeekBusy,
    showAdvancedLog,
    setShowAdvancedLog,
    showPlatformPulse,
    setShowPlatformPulse,
    chartWeek,
    lineChartData,
    lineChartOptions,
    barChartData,
    sortedLogs,
    selectedLog,
    displayLog,
    selectedDateLabel,
    chartWindowInfo,
    summarySteps,
    summaryCoding,
    summaryIg,
    summaryMood,
    yesterdayLog,
    todayScore,
    codingDelta,
    focusStatus,
    chartInsights,
    integrationHealth,
    stepsGoalPct,
    codingGoalPct,
    commandCenterCards,
    platform3dRows,
    platform3dData,
    platformPulseBreakdown,
    platformPulseScore,
    platform3dOptions,
    integrationOverview,
    insertSampleWeek,
    connectYoutube,
    connectInstagram,
    disconnectYoutube,
    disconnectInstagram,
    submitGithubToken,
    disconnectGithub,
    submitWakaTimeKey,
    disconnectWakaTime,
    submitInstagramManual,
    submitInstagramUserToken,
    submitLog,
    addProject,
    updateProjectStatus,
    saveGoals,
    shiftSelectedDate,
    shiftChartWindow,
    summaryMetric,
    openIntegrationsManager,
  };
}
