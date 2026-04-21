<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';
import BrandLogo from '../components/BrandLogo.vue';
import StatCard from '../components/StatCard.vue';
import ChartCard from '../components/ChartCard.vue';
import ProjectCard from '../components/ProjectCard.vue';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');

const integrationBanner = ref(null);
const integrationStatus = ref(null);
const ytSummary = ref(null);
const igSummary = ref(null);
const ghSummary = ref(null);
const wtSummary = ref(null);
const igSummaryError = ref('');
const ghError = ref('');
const wtError = ref('');
const integrationsLoading = ref(false);

const goals = ref(null);
const insights = ref(null);
const todayLog = ref(null);
const allLogs = ref([]);
const projects = ref([]);

const form = ref({
  steps: 0,
  instagram: 0,
  totalScreen: 0,
  codingHours: 0,
  mood: 'average',
  notes: '',
});

const metricsForm = ref(emptyMetricsForm());

const newProject = ref({
  name: '',
  status: 'active',
  hoursSpent: 0,
  description: '',
});

const goalsForm = ref({ dailyStepsGoal: 8000, dailyCodingGoal: 4 });
const goalsSubmitting = ref(false);

const formSubmitting = ref(false);
const projectSubmitting = ref(false);

const igManualPageToken = ref('');
const igManualIgUserId = ref('');
const igUserAccessToken = ref('');
const igManualBusy = ref(false);
const igUserTokenBusy = ref(false);
/** Shown under Option A so you don’t miss validation errors (global error is easy to miss). */
const igManualError = ref('');
const ghToken = ref('');
const ghBusy = ref(false);
const wtApiKey = ref('');
const wtBusy = ref(false);
const showDetailedIntegrations = ref(false);

const today = computed(() => todayISO());
const selectedDate = ref(todayISO());
const chartWindowOffset = ref(0);
const currentTheme = ref('night');
const isDayTheme = computed(() => currentTheme.value === 'day');
const activeTab = ref('overview');
const reportWindow = ref('day');
const reportWindowTabs = [
  { key: 'day', label: 'Day on day' },
  { key: 'week', label: 'Week on week' },
  { key: 'month', label: 'Month on month' },
];

const dashboardTabs = [
  { key: 'overview', label: 'Overview', hint: 'Daily snapshot' },
  { key: 'performance', label: 'Performance', hint: 'Goals and trends' },
  { key: 'integrations', label: 'Integrations', hint: 'API connections' },
  { key: 'rag', label: 'RAG Workspace', hint: 'AI pipeline' },
];
const dashboardTabIcons = {
  overview: '◻',
  performance: '▣',
  integrations: '◉',
  rag: '◇',
};

const moodLabels = {
  productive: 'Productive',
  average: 'Average',
  low: 'Low',
};

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

const chartWeek = computed(() => {
  const sorted = [...allLogs.value].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) {
    return { logs: buildDemoWeekLogs(), isDemo: true };
  }
  const safeOffset = Math.max(0, Number(chartWindowOffset.value) || 0);
  const end = Math.max(0, sorted.length - safeOffset);
  const start = Math.max(0, end - 7);
  const logs = sorted.slice(start, end);
  return { logs: logs.length ? logs : sorted.slice(-7), isDemo: false };
});

const sampleWeekBusy = ref(false);

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
  sampleWeekBusy.value = true;
  error.value = '';
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
    error.value =
      e.response?.data?.error || e.message || 'Could not save sample week';
  } finally {
    sampleWeekBusy.value = false;
  }
}

const lineChartData = computed(() => ({
  labels: chartWeek.value.logs.map((l) => l.date.slice(5)),
  datasets: [
    {
      label: 'Steps',
      data: chartWeek.value.logs.map((l) => l.steps),
      borderColor: '#C5A059',
      backgroundColor: 'rgba(197, 160, 89, 0.18)',
      fill: true,
      tension: 0.35,
      yAxisID: 'y',
    },
    {
      label: 'Coding hours',
      data: chartWeek.value.logs.map((l) => l.codingHours),
      borderColor: '#94a3b8',
      backgroundColor: 'rgba(148, 163, 184, 0.12)',
      fill: true,
      tension: 0.35,
      yAxisID: 'y1',
    },
  ],
}));

const lineChartOptions = computed(() => ({
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
      grid: { color: 'rgba(197, 160, 89, 0.12)' },
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
}));

const barChartData = computed(() => {
  const logs = chartWeek.value.logs;
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
        backgroundColor: 'rgba(197, 160, 89, 0.65)',
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
});

