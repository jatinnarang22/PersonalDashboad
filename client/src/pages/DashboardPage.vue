<script setup>
import { ref, computed, onMounted } from 'vue';
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
const igSummaryError = ref('');
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

const today = computed(() => todayISO());

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
  const slice = sorted.slice(-7);
  if (slice.length > 0) {
    return { logs: slice, isDemo: false };
  }
  return { logs: buildDemoWeekLogs(), isDemo: true };
});

const sampleWeekBusy = ref(false);

function instagramPreviewSummary(username = '') {
  return {
    username: username || 'your_instagram',
    biography:
      'Connected successfully. Live profile metrics are temporarily unavailable, so this preview helps validate the dashboard layout.',
    followersCount: 1240,
    mediaCount: 38,
    recentMedia: [
      {
        id: 'preview-1',
        permalink: 'https://www.instagram.com/',
        mediaType: 'IMAGE',
        mediaUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=60',
      },
      {
        id: 'preview-2',
        permalink: 'https://www.instagram.com/',
        mediaType: 'CAROUSEL_ALBUM',
        mediaUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=60',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=60',
      },
    ],
    note: 'Preview data shown. Reconnect token with instagram_basic + pages_show_list for live metrics.',
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

const summarySteps = computed(
  () => todayLog.value?.steps ?? insights.value?.today?.steps ?? '—'
);
const summaryCoding = computed(
  () => todayLog.value?.codingHours ?? insights.value?.today?.codingHours ?? '—'
);
const summaryIg = computed(() => {
  const m = todayLog.value?.screenTime?.instagram;
  if (m != null) return `${m} min`;
  if (insights.value?.today?.instagramMinutes != null) {
    return `${insights.value.today.instagramMinutes} min`;
  }
  return '—';
});
const summaryMood = computed(() => {
  const m = todayLog.value?.mood ?? insights.value?.today?.mood;
  return m ? moodLabels[m] || m : '—';
});

function summaryMetric(key) {
  const v = todayLog.value?.metrics?.[key];
  if (v == null || v === '') return '—';
  if (key === 'sleepHours') return `${v} hrs`;
  return String(v);
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

    try {
      const tl = await logsApi.getByDate(today.value);
      todayLog.value = tl.data;
      form.value = {
        steps: tl.data.steps,
        instagram: tl.data.screenTime?.instagram ?? 0,
        totalScreen: tl.data.screenTime?.total ?? 0,
        codingHours: tl.data.codingHours,
        mood: tl.data.mood,
        notes: tl.data.notes ?? '',
      };
      metricsForm.value = metricsFromServer(tl.data.metrics);
    } catch (e) {
      if (e.response?.status === 404) {
        todayLog.value = null;
        form.value = {
          steps: 0,
          instagram: 0,
          totalScreen: 0,
          codingHours: 0,
          mood: 'average',
          notes: '',
        };
        metricsForm.value = emptyMetricsForm();
      } else {
        throw e;
      }
    }
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
  try {
    const { data } = await integrationsApi.status();
    integrationStatus.value = data;
    ytSummary.value = null;
    igSummary.value = null;
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
      date: today.value,
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
  const q = route.query;
  if (q.integration === 'youtube_ok') {
    integrationBanner.value = { kind: 'success', text: 'YouTube connected.' };
  } else if (q.integration === 'instagram_ok') {
    integrationBanner.value = { kind: 'success', text: 'Instagram connected.' };
  } else if (q.integration === 'youtube_err' || q.integration === 'instagram_err') {
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
</script>

<template>
  <div class="min-h-screen">
    <header
      class="border-b border-white/10 bg-brand-navy/70 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <BrandLogo variant="hero" />
          <p class="mt-3 text-sm text-slate-400">
            Track habits, projects, and daily balance. Integration ideas:
            <code class="rounded bg-white/10 px-1 text-xs text-slate-300"
              >docs/PERSONAL_DASHBOARD_ROADMAP.md</code
            >
          </p>
        </div>
        <p class="text-sm text-slate-500">Today (UTC): {{ today }}</p>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <div
        v-if="error"
        class="mb-6 rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
      >
        {{ error }}
      </div>

      <div
        v-if="integrationBanner"
        class="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm"
        :class="
          integrationBanner.kind === 'error'
            ? 'border-red-500/30 bg-red-950/50 text-red-200'
            : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
        "
      >
        <span>{{ integrationBanner.text }}</span>
        <button
          type="button"
          class="font-medium underline decoration-slate-500 underline-offset-2 hover:text-slate-100"
          @click="integrationBanner = null"
        >
          Dismiss
        </button>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-500">
        Loading dashboard…
      </div>

      <template v-else>
        <!-- Today's summary -->
        <section class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">
            Today&apos;s summary
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Steps" :value="summarySteps" />
            <StatCard label="Coding hours" :value="summaryCoding" />
            <StatCard label="Instagram" :value="summaryIg" />
            <StatCard label="Mood" :value="summaryMood" />
          </div>

          <div
            class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
              class="panel p-5"
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
              class="panel p-5"
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

        <!-- OAuth integrations -->
        <section class="mb-10">
          <h2 class="mb-2 text-lg font-semibold text-slate-100">
            YouTube &amp; Instagram
          </h2>
          <p class="mb-4 text-sm text-slate-500">
            Connect accounts to pull read-only summaries into this dashboard. YouTube shows your channel and
            liked videos (the public API does not expose private watch history). Instagram requires a
            <strong class="font-medium text-brand-gold">Creator or Business</strong> account linked to a Facebook Page.
          </p>

          <div
            v-if="integrationsLoading && !integrationStatus"
            class="text-sm text-slate-500"
          >
            Loading connections…
          </div>

          <div
            v-else
            class="grid gap-6 lg:grid-cols-2"
          >
            <div
              class="panel p-6"
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
              class="panel p-6"
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
          </div>
        </section>

        <!-- Goals -->
        <section v-if="goals" class="mb-10">
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
        <section v-if="insights" class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-100">Insights</h2>
          <div
            class="rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-elevated to-brand-panel p-6 shadow-lg shadow-black/20"
          >
            <ul class="space-y-3 text-sm text-slate-300">
              <li class="flex gap-2">
                <span class="text-brand-gold">●</span>
                <span>{{ insights.stepGoalMet ? 'You met your step goal today' : 'You have not met your step goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span class="text-slate-400">●</span>
                <span>{{ insights.codingGoalMet ? 'You met your coding goal today' : 'You have not met your coding goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span class="text-amber-400/90">●</span>
                <span v-if="insights.instagramUsageStatus === 'high'">You spent too much time on Instagram</span>
                <span v-else-if="insights.instagramUsageStatus === 'medium'">Instagram usage is moderate today</span>
                <span v-else>Instagram usage is low today</span>
              </li>
            </ul>
            <p class="mt-4 text-xs text-slate-500">
              Instagram bands: low under 30 min, medium 30–59 min, high 60+ min (UTC day).
            </p>
          </div>
        </section>

        <!-- Charts -->
        <section class="mb-10">
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
        <section class="mb-10">
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
        <section>
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
      </template>
    </main>
  </div>
</template>