const barChartOptions = {
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

const sortedLogs = computed(() =>
  [...allLogs.value].sort((a, b) => a.date.localeCompare(b.date))
);

const selectedLog = computed(
  () => sortedLogs.value.find((l) => l.date === selectedDate.value) || null
);
const latestLog = computed(() => sortedLogs.value[sortedLogs.value.length - 1] || null);
const displayLog = computed(() => selectedLog.value || latestLog.value || todayLog.value || null);

const selectedDateLabel = computed(() =>
  selectedDate.value === today.value ? 'Today' : selectedDate.value
);

const chartWindowInfo = computed(() => {
  const logs = chartWeek.value.logs;
  const first = logs[0]?.date || null;
  const last = logs[logs.length - 1]?.date || null;
  const hasOlder = sortedLogs.value.length > chartWindowOffset.value + 7;
  const hasNewer = chartWindowOffset.value > 0;
  return { first, last, hasOlder, hasNewer };
});

const summarySteps = computed(
  () =>
    displayLog.value?.steps ??
    (selectedDate.value === today.value ? insights.value?.today?.steps : null) ??
    0
);
const summaryCoding = computed(
  () =>
    displayLog.value?.codingHours ??
    (selectedDate.value === today.value ? insights.value?.today?.codingHours : null) ??
    0
);
const summaryIg = computed(() => {
  const m = displayLog.value?.screenTime?.instagram;
  if (m != null) return `${m} min`;
  if (selectedDate.value === today.value && insights.value?.today?.instagramMinutes != null) {
    return `${insights.value.today.instagramMinutes} min`;
  }
  return '0 min';
});
const summaryMood = computed(() => {
  const m =
    displayLog.value?.mood ??
    (selectedDate.value === today.value ? insights.value?.today?.mood : null);
  return m ? moodLabels[m] || m : '—';
});

const showAdvancedLog = ref(false);

const yesterdayLog = computed(() => {
  const logs = sortedLogs.value;
  if (!logs.length) return null;
  const todayIdx = logs.findIndex((l) => l.date === today.value);
  if (todayIdx > 0) return logs[todayIdx - 1];
  if (todayIdx === -1) return logs[logs.length - 1] || null;
  return null;
});

const todayScore = computed(() => {
  const stepsNow = asNumber(
    displayLog.value?.steps ??
      (selectedDate.value === today.value ? insights.value?.today?.steps : null)
  );
  const codingNow = asNumber(
    displayLog.value?.codingHours ??
      (selectedDate.value === today.value ? insights.value?.today?.codingHours : null)
  );
  const igNow = asNumber(
    displayLog.value?.screenTime?.instagram ??
      (selectedDate.value === today.value ? insights.value?.today?.instagramMinutes : null)
  );

  let score = 30;
  score += Math.min(25, Math.round((codingNow / Math.max(1, goals.value?.dailyCodingGoal || 4)) * 25));
  score += Math.min(25, Math.round((stepsNow / Math.max(1, goals.value?.dailyStepsGoal || 8000)) * 25));
  score += igNow <= 30 ? 20 : igNow <= 60 ? 12 : 4;
  return Math.max(0, Math.min(100, score));
});

const codingDelta = computed(() => {
  const now = asNumber(
    displayLog.value?.codingHours ??
      (selectedDate.value === today.value ? insights.value?.today?.codingHours : null)
  );
  const prev = asNumber(yesterdayLog.value?.codingHours);
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

const focusStatus = computed(() => {
  const igNow = asNumber(
    displayLog.value?.screenTime?.instagram ??
      (selectedDate.value === today.value ? insights.value?.today?.instagramMinutes : null)
  );
  if (igNow >= 90) return { label: 'High distraction', tone: 'text-red-300' };
  if (igNow >= 45) return { label: 'Moderate focus', tone: 'text-amber-300' };
  return { label: 'Strong focus', tone: 'text-emerald-300' };
});

const chartInsights = computed(() => {
  const logs = chartWeek.value.logs || [];
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

const integrationHealth = computed(() => {
  const s = integrationStatus.value || {};
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

const stepsGoalPct = computed(() => {
  const goal = asNumber(goals.value?.dailyStepsGoal);
  if (!goal) return 0;
  return Math.min(100, Math.round((asNumber(summarySteps.value) / goal) * 100));
});

const codingGoalPct = computed(() => {
  const goal = asNumber(goals.value?.dailyCodingGoal);
  if (!goal) return 0;
  return Math.min(100, Math.round((asNumber(summaryCoding.value) / goal) * 100));
});

const commandCenterCards = computed(() => [
  {
    key: 'yt',
    title: 'YouTube',
    value:
      ytSummary.value?.subscriberCount != null
        ? `${ytSummary.value.subscriberCount} subscribers`
        : 'Not connected',
    sub: ytSummary.value
      ? `${ytSummary.value.likedVideos?.length || 0} recent likes`
      : 'Connect to pull channel signals',
  },
  {
    key: 'wt',
    title: 'WakaTime',
    value: wtSummary.value?.todayText || 'Not connected',
    sub: wtSummary.value
      ? `7d: ${wtSummary.value.totalText7d || '0 secs'}`
      : 'Connect API key to import coding time',
  },
  {
    key: 'gh',
    title: 'GitHub',
    value:
      ghSummary.value?.commitsLast7Days != null
        ? `${ghSummary.value.commitsLast7Days} commits (7d)`
        : 'Not connected',
    sub: ghSummary.value
      ? `${ghSummary.value.eventsLast7Days || 0} events in 7 days`
      : 'Connect via OAuth or PAT under Integrations',
  },
  {
    key: 'ig',
    title: 'Instagram',
    value:
      igSummary.value?.followersCount != null
        ? `${igSummary.value.followersCount} followers`
        : 'Not connected',
    sub: igSummary.value
      ? `${igSummary.value.mediaCount ?? 0} posts tracked`
      : 'Connect token to import profile stats',
  },
  {
    key: 'sync',
    title: 'Integration health',
    value: `${integrationHealth.value.connected}/${integrationHealth.value.total} connected`,
    sub: `${integrationHealth.value.pct}% of command center online`,
  },
]);

const showPlatformPulse = ref(true);

const platform3dRows = computed(() => {
  const s = integrationStatus.value || {};
  const youtubeLikes = asNumber(ytSummary.value?.likedVideos?.length);
  const youtubeSubs = asNumber(ytSummary.value?.subscriberCount);
  const igFollowers = asNumber(igSummary.value?.followersCount);
  const igPosts = asNumber(igSummary.value?.mediaCount);
  const ghCommits = asNumber(ghSummary.value?.commitsLast7Days);
  const ghEvents = asNumber(ghSummary.value?.eventsLast7Days);
  const wtTodayHours = asNumber(wtSummary.value?.todaySeconds) / 3600;
  const wtWeekHours = asNumber(wtSummary.value?.totalSeconds7d) / 3600;

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

const platform3dData = computed(() => ({
  labels: platform3dRows.value.map((r) => r.name),
  datasets: [
    {
      label: 'Intensity score',
      data: platform3dRows.value.map((r) => r.intensity),
      backgroundColor:
        currentTheme.value === 'day' ? 'rgba(59, 130, 246, 0.84)' : 'rgba(197, 160, 89, 0.82)',
      borderColor: currentTheme.value === 'day' ? '#1d4ed8' : '#d8b36d',
      borderWidth: 1.2,
      borderRadius: 8,
    },
    {
      label: 'Consistency score',
      data: platform3dRows.value.map((r) => r.consistency),
      backgroundColor:
        currentTheme.value === 'day' ? 'rgba(99, 102, 241, 0.7)' : 'rgba(148, 163, 184, 0.75)',
      borderColor: currentTheme.value === 'day' ? '#6366f1' : '#cbd5e1',
      borderWidth: 1.2,
      borderRadius: 8,
    },
  ],
}));

const platformPulseBreakdown = computed(() =>
  platform3dRows.value.map((r) => ({
    name: r.name,
    score: Math.round((r.intensity + r.consistency) / 2),
    reason:
      r.name === 'GitHub'
        ? `${asNumber(ghSummary.value?.commitsLast7Days)} commits in 7d`
        : r.name === 'WakaTime'
          ? `${wtSummary.value?.todayText || 'No today data'}`
          : r.name === 'Instagram'
            ? `${asNumber(igSummary.value?.followersCount)} followers`
            : `${asNumber(ytSummary.value?.subscriberCount)} subscribers`,
  }))
);

const platformPulseScore = computed(() => {
  const list = platformPulseBreakdown.value;
  if (!list.length) return 0;
  return Math.round(list.reduce((s, x) => s + x.score, 0) / list.length);
});

const platform3dOptions = computed(() => {
  const day = currentTheme.value === 'day';
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
  showDetailedIntegrations.value = true;
  setTimeout(() => {
    const el = document.getElementById('integration-manager');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
}

const integrationOverview = computed(() => {
  const s = integrationStatus.value || {};
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
      warning: ghError.value ? 'Needs attention' : '',
    },
    {
      key: 'wakatime',
      name: 'WakaTime',
      connected: Boolean(s.wakatime?.connected),
      detail: s.wakatime?.connected
        ? wtSummary.value?.todayText || 'Connected'
        : 'Not connected',
      warning: wtError.value ? 'Needs attention' : '',
    },
  ];
});

function summaryMetric(key) {
  const v = displayLog.value?.metrics?.[key];
  if (v == null || v === '') {
    if (key === 'caloriesBurned') {
      const steps = Number(displayLog.value?.steps || 0);
      return steps ? `${Math.round(steps * 0.04)}` : 'Not logged';
    }
    return 'Not logged';
  }
  if (key === 'sleepHours') return `${v} hrs`;
  return String(v);
}

function hydrateFormFromSelectedDate() {
  const log = selectedLog.value;
  if (!log) {
    form.value = {
      steps: 0,
      instagram: 0,
      totalScreen: 0,
      codingHours: 0,
      mood: 'average',
      notes: '',
    };
    metricsForm.value = emptyMetricsForm();
    return;
  }
  form.value = {
    steps: log.steps,
    instagram: log.screenTime?.instagram ?? 0,
    totalScreen: log.screenTime?.total ?? 0,
    codingHours: log.codingHours,
    mood: log.mood,
    notes: log.notes ?? '',
  };
  metricsForm.value = metricsFromServer(log.metrics);
}

function shiftSelectedDate(days) {
  const d = new Date(`${selectedDate.value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  selectedDate.value = d.toISOString().slice(0, 10);
}

function shiftChartWindow(days) {
  const maxOffset = Math.max(0, sortedLogs.value.length - 7);
  const next = chartWindowOffset.value + days;
  chartWindowOffset.value = Math.max(0, Math.min(maxOffset, next));
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [g, ins, logs, projs] = await Promise.all([
      goalsApi.get(),
      insightsApi.today(),
      logsApi.list(),
      projectsApi.list(),
    ]);
    goals.value = g.data;
    goalsForm.value = {
      dailyStepsGoal: g.data.dailyStepsGoal,
      dailyCodingGoal: g.data.dailyCodingGoal,
    };
    insights.value = ins.data;
    allLogs.value = logs.data;
    projects.value = projs.data;

    todayLog.value = allLogs.value.find((x) => x.date === today.value) || null;
    hydrateFormFromSelectedDate();
    await loadIntegrations();
  } catch (e) {
    error.value =
      e.response?.data?.error ||
      e.message ||
      'Failed to load dashboard. Is the API running?';
  } finally {
    loading.value = false;
  }
}

async function loadIntegrations() {
  integrationsLoading.value = true;
  igSummaryError.value = '';
  ghError.value = '';
  wtError.value = '';
  try {
    ytSummary.value = null;
    igSummary.value = null;
    ghSummary.value = null;
    wtSummary.value = null;

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
          ghSummary.value = gh.data.summary;
        }
      } catch {
        /* status is source of truth if summary fails */
      }
    }
    integrationStatus.value = data;
    if (data.youtube?.connected) {
      try {
        const s = await integrationsApi.youtubeSummary();
        ytSummary.value = s.data.summary;
      } catch {
        ytSummary.value = null;
      }
    }
    if (data.instagram?.connected) {
      try {
        const s = await integrationsApi.instagramSummary();
        igSummary.value = s.data.summary;
      } catch (e) {
        igSummaryError.value =
          e.response?.data?.error ||
          e.message ||
          'Instagram is connected but the API did not return profile stats.';
        igSummary.value = instagramPreviewSummary(data.instagram.username || '');
      }
    }
    if (data.github?.connected && !ghSummary.value) {
      try {
        const s = await integrationsApi.githubSummary();
        ghSummary.value = s.data.summary;
      } catch (e) {
        ghError.value = e.response?.data?.error || e.message || 'Could not load GitHub summary.';
      }
    }
    if (data.wakatime?.connected) {
      try {
        const s = await integrationsApi.wakatimeSummary();
        wtSummary.value = s.data.summary;
      } catch (e) {
        wtError.value = e.response?.data?.error || e.message || 'Could not load WakaTime summary.';
      }
    }
  } catch {
    integrationStatus.value = null;
  } finally {
    integrationsLoading.value = false;
  }
}

function connectYoutube() {
  window.location.href = integrationOAuthStartUrl('youtube');
}

function connectInstagram() {
  window.location.href = integrationOAuthStartUrl('instagram');
}

async function disconnectYoutube() {
  error.value = '';
  try {
    await integrationsApi.youtubeDisconnect();
    await loadIntegrations();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not disconnect YouTube';
  }
}

async function disconnectInstagram() {
  error.value = '';
  try {
    await integrationsApi.instagramDisconnect();
    await loadIntegrations();
    igManualPageToken.value = '';
    igManualIgUserId.value = '';
    igUserAccessToken.value = '';
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not disconnect Instagram';
  }
}

async function submitGithubToken() {
  ghBusy.value = true;
  ghError.value = '';
  error.value = '';
  try {
    await integrationsApi.githubConnect({
      personalAccessToken: ghToken.value.trim(),
    });
    ghToken.value = '';
    integrationBanner.value = {
      kind: 'success',
      text: 'GitHub connected. Recent activity is now available below.',
    };
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not connect GitHub token.';
    ghError.value = msg;
    error.value = msg;
  } finally {
    ghBusy.value = false;
  }
}

async function disconnectGithub() {
  ghError.value = '';
  error.value = '';
  try {
    await integrationsApi.githubDisconnect();
    ghSummary.value = null;
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not disconnect GitHub.';
    ghError.value = msg;
    error.value = msg;
  }
}

async function submitWakaTimeKey() {
  wtBusy.value = true;
  wtError.value = '';
  error.value = '';
  try {
    await integrationsApi.wakatimeConnect({ apiKey: wtApiKey.value.trim() });
    wtApiKey.value = '';
    integrationBanner.value = {
      kind: 'success',
      text: 'WakaTime connected. Coding summary is now available below.',
    };
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not connect WakaTime.';
    wtError.value = msg;
    error.value = msg;
  } finally {
    wtBusy.value = false;
  }
}

async function disconnectWakaTime() {
  wtError.value = '';
  error.value = '';
  try {
    await integrationsApi.wakatimeDisconnect();
    wtSummary.value = null;
    await loadIntegrations();
  } catch (e) {
    const msg = e.response?.data?.error || e.message || 'Could not disconnect WakaTime.';
    wtError.value = msg;
    error.value = msg;
  }
}

async function submitInstagramManual() {
  igManualError.value = '';
  const tok = igManualPageToken.value.trim();
  const id = igManualIgUserId.value.trim();
  if (!/^\d{8,30}$/.test(id)) {
    const msg =
      'Instagram User ID must be digits only (e.g. 17841407995283128 from Graph API). Do not put your email here.';
    igManualError.value = msg;
    error.value = msg;
    return;
  }
  // Meta user/page tokens are long; allow common chars in signed tokens
  if (tok.includes('@') || !/^EAA[a-zA-Z0-9_-]{50,}$/.test(tok)) {
    const msg =
      'Page access token must be the long Meta token from Graph API (starts with EAA…). Not your password or email.';
    igManualError.value = msg;
    error.value = msg;
    return;
  }
  igManualBusy.value = true;
  error.value = '';
  try {
    await integrationsApi.instagramManual({
      pageAccessToken: tok,
      igUserId: id,
    });
    igManualPageToken.value = '';
    igManualIgUserId.value = '';
    igManualError.value = '';
    integrationBanner.value = {
      kind: 'success',
      text: 'Instagram connected with your Page token. Profile data loads below.',
    };
    await loadIntegrations();
  } catch (e) {
    let msg =
      e.response?.data?.error || e.message || 'Invalid Page token or Instagram User ID';
    if (e.response?.status === 401) {
      msg = 'Not logged in. Log in on this site again, then save (session expired).';
    }
    igManualError.value = msg;
    error.value = msg;
  } finally {
    igManualBusy.value = false;
  }
}

async function submitInstagramUserToken() {
  igUserTokenBusy.value = true;
  error.value = '';
  try {
    await integrationsApi.instagramFromUserToken({
      userAccessToken: igUserAccessToken.value.trim(),
    });
    igUserAccessToken.value = '';
    integrationBanner.value = {
      kind: 'success',
      text: 'Instagram connected from user token. Profile data loads below.',
    };
    await loadIntegrations();
  } catch (e) {
    error.value =
      e.response?.data?.error ||
      e.message ||
      'Token could not load Instagram. It needs instagram_basic + pages_show_list (not public_profile only).';
  } finally {
    igUserTokenBusy.value = false;
  }
}

async function submitLog() {
  formSubmitting.value = true;
  error.value = '';
  try {
    await logsApi.create({
      date: selectedDate.value,
      steps: Number(form.value.steps),
      screenTime: {
        instagram: Number(form.value.instagram),
        total: Number(form.value.totalScreen),
      },
      codingHours: Number(form.value.codingHours),
      mood: form.value.mood,
      notes: form.value.notes,
      metrics: metricsToPayload(metricsForm.value),
    });
    await load();
  } catch (e) {
    const msg =
      e.response?.data?.error ||
      (e.response?.data?.errors && JSON.stringify(e.response.data.errors)) ||
      e.message;
    error.value = typeof msg === 'string' ? msg : 'Could not save log';
  } finally {
    formSubmitting.value = false;
  }
}

async function addProject() {
  projectSubmitting.value = true;
  error.value = '';
  try {
    await projectsApi.create({
      name: newProject.value.name,
      status: newProject.value.status,
      hoursSpent: Number(newProject.value.hoursSpent),
      description: newProject.value.description,
    });
    newProject.value = {
      name: '',
      status: 'active',
      hoursSpent: 0,
      description: '',
    };
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not create project';
  } finally {
    projectSubmitting.value = false;
  }
}

async function updateProjectStatus(id, status) {
  error.value = '';
  try {
    await projectsApi.update(id, { status });
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not update project';
  }
}

async function saveGoals() {
  goalsSubmitting.value = true;
  error.value = '';
  try {
    await goalsApi.save({
      dailyStepsGoal: Number(goalsForm.value.dailyStepsGoal),
      dailyCodingGoal: Number(goalsForm.value.dailyCodingGoal),
    });
    await load();
  } catch (e) {
    error.value = e.response?.data?.error || e.message || 'Could not save goals';
  } finally {
    goalsSubmitting.value = false;
  }
}

onMounted(async () => {
  currentTheme.value = document.documentElement.getAttribute('data-theme') || 'night';
  const observer = new MutationObserver(() => {
    currentTheme.value = document.documentElement.getAttribute('data-theme') || 'night';
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const q = route.query;
  if (q.integration === 'youtube_ok') {
    integrationBanner.value = { kind: 'success', text: 'YouTube connected.' };
  } else if (q.integration === 'instagram_ok') {
    integrationBanner.value = { kind: 'success', text: 'Instagram connected.' };
  } else if (q.integration === 'github_ok') {
    integrationBanner.value = {
      kind: 'success',
      text: 'GitHub connected. Summary data loads below.',
    };
  } else if (
    q.integration === 'youtube_err' ||
    q.integration === 'instagram_err' ||
    q.integration === 'github_err'
  ) {
    integrationBanner.value = {
      kind: 'error',
      text: `Connection failed: ${q.msg ? String(q.msg).replace(/_/g, ' ') : 'unknown error'}`,
    };
  }
  await load();
  if (q.integration) {
    router.replace({ path: route.path, query: {} });
  }
});

watch(selectedDate, () => {
  hydrateFormFromSelectedDate();
});
</script>

<template>
  <div class="min-h-screen">
    <header
      class="dash-hero dash-reveal border-b border-white/10 bg-gradient-to-br from-brand-navy/90 via-brand-navy/70 to-transparent"
    >
      <div class="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-12">
        <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-xl">
              <p class="dash-eyebrow">LiveContext OS</p>
            <BrandLogo variant="hero" />
            <p class="mt-4 text-base leading-relaxed text-slate-400">
              Habits, goals, and connected platforms — one place to see how today stacks up without
              digging through apps.
            </p>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:items-end">
            <time
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-xs font-medium text-slate-300 shadow-lg shadow-black/10 ring-1 ring-white/10 backdrop-blur-md"
              :datetime="`${today}`"
            >
              <span
                class="relative flex h-2 w-2"
                aria-hidden="true"
              >
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40"
                />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Selected · UTC <span class="font-semibold text-slate-100">{{ selectedDateLabel }}</span>
            </time>
            <div class="mt-2 flex items-center gap-2">
              <button type="button" class="btn-secondary px-2 py-1 text-xs" @click="shiftSelectedDate(-1)">
                ◀ Day
              </button>
              <input v-model="selectedDate" type="date" class="field-control mt-0 w-auto px-2 py-1 text-xs" />
              <button type="button" class="btn-secondary px-2 py-1 text-xs" @click="shiftSelectedDate(1)">
                Day ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="dash-main mx-auto max-w-7xl scroll-smooth px-4 py-10">
      <div
        v-if="error"
        role="alert"
        class="dash-alert dash-alert-error mb-6"
      >
        <span class="flex items-start gap-2">
          <span class="mt-0.5 shrink-0 text-base" aria-hidden="true">⚠</span>
          <span>{{ error }}</span>
        </span>
      </div>

      <div
        v-if="integrationBanner"
        class="dash-alert"
        :class="
          integrationBanner.kind === 'error' ? 'dash-alert-error' : 'dash-alert-success'
        "
      >
        <span class="flex items-start gap-2">
          <span class="mt-0.5 shrink-0 text-base" aria-hidden="true">{{
            integrationBanner.kind === 'error' ? '✕' : '✓'
          }}</span>
          <span>{{ integrationBanner.text }}</span>
        </span>
        <button
          type="button"
          class="rounded-full border border-current/20 px-3 py-1 text-xs font-medium opacity-90 hover:bg-white/10"
          @click="integrationBanner = null"
        >
          Dismiss
        </button>
      </div>

      <div v-if="loading" class="dash-loading py-20">
        <div class="mx-auto max-w-md space-y-4 px-4">
          <div class="dash-loading-bar w-full" />
          <div class="dash-loading-bar w-[85%]" />
          <div class="dash-loading-bar w-[65%]" />
          <p class="pt-2 text-center text-xs text-slate-500">Loading your dashboard…</p>
        </div>
      </div>

      <template v-else>
        <div class="dash-shell grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside class="dash-sidebar panel h-fit p-4">
            <p class="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>
            <div class="space-y-2">
              <button
                v-for="tab in dashboardTabs"
                :key="`side-${tab.key}`"
                type="button"
                class="tab-btn tab-btn-side w-full text-left"
                :class="activeTab === tab.key ? 'tab-btn-active' : 'tab-btn-idle'"
                @click="activeTab = tab.key"
              >
                <span class="flex items-center gap-2">
                  <span
                    class="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-[11px] text-slate-300"
                    >{{ dashboardTabIcons[tab.key] }}</span
                  >
                  <span class="block text-sm font-semibold">{{ tab.label }}</span>
                </span>
                <span class="mt-1 block text-[11px] text-slate-500">{{ tab.hint }}</span>
              </button>
            </div>

            <div class="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">
              <p class="font-medium text-slate-300">Window</p>
              <p class="mt-1">{{ chartWindowInfo.first || '—' }} → {{ chartWindowInfo.last || '—' }}</p>
              <p class="mt-2">
                Health:
                <span class="font-semibold text-emerald-300">{{ integrationHealth.pct }}%</span>
              </p>
            </div>
          </aside>

          <div class="dash-content min-w-0">
            <section class="dash-command-bar dash-reveal mb-6">
              <div class="panel flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="dash-eyebrow text-[10px]">Control</p>
                  <h2 class="font-display text-lg font-semibold text-slate-100">LiveContext command bar</h2>
                  <p class="mt-1 text-xs text-slate-400">
                    Active date: {{ selectedDateLabel }} · Health index: {{ integrationHealth.pct }}%
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" class="btn-secondary px-3 py-2 text-xs" @click="activeTab = 'overview'">
                    Overview
                  </button>
                  <button
                    type="button"
                    class="btn-secondary px-3 py-2 text-xs"
                    @click="activeTab = 'integrations'"
                  >
                    Connections
                  </button>
                  <RouterLink to="/integrations" class="btn-primary px-4 py-2 text-xs">
                    Open Integrations
                  </RouterLink>
                </div>
              </div>
            </section>
            <section class="dash-reveal mb-5">
              <div class="panel flex flex-wrap items-center gap-2 p-2">
                <button
                  v-for="tab in reportWindowTabs"
                  :key="tab.key"
                  type="button"
                  class="tab-btn text-xs"
                  :class="reportWindow === tab.key ? 'tab-btn-active' : 'tab-btn-idle'"
                  @click="reportWindow = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>
            </section>
            <section class="dash-reveal mb-7">
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article class="panel p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today score</p>
                  <p class="mt-2 font-display text-2xl font-semibold text-slate-100">{{ todayScore }}<span class="ml-1 text-base text-slate-500">/100</span></p>
                </article>
                <article class="panel p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Steps</p>
                  <p class="mt-2 font-display text-2xl font-semibold text-slate-100">{{ summarySteps }}</p>
                </article>
                <article class="panel p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coding</p>
                  <p class="mt-2 font-display text-2xl font-semibold text-slate-100">{{ summaryCoding }}<span class="ml-1 text-base text-slate-500">hrs</span></p>
                </article>
                <article class="panel p-4">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Focus status</p>
                  <p class="mt-2 text-base font-semibold" :class="focusStatus.tone">{{ focusStatus.label }}</p>
                </article>
              </div>
            </section>
        <!-- Integration snapshot -->
        <section v-if="activeTab === 'overview' || activeTab === 'integrations'" class="dash-reveal mb-14">
          <div class="dash-section-head items-center">
            <div>
                <p class="dash-eyebrow">LiveContext OS</p>
                <h2 class="dash-title">Connected platforms</h2>
              <p class="dash-desc">
                Status and key metrics per platform. Connect anything missing from the integrations
                page — we only show numbers when APIs return live data.
              </p>
            </div>
            <RouterLink
              to="/integrations"
              class="btn-primary shrink-0 px-5 py-2.5 text-xs font-semibold shadow-lg"
            >
              Manage integrations
            </RouterLink>
          </div>

          <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <!-- YouTube -->
            <article
              class="panel platform-card platform-card--youtube flex flex-col overflow-hidden p-0 shadow-lg"
            >
              <header
                class="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-sm bg-white/[0.03]"
              >
                <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >YouTube</span
                >
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    integrationStatus?.youtube?.connected
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-slate-500/20 text-slate-400'
                  "
                >
                  {{ integrationStatus?.youtube?.connected ? 'Connected' : 'Not connected' }}
                </span>
              </header>
              <div class="flex flex-1 flex-col gap-2 px-4 py-4 text-sm text-slate-300">
                <template v-if="integrationStatus?.youtube?.connected && ytSummary">
                  <p>
                    <span class="text-slate-500">Channel ·</span>
                    {{ ytSummary.channelTitle || integrationStatus.youtube.channelTitle || '—' }}
                  </p>
                  <p v-if="ytSummary.subscriberCount != null">
                    <span class="text-slate-500">Subscribers ·</span>
                    {{ ytSummary.subscriberCount }}
                  </p>
                  <p v-if="ytSummary.likedVideos?.length">
                    <span class="text-slate-500">Recent likes ·</span>
                    {{ ytSummary.likedVideos.length }} items
                  </p>
                </template>
                <template v-else-if="integrationStatus?.youtube?.connected">
                  <p class="text-slate-500">Connected — loading or refreshing summary…</p>
                </template>
                <template v-else>
                  <p class="text-slate-500">Connect to show channel and liked-video activity.</p>
                </template>
              </div>
            </article>

            <!-- Instagram -->
            <article
              class="panel platform-card platform-card--instagram flex flex-col overflow-hidden p-0 shadow-lg"
            >
              <header
                class="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-sm bg-white/[0.03]"
              >
                <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >Instagram</span
                >
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    integrationStatus?.instagram?.connected
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-slate-500/20 text-slate-400'
                  "
                >
                  {{ integrationStatus?.instagram?.connected ? 'Connected' : 'Not connected' }}
                </span>
              </header>
              <div class="flex flex-1 flex-col gap-2 px-4 py-4 text-sm text-slate-300">
                <template v-if="integrationStatus?.instagram?.connected && igSummary">
                  <p>
                    <span class="text-slate-500">Profile ·</span>
                    @{{ igSummary.username || integrationStatus.instagram.username || '—' }}
                  </p>
                  <p v-if="igSummary.followersCount != null">
                    <span class="text-slate-500">Followers ·</span>
                    {{ igSummary.followersCount }}
                  </p>
                  <p v-if="igSummary.mediaCount != null">
                    <span class="text-slate-500">Posts ·</span>
                    {{ igSummary.mediaCount }}
                  </p>
                </template>
                <template v-else-if="integrationStatus?.instagram?.connected">
                  <p class="text-slate-500">Connected — {{ igSummaryError || 'waiting for profile data…' }}</p>
                </template>
                <template v-else>
                  <p class="text-slate-500">Connect for followers, posts, and recent media.</p>
                </template>
              </div>
            </article>

            <!-- GitHub -->
            <article
              class="panel platform-card platform-card--github flex flex-col overflow-hidden p-0 shadow-lg"
            >
              <header
                class="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-sm bg-white/[0.03]"
              >
                <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >GitHub</span
                >
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    integrationStatus?.github?.connected
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-slate-500/20 text-slate-400'
                  "
                >
                  {{ integrationStatus?.github?.connected ? 'Connected' : 'Not connected' }}
                </span>
              </header>
              <div class="flex flex-1 flex-col gap-2 px-4 py-4 text-sm text-slate-300">
                <template v-if="integrationStatus?.github?.connected && ghSummary">
                  <p>
                    <span class="text-slate-500">User ·</span>
                    {{ ghSummary.username || integrationStatus.github.username || '—' }}
                  </p>
                  <p v-if="ghSummary.commitsLast7Days != null">
                    <span class="text-slate-500">Commits (7d) ·</span>
                    {{ ghSummary.commitsLast7Days }}
                  </p>
                  <p v-if="ghSummary.eventsLast7Days != null">
                    <span class="text-slate-500">Events (7d) ·</span>
                    {{ ghSummary.eventsLast7Days }}
                  </p>
                  <div v-if="ghSummary.topRepos?.length" class="text-xs">
                    <span class="text-slate-500">Top repos ·</span>
                    <span class="text-slate-400">{{
                      ghSummary.topRepos
                        .slice(0, 3)
                        .map((r) => r.name)
                        .join(', ')
                    }}</span>
                  </div>
                </template>
                <template v-else-if="integrationStatus?.github?.connected">
                  <p class="text-slate-500">Connected — {{ ghError || 'loading activity…' }}</p>
                </template>
                <template v-else>
                  <p class="text-slate-500">Connect (OAuth recommended) for commits and repo activity.</p>
                </template>
              </div>
            </article>

            <!-- WakaTime -->
            <article
              class="panel platform-card platform-card--wakatime flex flex-col overflow-hidden p-0 shadow-lg"
            >
              <header
                class="flex items-center justify-between border-b border-white/10 px-4 py-3 backdrop-blur-sm bg-white/[0.03]"
              >
                <span class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >WakaTime</span
                >
                <span
                  class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="
                    integrationStatus?.wakatime?.connected
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-slate-500/20 text-slate-400'
                  "
                >
                  {{ integrationStatus?.wakatime?.connected ? 'Connected' : 'Not connected' }}
                </span>
              </header>
              <div class="flex flex-1 flex-col gap-2 px-4 py-4 text-sm text-slate-300">
                <template v-if="integrationStatus?.wakatime?.connected && wtSummary">
                  <p>
                    <span class="text-slate-500">Today ·</span>
                    {{ wtSummary.todayText || '—' }}
                  </p>
                  <p>
                    <span class="text-slate-500">Last 7 days ·</span>
                    {{ wtSummary.totalText7d || '—' }}
                  </p>
                  <p v-if="wtSummary.languagesToday?.length" class="text-xs text-slate-400">
                    <span class="text-slate-500">Languages today ·</span>
                    {{
                      wtSummary.languagesToday
                        .slice(0, 3)
                        .map((l) => l.name)
                        .join(', ')
                    }}
                  </p>
                </template>
                <template v-else-if="integrationStatus?.wakatime?.connected">
                  <p class="text-slate-500">Connected — {{ wtError || 'loading coding stats…' }}</p>
                </template>
                <template v-else>
                  <p class="text-slate-500">Add your API key for time and language breakdown.</p>
                </template>
              </div>
            </article>
          </div>
        </section>

        <!-- Today's summary -->
        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal mb-14">
          <div class="dash-section-head border-0 pb-0">
            <div>
              <p class="dash-eyebrow">LiveContext OS</p>
              <h2 class="dash-title">Focus intelligence</h2>
              <p class="dash-desc">
                Score, momentum, and a single insight from your logs — skim this before diving into
                charts.
              </p>
            </div>
          </div>
          <div class="panel mb-6 p-5 sm:p-6">
            <div class="dash-intel-grid">
              <div class="dash-intel-cell">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Coding delta
                </p>
                <p class="mt-2 text-sm font-medium leading-snug text-slate-200">
                  {{ codingDelta?.text || 'Log today to compare with yesterday' }}
                </p>
              </div>
              <div class="dash-intel-cell">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Focus
                </p>
                <p class="mt-2 text-sm font-semibold leading-snug" :class="focusStatus.tone">
                  {{ focusStatus.label }}
                </p>
              </div>
              <div class="dash-intel-cell md:col-span-2">
                <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Insight
                </p>
                <p class="mt-2 text-sm font-medium leading-snug text-slate-200">
                  {{
                    chartInsights[1] ||
                    'Patterns improve as you log more — try a consistent check-in time.'
                  }}
                </p>
              </div>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Steps" :value="summarySteps" />
            <StatCard label="Coding hours" :value="summaryCoding" />
            <StatCard label="Instagram" :value="summaryIg" />
            <StatCard label="Mood" :value="summaryMood" />
          </div>

          <div
            class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              label="Calories (est.)"
              :value="summaryMetric('caloriesBurned')"
            />
            <StatCard label="Music (min)" :value="summaryMetric('musicMinutes')" />
            <StatCard
              label="Job applications"
              :value="summaryMetric('jobApplications')"
            />
            <StatCard label="Sleep" :value="summaryMetric('sleepHours')" />
          </div>

          <div
            v-if="goals"
            class="mt-6 grid gap-4 md:grid-cols-2"
          >
            <div
              class="panel p-6"
            >
              <p class="text-sm font-medium text-slate-500">Steps vs goal</p>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-semibold">{{ summarySteps }}</span>
                <span class="text-slate-400">/</span>
                <span class="text-lg text-slate-400">{{ goals.dailyStepsGoal }}</span>
              </div>
              <div
                class="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  class="h-full rounded-full bg-brand-gold transition-all"
                  :style="{
                    width: `${Math.min(
                      100,
                      (Number(summarySteps) / goals.dailyStepsGoal) * 100 || 0
                    )}%`,
                  }"
                />
              </div>
            </div>
            <div
              class="panel p-6"
            >
              <p class="text-sm font-medium text-slate-500">Coding vs goal</p>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-semibold">{{ summaryCoding }}</span>
                <span class="text-slate-400">/</span>
                <span class="text-lg text-slate-400"
                  >{{ goals.dailyCodingGoal }} hrs</span
                >
              </div>
              <div
                class="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  class="h-full rounded-full bg-slate-100 transition-all"
                  :style="{
                    width: `${Math.min(
                      100,
                      (Number(summaryCoding) / goals.dailyCodingGoal) * 100 || 0
                    )}%`,
                  }"
                />
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal mb-14">
          <div class="dash-section-head border-0 pb-4">
            <div>
              <p class="dash-eyebrow">LiveContext OS</p>
              <h2 class="dash-title text-xl">Performance radar</h2>
              <p class="dash-desc max-w-lg">
                Cross-platform snapshot: coding, shipping, social signals, and overall link health.
              </p>
            </div>
            <span
              class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 ring-1 ring-white/10"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-400/90" aria-hidden="true" />
              Health {{ integrationHealth.pct }}%
            </span>
          </div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="card in commandCenterCards"
              :key="card.key"
              class="panel command-center-card group min-h-[128px] p-5 transition duration-300"
              :class="`command-center-card--${card.key}`"
            >
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {{ card.title }}
              </p>
              <p class="font-display mt-2 text-xl font-semibold tracking-tight text-slate-100">
                {{ card.value }}
              </p>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">{{ card.sub }}</p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <article class="panel ring-card p-5">
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Steps goal</p>
              <div class="mt-3 flex items-center gap-4">
                <div
                  class="ring-meter"
                  :style="{
                    background: `conic-gradient(#22d3ee ${stepsGoalPct}%, rgba(148,163,184,0.22) ${stepsGoalPct}% 100%)`,
                  }"
                >
                  <div class="ring-meter-inner">{{ stepsGoalPct }}%</div>
                </div>
                <p class="text-xs text-slate-400">
                  {{ summarySteps }} / {{ goals?.dailyStepsGoal || 0 }} steps
                </p>
              </div>
            </article>
            <article class="panel ring-card p-5">
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coding goal</p>
              <div class="mt-3 flex items-center gap-4">
                <div
                  class="ring-meter"
                  :style="{
                    background: `conic-gradient(#60a5fa ${codingGoalPct}%, rgba(148,163,184,0.22) ${codingGoalPct}% 100%)`,
                  }"
                >
                  <div class="ring-meter-inner">{{ codingGoalPct }}%</div>
                </div>
                <p class="text-xs text-slate-400">
                  {{ summaryCoding }} / {{ goals?.dailyCodingGoal || 0 }} hrs
                </p>
              </div>
            </article>
            <article class="panel ring-card p-5">
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Integration health</p>
              <div class="mt-3 flex items-center gap-4">
                <div
                  class="ring-meter"
                  :style="{
                    background: `conic-gradient(#34d399 ${integrationHealth.pct}%, rgba(148,163,184,0.22) ${integrationHealth.pct}% 100%)`,
                  }"
                >
                  <div class="ring-meter-inner">{{ integrationHealth.pct }}%</div>
                </div>
                <p class="text-xs text-slate-400">
                  {{ integrationHealth.connected }}/{{ integrationHealth.total }} channels online
                </p>
              </div>
            </article>
          </div>

          <div
            v-if="wtSummary?.daily?.length"
            class="panel mt-4 p-5"
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm font-medium text-slate-200">WakaTime coding trend (last 7 days)</p>
              <p class="text-xs text-slate-500">{{ wtSummary.totalText7d || '0 secs' }}</p>
            </div>
            <div class="space-y-2">
              <div
                v-for="d in wtSummary.daily"
                :key="d.date"
                class="grid grid-cols-[64px_1fr_auto] items-center gap-3"
              >
                <span class="text-xs text-slate-500">{{ d.date?.slice(5) || '--' }}</span>
                <div class="h-2.5 overflow-hidden rounded-full bg-slate-300/20">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-brand-gold to-amber-300"
                    :style="{
                      width: `${Math.min(100, ((d.seconds || 0) / Math.max(1, ...wtSummary.daily.map((x) => x.seconds || 0))) * 100)}%`,
                      opacity: d.seconds ? 1 : 0.28,
                    }"
                  />
                </div>
                <span class="text-xs text-slate-400">{{ d.text }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal mb-14">
          <div class="dash-section-head border-0 pb-4">
            <div>
              <p class="dash-eyebrow">LiveContext OS</p>
              <h2 class="dash-title text-xl">Ecosystem pulse</h2>
              <p class="dash-desc max-w-lg">
                Normalized intensity vs consistency — useful for spotting imbalance across channels.
              </p>
            </div>
            <button
              type="button"
              class="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10"
              @click="showPlatformPulse = !showPlatformPulse"
            >
              {{ showPlatformPulse ? 'Hide chart' : 'Show chart' }}
            </button>
          </div>
          <div v-if="showPlatformPulse" class="panel p-5">
            <p class="mb-3 text-xs text-slate-500">
              Unified score view for Instagram, GitHub, WakaTime, and YouTube.
            </p>
            <p class="mb-3 text-sm font-medium text-slate-200">
              Platform Pulse Score: <span class="text-brand-gold">{{ platformPulseScore }}/100</span>
            </p>
            <div class="relative min-h-[300px]">
              <Bar :data="platform3dData" :options="platform3dOptions" />
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div
                v-for="p in platformPulseBreakdown"
                :key="p.name"
                class="dash-intel-cell rounded-xl px-4 py-3 text-sm"
              >
                <p class="font-display font-semibold text-slate-100">
                  {{ p.name }}
                  <span class="text-brand-gold">{{ p.score }}</span>
                </p>
                <p class="mt-1 text-xs leading-relaxed text-slate-400">{{ p.reason }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="dash-reveal mb-14">
          <div class="panel flex flex-wrap items-center gap-6 px-6 py-5">
            <div class="min-w-[200px] flex-1">
              <p class="dash-eyebrow text-[10px]">Links</p>
              <p class="mt-2 text-sm leading-relaxed text-slate-300">
                <span class="font-display text-lg font-semibold text-slate-100">{{
                  integrationHealth.connected
                }}</span>
                <span class="text-slate-500"> / {{ integrationHealth.total }}</span>
                integrations active ·
                <RouterLink to="/integrations" class="link-accent font-semibold">Configure</RouterLink>
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="item in integrationOverview"
                :key="item.key"
                class="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[11px]"
                :class="
                  item.connected
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-400'
                "
              >
                {{ item.name }}
                <span class="font-semibold">{{ item.connected ? 'On' : 'Off' }}</span>
              </span>
            </div>
          </div>
          <div
            v-if="integrationOverview.some((x) => x.warning)"
            class="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/35 px-4 py-3 text-xs text-amber-100"
          >
            <p v-for="item in integrationOverview.filter((x) => x.warning)" :key="item.key + '-w'">
              <strong>{{ item.name }}:</strong> {{ item.warning }}
            </p>
          </div>
        </section>

        <!-- OAuth integrations -->
        <section v-if="activeTab === 'integrations'" class="dash-reveal mb-10">
          <div id="integration-manager" class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-lg font-semibold text-slate-100">Integrations manager</h2>
            <button
              type="button"
              class="btn-secondary text-xs"
              @click="showDetailedIntegrations = !showDetailedIntegrations"
            >
              {{ showDetailedIntegrations ? 'Hide details' : 'Show details' }}
            </button>
          </div>
          <p class="mb-4 text-sm text-slate-500">
            Connect platforms, refresh tokens, and troubleshoot integration issues.
          </p>

          <div
            v-if="integrationsLoading && !integrationStatus"
            class="text-sm text-slate-500"
          >
            Loading connections…
          </div>

          <div
            v-else-if="showDetailedIntegrations"
            class="grid gap-6 lg:grid-cols-2"
          >
            <div
              class="panel min-h-[340px] p-6"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-100">YouTube</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    Music and videos you have <em>liked</em> (Premium does not add extra API data).
                  </p>
                </div>
                <span
                  v-if="integrationStatus?.youtube?.connected"
                  class="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
                >Connected</span>
              </div>

              <p
                v-if="integrationStatus && !integrationStatus.config?.youtubeOAuth"
                class="mt-3 text-xs text-amber-200/90"
              >
                Set <code class="rounded bg-amber-950/60 px-1 text-amber-100">GOOGLE_CLIENT_*</code> and
                <code class="rounded bg-amber-950/60 px-1 text-amber-100">GOOGLE_REDIRECT_URI</code> in
                <code class="rounded bg-white/10 px-1 text-slate-300">server/.env</code>, then restart the API.
              </p>

              <div
                v-else-if="integrationStatus?.youtube?.connected && ytSummary"
                class="mt-4 space-y-2 text-sm text-slate-300"
              >
                <p>
                  <span class="text-slate-500">Channel:</span>
                  {{ ytSummary.channelTitle || integrationStatus.youtube.channelTitle || '—' }}
                </p>
                <p v-if="ytSummary.subscriberCount != null">
                  <span class="text-slate-500">Subscribers:</span>
                  {{ ytSummary.subscriberCount }}
                </p>
                <div
                  v-if="ytSummary.likedVideos?.length"
                  class="text-slate-300"
                >
                  <span class="block text-xs font-medium text-slate-500">Recent likes</span>
                  <ul class="mt-1 list-inside list-disc space-y-0.5">
                    <li
                      v-for="(v, idx) in ytSummary.likedVideos"
                      :key="idx"
                    >
                      {{ v.title || v.videoId }}
                    </li>
                  </ul>
                </div>
                <p class="text-xs text-slate-500">{{ ytSummary.note }}</p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-if="integrationStatus?.config?.youtubeOAuth && !integrationStatus?.youtube?.connected"
                  type="button"
                  class="btn-primary rounded-lg px-3 py-2"
                  @click="connectYoutube"
                >
                  Connect YouTube
                </button>
                <button
                  v-if="integrationStatus?.youtube?.connected"
                  type="button"
                  class="btn-secondary"
                  @click="disconnectYoutube"
                >
                  Disconnect
                </button>
              </div>
            </div>

            <div
              class="panel min-h-[340px] p-6"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-100">Instagram</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    Profile stats and recent posts (Graph API — Professional accounts only).
                  </p>
                </div>
                <span
                  v-if="integrationStatus?.instagram?.connected"
                  class="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
                >Connected</span>
              </div>

              <p
                v-if="
                  integrationStatus &&
                  !integrationStatus.instagram?.connected &&
                  !integrationStatus.config?.instagramOAuth
                "
                class="mt-3 text-xs text-amber-200/90"
              >
                Optional: set <code class="rounded bg-amber-950/60 px-1 text-amber-100">META_APP_ID</code>,
                <code class="rounded bg-amber-950/60 px-1 text-amber-100">META_APP_SECRET</code>,
                <code class="rounded bg-amber-950/60 px-1 text-amber-100">META_REDIRECT_URI</code> in
                <code class="rounded bg-white/10 px-1 text-slate-300">server/.env</code> to use &quot;Connect Instagram&quot;,
                or paste tokens below (no app secret needed).
              </p>

              <div
                v-else-if="integrationStatus?.instagram?.connected && igSummary"
                class="mt-4 space-y-2 text-sm text-slate-300"
              >
                <p
                  v-if="igSummaryError"
                  class="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
                >
                  {{ igSummaryError }}
                </p>
                <p>
                  <span class="text-slate-500">@</span>{{ igSummary.username || integrationStatus.instagram.username }}
                </p>
                <p v-if="igSummary.biography">{{ igSummary.biography }}</p>
                <p v-if="igSummary.followersCount != null">
                  <span class="text-slate-500">Followers:</span>
                  {{ igSummary.followersCount }}
                </p>
                <p v-if="igSummary.followsCount != null">
                  <span class="text-slate-500">Following:</span>
                  {{ igSummary.followsCount }}
                </p>
                <p v-if="igSummary.mediaCount != null">
                  <span class="text-slate-500">Posts:</span>
                  {{ igSummary.mediaCount }}
                </p>
                <div v-if="igSummary.recentMedia?.length">
                  <span class="block text-xs font-medium text-slate-500">Recent images</span>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <a
                      v-for="m in igSummary.recentMedia"
                      :key="m.id"
                      :href="m.permalink || '#'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="group relative block overflow-hidden rounded-lg border border-white/10 bg-slate-900/40"
                    >
                      <img
                        v-if="m.thumbnailUrl || m.mediaUrl"
                        :src="m.thumbnailUrl || m.mediaUrl"
                        :alt="m.caption || 'Instagram media'"
                        class="h-28 w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                      />
                      <div
                        v-else
                        class="flex h-28 items-center justify-center text-[11px] text-slate-500"
                      >
                        No preview
                      </div>
                      <div
                        class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-slate-200"
                      >
                        {{ m.mediaType || 'MEDIA' }}
                      </div>
                    </a>
                  </div>
                </div>
                <p class="text-xs text-slate-500">{{ igSummary.note }}</p>
              </div>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-if="integrationStatus?.config?.instagramOAuth && !integrationStatus?.instagram?.connected"
                  type="button"
                  class="rounded-lg bg-gradient-to-r from-brand-gold to-amber-700 px-3 py-2 text-sm font-semibold text-brand-navy hover:opacity-95"
                  @click="connectInstagram"
                >
                  Connect Instagram
                </button>
                <button
                  v-if="integrationStatus?.instagram?.connected"
                  type="button"
                  class="btn-secondary"
                  @click="disconnectInstagram"
                >
                  Disconnect
                </button>
              </div>

              <div
                v-if="integrationStatus && !integrationStatus.instagram?.connected"
                class="mt-6 space-y-5 border-t border-white/10 pt-5"
              >
                <p class="text-xs text-slate-400">
                  <strong class="text-slate-300">Real Instagram data:</strong> the API needs a
                  <strong class="text-brand-gold">Creator or Business</strong> IG linked to a Facebook Page.
                  Tokens are stored in your dashboard account only (never from chat). Graph API Explorer
                  &quot;User&quot; tokens with only
                  <code class="rounded bg-white/10 px-1">public_profile</code> cannot load Instagram media.
                </p>
                <form class="space-y-2" @submit.prevent="submitInstagramManual">
                  <p class="text-xs font-medium text-slate-500">Option A — Page access token + Instagram User ID</p>
                  <p class="text-[11px] leading-relaxed text-slate-500">
                    Use a <strong class="text-slate-400">Facebook Page</strong> token (usually starts with
                    <code class="rounded bg-white/10 px-0.5">EAA</code>), not the &quot;Generate token&quot; from
                    Meta&apos;s Instagram screen (often starts with
                    <code class="rounded bg-white/10 px-0.5">IG</code>). In
                    <a
                      class="text-brand-gold underline underline-offset-2 hover:text-brand-gold/90"
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >Graph API Explorer</a
                    >: add
                    <code class="rounded bg-white/10 px-0.5">pages_show_list</code> +
                    <code class="rounded bg-white/10 px-0.5">instagram_basic</code>, generate token, then run
                    <code class="break-all rounded bg-white/10 px-0.5">{{ '{page-id}' }}?fields=access_token</code>
                    and paste the token here. IG id comes from
                    <code class="break-all rounded bg-white/10 px-0.5">{{ '{page-id}' }}?fields=instagram_business_account{{ '{id,username}' }}</code>.
                  </p>
                  <label class="field-label text-xs">Page access token</label>
                  <input
                    v-model="igManualPageToken"
                    type="password"
                    autocomplete="off"
                    class="field-control font-mono text-xs"
                    placeholder="EAA… (Page token from Graph API, not IG… from Instagram product UI)"
                  />
                  <label class="field-label text-xs">Instagram User ID (IG Business id)</label>
                  <input
                    v-model="igManualIgUserId"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    class="field-control font-mono text-xs"
                    placeholder="Digits only, e.g. 17841407995283128 — not your email"
                  />
                  <button
                    type="submit"
                    class="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                    :disabled="igManualBusy || !igManualPageToken.trim() || !igManualIgUserId.trim()"
                  >
                    {{ igManualBusy ? 'Saving…' : 'Save & load Instagram' }}
                  </button>
                  <p
                    v-if="igManualError"
                    class="rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200"
                  >
                    {{ igManualError }}
                  </p>
                </form>
                <form class="space-y-2" @submit.prevent="submitInstagramUserToken">
                  <p class="text-xs font-medium text-slate-500">Option B — User access token (with Instagram permissions)</p>
                  <label class="field-label text-xs">User access token</label>
                  <input
                    v-model="igUserAccessToken"
                    type="password"
                    autocomplete="off"
                    class="field-control font-mono text-xs"
                    placeholder="Must include instagram_basic + pages_show_list"
                  />
                  <button
                    type="submit"
                    class="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                    :disabled="igUserTokenBusy || !igUserAccessToken.trim()"
                  >
                    {{ igUserTokenBusy ? 'Connecting…' : 'Connect with user token' }}
                  </button>
                </form>
              </div>
            </div>

            <div class="panel min-h-[340px] p-6">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-100">GitHub</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    Pull your recent commits and active repositories using a Personal Access Token.
                  </p>
                </div>
                <span
                  v-if="integrationStatus?.github?.connected"
                  class="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
                >Connected</span>
              </div>

              <div
                v-if="integrationStatus?.github?.connected && ghSummary"
                class="mt-4 space-y-2 text-sm text-slate-300"
              >
                <p>
                  <span class="text-slate-500">User:</span>
                  {{ ghSummary.username || integrationStatus.github.username || '—' }}
                </p>
                <p v-if="ghSummary.commitsLast7Days != null">
                  <span class="text-slate-500">Commits (7d):</span>
                  {{ ghSummary.commitsLast7Days }}
                </p>
                <p v-if="ghSummary.eventsLast7Days != null">
                  <span class="text-slate-500">Events (7d):</span>
                  {{ ghSummary.eventsLast7Days }}
                </p>
                <p v-if="ghSummary.publicRepos != null">
                  <span class="text-slate-500">Public repos:</span>
                  {{ ghSummary.publicRepos }}
                </p>
                <ul v-if="ghSummary.topRepos?.length" class="space-y-0.5 text-xs text-slate-300">
                  <li class="text-slate-500">Most active repos (7d)</li>
                  <li v-for="r in ghSummary.topRepos" :key="r.name">
                    {{ r.name }} <span class="text-slate-500">({{ r.events }} events)</span>
                  </li>
                </ul>
                <p class="text-xs text-slate-500">{{ ghSummary.note }}</p>
              </div>

              <p
                v-if="ghError"
                class="mt-3 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200"
              >
                {{ ghError }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-if="integrationStatus?.github?.connected"
                  type="button"
                  class="btn-secondary"
                  @click="disconnectGithub"
                >
                  Disconnect
                </button>
              </div>

              <form
                v-if="integrationStatus && !integrationStatus.github?.connected"
                class="mt-5 space-y-2 border-t border-white/10 pt-5"
                @submit.prevent="submitGithubToken"
              >
                <p class="text-xs text-slate-400">
                  Create a GitHub Personal Access Token and paste it here. Fine-grained tokens with read-only
                  access to your user events are recommended.
                </p>
                <label class="field-label text-xs">GitHub Personal Access Token</label>
                <input
                  v-model="ghToken"
                  type="password"
                  autocomplete="off"
                  class="field-control font-mono text-xs"
                  placeholder="ghp_... or github_pat_..."
                />
                <button
                  type="submit"
                  class="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                  :disabled="ghBusy || !ghToken.trim()"
                >
                  {{ ghBusy ? 'Connecting…' : 'Connect GitHub' }}
                </button>
              </form>
            </div>

            <div class="panel min-h-[340px] p-6">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-slate-100">WakaTime</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    Pull coding time, languages, and projects from your WakaTime account.
                  </p>
                </div>
                <span
                  v-if="integrationStatus?.wakatime?.connected"
                  class="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-200"
                >Connected</span>
              </div>

              <div
                v-if="integrationStatus?.wakatime?.connected && wtSummary"
                class="mt-4 space-y-2 text-sm text-slate-300"
              >
                <p>
                  <span class="text-slate-500">Today:</span>
                  {{ wtSummary.todayText || '0 secs' }}
                </p>
                <p>
                  <span class="text-slate-500">Last 7 days:</span>
                  {{ wtSummary.totalText7d || '0 secs' }}
                </p>
                <p>
                  <span class="text-slate-500">Days tracked:</span>
                  {{ wtSummary.daysTracked ?? 0 }}
                </p>
                <div v-if="wtSummary.languagesToday?.length">
                  <span class="block text-xs font-medium text-slate-500">Top languages (today)</span>
                  <ul class="mt-1 space-y-0.5 text-xs">
                    <li v-for="lang in wtSummary.languagesToday" :key="lang.name">
                      {{ lang.name }} <span class="text-slate-500">({{ lang.text || `${lang.percent ?? 0}%` }})</span>
                    </li>
                  </ul>
                </div>
                <div v-if="wtSummary.projectsToday?.length">
                  <span class="block text-xs font-medium text-slate-500">Top projects (today)</span>
                  <ul class="mt-1 space-y-0.5 text-xs">
                    <li v-for="proj in wtSummary.projectsToday" :key="proj.name">
                      {{ proj.name }} <span class="text-slate-500">({{ proj.text || `${proj.percent ?? 0}%` }})</span>
                    </li>
                  </ul>
                </div>
                <p class="text-xs text-slate-500">{{ wtSummary.note }}</p>
              </div>

              <p
                v-if="wtError"
                class="mt-3 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200"
              >
                {{ wtError }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  v-if="integrationStatus?.wakatime?.connected"
                  type="button"
                  class="btn-secondary"
                  @click="disconnectWakaTime"
                >
                  Disconnect
                </button>
              </div>

              <form
                v-if="integrationStatus && !integrationStatus.wakatime?.connected"
                class="mt-5 space-y-2 border-t border-white/10 pt-5"
                @submit.prevent="submitWakaTimeKey"
              >
                <p class="text-xs text-slate-400">
                  Paste your WakaTime API key from settings. It stays on your account and is used only to fetch summaries.
                </p>
                <label class="field-label text-xs">WakaTime API key</label>
                <input
                  v-model="wtApiKey"
                  type="password"
                  autocomplete="off"
                  class="field-control font-mono text-xs"
                  placeholder="waka_..."
                />
                <button
                  type="submit"
                  class="btn-secondary mt-1 rounded-lg px-3 py-2 text-sm"
                  :disabled="wtBusy || !wtApiKey.trim()"
                >
                  {{ wtBusy ? 'Connecting…' : 'Connect WakaTime' }}
                </button>
              </form>
            </div>
          </div>
          <div
            v-else
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
          >
            Detailed integration cards are hidden. Use <strong class="text-slate-100">Show details</strong> to
            connect/disconnect or update tokens.
          </div>
        </section>

        <!-- Goals -->
        <section v-if="goals && (activeTab === 'overview' || activeTab === 'performance')" class="dash-reveal mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">Goals</h2>
          <form
            class="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-end"
            @submit.prevent="saveGoals"
          >
            <div class="flex-1">
              <label class="field-label text-xs"
                >Daily steps goal</label
              >
              <input
                v-model.number="goalsForm.dailyStepsGoal"
                type="number"
                min="0"
                class="field-control text-sm"
                required
              />
            </div>
            <div class="flex-1">
              <label class="field-label text-xs"
                >Daily coding goal (hours)</label
              >
              <input
                v-model.number="goalsForm.dailyCodingGoal"
                type="number"
                min="0"
                step="0.5"
                class="field-control text-sm"
                required
              />
            </div>
            <button
              type="submit"
              class="btn-primary rounded-xl px-5 py-2.5"
              :disabled="goalsSubmitting"
            >
              {{ goalsSubmitting ? 'Saving…' : 'Update goals' }}
            </button>
          </form>
        </section>

        <!-- Insights -->
        <section v-if="insights && (activeTab === 'overview' || activeTab === 'performance')" class="dash-reveal mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">Smart brief</h2>
          <div
            class="insights-panel rounded-2xl p-6 shadow-lg shadow-black/20"
            :class="
              isDayTheme
                ? 'border border-blue-200/80 bg-gradient-to-br from-sky-50 to-blue-100'
                : 'border border-brand-gold/25 bg-gradient-to-br from-brand-elevated to-brand-panel'
            "
          >
            <ul class="space-y-3 text-sm" :class="isDayTheme ? 'text-slate-700' : 'text-slate-300'">
              <li class="flex gap-2">
                <span :class="isDayTheme ? 'text-blue-500' : 'text-brand-gold'">●</span>
                <span>{{ insights.stepGoalMet ? 'You met your step goal today' : 'You have not met your step goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span class="text-slate-400">●</span>
                <span>{{ insights.codingGoalMet ? 'You met your coding goal today' : 'You have not met your coding goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span :class="isDayTheme ? 'text-cyan-600' : 'text-amber-400/90'">●</span>
                <span v-if="insights.instagramUsageStatus === 'high'">You spent too much time on Instagram</span>
                <span v-else-if="insights.instagramUsageStatus === 'medium'">Instagram usage is moderate today</span>
                <span v-else>Instagram usage is low today</span>
              </li>
            </ul>
            <p class="mt-4 text-xs" :class="isDayTheme ? 'text-slate-600' : 'text-slate-500'">
              Instagram bands: low under 30 min, medium 30–59 min, high 60+ min (UTC day).
            </p>
            <p class="mt-2 text-xs" :class="isDayTheme ? 'text-slate-600' : 'text-slate-400'">
              AI-lite suggestions update as your logs + integration trends grow.
            </p>
          </div>
        </section>

        <!-- Charts -->
        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal mb-10">
          <div
            class="intelligence-strip mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            :class="isDayTheme ? 'border-blue-200/70 bg-gradient-to-r from-white to-sky-50' : ''"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Last 7 days intelligence</p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs"
                  :disabled="!chartWindowInfo.hasOlder"
                  @click="shiftChartWindow(7)"
                >
                  ◀ Older
                </button>
                <span class="text-[11px] text-slate-400">
                  {{ chartWindowInfo.first || '—' }} → {{ chartWindowInfo.last || '—' }}
                </span>
                <button
                  type="button"
                  class="btn-secondary px-2 py-1 text-xs"
                  :disabled="!chartWindowInfo.hasNewer"
                  @click="shiftChartWindow(-7)"
                >
                  Newer ▶
                </button>
              </div>
            </div>
            <ul class="mt-2 space-y-1 text-sm" :class="isDayTheme ? 'text-slate-700' : 'text-slate-200'">
              <li v-for="(tip, idx) in chartInsights" :key="idx">{{ tip }}</li>
            </ul>
          </div>
          <div
            v-if="chartWeek.isDemo"
            class="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/95 sm:flex-row sm:items-center sm:justify-between"
          >
            <p class="text-xs leading-relaxed sm:text-sm">
              <strong class="text-amber-50">Preview:</strong> charts below use
              <strong>sample numbers</strong> until you add real logs. Click the button to save this sample week to your database, or fill the daily log form.
            </p>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-amber-400/40 bg-amber-900/40 px-3 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-900/60 disabled:opacity-50"
              :disabled="sampleWeekBusy || loading"
              @click="insertSampleWeek"
            >
              {{ sampleWeekBusy ? 'Saving…' : 'Save sample week to database' }}
            </button>
          </div>
          <div class="grid gap-6 lg:grid-cols-2">
            <ChartCard
              title="Last 7 days"
              subtitle="Steps and coding hours"
            >
              <div class="relative min-h-[260px]">
                <div
                  v-if="chartWeek.isDemo"
                  class="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-dashed ring-white/10"
                  aria-hidden="true"
                />
                <Line
                  :data="lineChartData"
                  :options="lineChartOptions"
                />
              </div>
            </ChartCard>
            <ChartCard title="Screen time" subtitle="Stacked minutes (last 7 days)">
              <div class="relative min-h-[260px]">
                <div
                  v-if="chartWeek.isDemo"
                  class="pointer-events-none absolute inset-0 z-10 rounded-lg ring-1 ring-dashed ring-white/10"
                  aria-hidden="true"
                />
                <Bar
                  :data="barChartData"
                  :options="barChartOptions"
                />
              </div>
            </ChartCard>
          </div>
        </section>

        <!-- Daily log form -->
        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">
            Daily log
          </h2>
          <form
            class="panel grid gap-4 p-6 md:grid-cols-2"
            @submit.prevent="submitLog"
          >
            <div>
              <label class="field-label text-xs">Steps</label>
              <input
                v-model.number="form.steps"
                type="number"
                min="0"
                class="field-control text-sm"
                required
              />
            </div>
            <div>
              <label class="field-label text-xs"
                >Instagram (min)</label
              >
              <input
                v-model.number="form.instagram"
                type="number"
                min="0"
                class="field-control text-sm"
                required
              />
            </div>
            <div>
              <label class="field-label text-xs"
                >Total screen time (min)</label
              >
              <input
                v-model.number="form.totalScreen"
                type="number"
                min="0"
                class="field-control text-sm"
                required
              />
            </div>
            <div>
              <label class="field-label text-xs"
                >Coding hours</label
              >
              <input
                v-model.number="form.codingHours"
                type="number"
                min="0"
                step="0.25"
                class="field-control text-sm"
                required
              />
            </div>
            <div>
              <label class="field-label text-xs">Mood</label>
              <select
                v-model="form.mood"
                class="field-control text-sm"
              >
                <option value="productive">Productive</option>
                <option value="average">Average</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="field-label text-xs">Notes</label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="field-control text-sm"
                placeholder="Reflections, wins, blockers…"
              />
            </div>

            <div class="md:col-span-2 border-t border-white/10 pt-4">
              <button
                type="button"
                class="btn-secondary mb-3 text-xs"
                @click="showAdvancedLog = !showAdvancedLog"
              >
                {{ showAdvancedLog ? 'Hide advanced metrics' : 'Show advanced metrics' }}
              </button>
            </div>

            <div v-if="showAdvancedLog" class="md:col-span-2 border-t border-white/10 pt-4">
              <h3 class="mb-3 text-sm font-semibold text-slate-200">
                Extended metrics (manual — automate later per roadmap)
              </h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div v-for="field in DAILY_METRIC_FIELDS" :key="field.key">
                  <label class="field-label text-xs"
                    >{{ field.label }}
                    <span v-if="field.suffix" class="text-slate-400"
                      >({{ field.suffix }})</span
                    ></label
                  >
                  <input
                    v-model="metricsForm[field.key]"
                    type="text"
                    inputmode="decimal"
                    class="field-control text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div class="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                class="btn-primary rounded-xl px-5 py-2.5"
                :disabled="formSubmitting"
              >
                {{ formSubmitting ? 'Saving…' : 'Save log for today' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Projects -->
        <section v-if="activeTab === 'overview' || activeTab === 'performance'" class="dash-reveal">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">Projects</h2>
          <div
            class="panel mb-6 grid gap-4 p-6 md:grid-cols-2"
          >
            <div>
              <label class="field-label text-xs">Name</label>
              <input
                v-model="newProject.name"
                type="text"
                class="field-control text-sm"
                required
              />
            </div>
            <div>
              <label class="field-label text-xs">Status</label>
              <select
                v-model="newProject.status"
                class="field-control text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="field-label text-xs"
                >Hours spent</label
              >
              <input
                v-model.number="newProject.hoursSpent"
                type="number"
                min="0"
                step="0.5"
                class="field-control text-sm"
                required
              />
            </div>
            <div class="md:col-span-2">
              <label class="field-label text-xs"
                >Description</label
              >
              <input
                v-model="newProject.description"
                type="text"
                class="field-control text-sm"
              />
            </div>
            <div class="md:col-span-2">
              <button
                type="button"
                class="btn-secondary rounded-xl px-5 py-2.5 font-semibold disabled:opacity-60"
                :disabled="projectSubmitting || !newProject.name"
                @click="addProject"
              >
                {{ projectSubmitting ? 'Adding…' : 'Add project' }}
              </button>
            </div>
          </div>

          <div class="space-y-3">
            <ProjectCard
              v-for="p in projects"
              :key="p._id"
              :project="p"
              @update-status="updateProjectStatus"
            />
            <p v-if="!projects.length" class="text-sm text-slate-500">
              No projects yet.
            </p>
          </div>
        </section>

        <section v-if="activeTab === 'rag'" class="dash-reveal mb-10">
          <div class="dash-section-head border-0 pb-4">
            <div>
              <p class="dash-eyebrow">LiveContext OS</p>
              <h2 class="dash-title text-xl">RAG workspace</h2>
              <p class="dash-desc max-w-lg">
                Plug your retrieval system here to generate real-time context insights from your dashboard data.
              </p>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <div class="panel p-5 lg:col-span-2">
              <p class="text-xs uppercase tracking-wide text-slate-500">Context feed</p>
              <div class="mt-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4">
                <p class="text-sm text-slate-300">
                  RAG module not connected yet. This area will show retrieved context chunks and live citations from
                  integrations, logs, and projects.
                </p>
                <ul class="mt-3 space-y-1 text-xs text-slate-400">
                  <li>• Latest integration summaries</li>
                  <li>• Trend deltas over selected window</li>
                  <li>• Project updates + daily note embeddings</li>
                </ul>
              </div>
            </div>

            <div class="panel p-5">
              <p class="text-xs uppercase tracking-wide text-slate-500">Pipeline status</p>
              <div class="mt-3 space-y-2 text-sm text-slate-300">
                <p><span class="text-slate-500">Retriever:</span> Not connected</p>
                <p><span class="text-slate-500">Vector DB:</span> Not connected</p>
                <p><span class="text-slate-500">Indexer:</span> Ready for setup</p>
              </div>
              <button type="button" class="btn-primary mt-4 w-full text-sm">
                Configure RAG (coming soon)
              </button>
            </div>
          </div>
        </section>
          </div>
        </div>
      </template>
    </main>
    <div
      v-if="!loading"
      class="today-status-bar fixed bottom-4 left-1/2 z-30 w-[min(94vw,900px)] -translate-x-1/2 rounded-2xl border border-white/15 bg-brand-navy/80 px-4 py-3 shadow-2xl backdrop-blur-xl"
    >
      <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs sm:text-sm">
        <span class="font-semibold text-slate-100">{{ selectedDateLabel }}</span>
        <span class="text-brand-gold">Score: {{ todayScore }}</span>
        <span class="text-slate-200">Coding: {{ summaryCoding }}</span>
        <span class="text-slate-200">Instagram: {{ summaryIg }}</span>
        <span :class="focusStatus.tone">Focus: {{ focusStatus.label }}</span>
      </div>
    </div>
  </div>
</template>
