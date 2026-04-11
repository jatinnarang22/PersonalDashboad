<script setup>
import { ref, computed, onMounted } from 'vue';
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
import StatCard from '../components/StatCard.vue';
import ChartCard from '../components/ChartCard.vue';
import ProjectCard from '../components/ProjectCard.vue';
import {
  logsApi,
  projectsApi,
  goalsApi,
  insightsApi,
  todayISO,
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

const loading = ref(true);
const error = ref('');

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

const today = computed(() => todayISO());

const moodLabels = {
  productive: 'Productive',
  average: 'Average',
  low: 'Low',
};

const last7 = computed(() => {
  const sorted = [...allLogs.value].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-7);
});

const lineChartData = computed(() => ({
  labels: last7.value.map((l) => l.date.slice(5)),
  datasets: [
    {
      label: 'Steps',
      data: last7.value.map((l) => l.steps),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.12)',
      fill: true,
      tension: 0.35,
      yAxisID: 'y',
    },
    {
      label: 'Coding hours',
      data: last7.value.map((l) => l.codingHours),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
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
    legend: { position: 'bottom', labels: { usePointStyle: true } },
  },
  scales: {
    y: {
      type: 'linear',
      position: 'left',
      title: { display: true, text: 'Steps' },
      grid: { color: 'rgba(148, 163, 184, 0.2)' },
    },
    y1: {
      type: 'linear',
      position: 'right',
      title: { display: true, text: 'Hours' },
      grid: { drawOnChartArea: false },
    },
    x: {
      grid: { display: false },
    },
  },
}));

const barChartData = computed(() => {
  const labels = last7.value.map((l) => l.date.slice(5));
  const ig = last7.value.map((l) => l.screenTime?.instagram ?? 0);
  const other = last7.value.map((l) => {
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
        backgroundColor: 'rgba(236, 72, 153, 0.75)',
        borderRadius: 6,
      },
      {
        label: 'Other screen (min)',
        data: other,
        backgroundColor: 'rgba(148, 163, 184, 0.65)',
        borderRadius: 6,
      },
    ],
  };
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { usePointStyle: true } },
  },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: { stacked: true, title: { display: true, text: 'Minutes' } },
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
  } catch (e) {
    error.value =
      e.response?.data?.error ||
      e.message ||
      'Failed to load dashboard. Is the API running?';
  } finally {
    loading.value = false;
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

onMounted(load);
</script>

<template>
  <div class="min-h-screen">
    <header
      class="border-b border-slate-200/80 bg-white/80 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p class="text-sm font-medium text-sky-600">Personal</p>
          <h1 class="text-3xl font-bold tracking-tight text-slate-900">
            Life Dashboard
          </h1>
          <p class="mt-1 text-sm text-slate-500">
            Track habits, projects, and daily balance. Integration ideas:
            <code class="rounded bg-slate-100 px-1 text-xs text-slate-600"
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
        class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        {{ error }}
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-500">
        Loading dashboard…
      </div>

      <template v-else>
        <!-- Today's summary -->
        <section class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">
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
              class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <p class="text-sm font-medium text-slate-500">Steps vs goal</p>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-semibold">{{ summarySteps }}</span>
                <span class="text-slate-400">/</span>
                <span class="text-lg text-slate-600">{{ goals.dailyStepsGoal }}</span>
              </div>
              <div
                class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  class="h-full rounded-full bg-sky-500 transition-all"
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
              class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <p class="text-sm font-medium text-slate-500">Coding vs goal</p>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-2xl font-semibold">{{ summaryCoding }}</span>
                <span class="text-slate-400">/</span>
                <span class="text-lg text-slate-600"
                  >{{ goals.dailyCodingGoal }} hrs</span
                >
              </div>
              <div
                class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  class="h-full rounded-full bg-violet-500 transition-all"
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

        <!-- Goals -->
        <section v-if="goals" class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Goals</h2>
          <form
            class="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-end"
            @submit.prevent="saveGoals"
          >
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600"
                >Daily steps goal</label
              >
              <input
                v-model.number="goalsForm.dailyStepsGoal"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-slate-600"
                >Daily coding goal (hours)</label
              >
              <input
                v-model.number="goalsForm.dailyCodingGoal"
                type="number"
                min="0"
                step="0.5"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <button
              type="submit"
              class="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              :disabled="goalsSubmitting"
            >
              {{ goalsSubmitting ? 'Saving…' : 'Update goals' }}
            </button>
          </form>
        </section>

        <!-- Insights -->
        <section v-if="insights" class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Insights</h2>
          <div
            class="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm"
          >
            <ul class="space-y-3 text-sm text-slate-700">
              <li class="flex gap-2">
                <span class="text-sky-500">●</span>
                <span>{{ insights.stepGoalMet ? 'You met your step goal today' : 'You have not met your step goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span class="text-violet-500">●</span>
                <span>{{ insights.codingGoalMet ? 'You met your coding goal today' : 'You have not met your coding goal yet today' }}</span>
              </li>
              <li class="flex gap-2">
                <span class="text-pink-500">●</span>
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
        <section class="mb-10 grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Last 7 days"
            subtitle="Steps and coding hours"
          >
            <Line
              v-if="last7.length"
              :data="lineChartData"
              :options="lineChartOptions"
            />
            <p v-else class="py-12 text-center text-sm text-slate-500">
              No log data yet. Add logs to see trends.
            </p>
          </ChartCard>
          <ChartCard title="Screen time" subtitle="Stacked minutes (last 7 logs)">
            <Bar
              v-if="last7.length"
              :data="barChartData"
              :options="barChartOptions"
            />
            <p v-else class="py-12 text-center text-sm text-slate-500">
              No log data yet.
            </p>
          </ChartCard>
        </section>

        <!-- Daily log form -->
        <section class="mb-10">
          <h2 class="mb-4 text-lg font-semibold text-slate-900">
            Daily log
          </h2>
          <form
            class="grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:grid-cols-2"
            @submit.prevent="submitLog"
          >
            <div>
              <label class="block text-xs font-medium text-slate-600">Steps</label>
              <input
                v-model.number="form.steps"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600"
                >Instagram (min)</label
              >
              <input
                v-model.number="form.instagram"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600"
                >Total screen time (min)</label
              >
              <input
                v-model.number="form.totalScreen"
                type="number"
                min="0"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600"
                >Coding hours</label
              >
              <input
                v-model.number="form.codingHours"
                type="number"
                min="0"
                step="0.25"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600">Mood</label>
              <select
                v-model="form.mood"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
              >
                <option value="productive">Productive</option>
                <option value="average">Average</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600">Notes</label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                placeholder="Reflections, wins, blockers…"
              />
            </div>

            <div class="md:col-span-2 border-t border-slate-100 pt-4">
              <h3 class="mb-3 text-sm font-semibold text-slate-800">
                Extended metrics (manual — automate later per roadmap)
              </h3>
              <div class="grid gap-4 md:grid-cols-2">
                <div v-for="field in DAILY_METRIC_FIELDS" :key="field.key">
                  <label class="block text-xs font-medium text-slate-600"
                    >{{ field.label }}
                    <span v-if="field.suffix" class="text-slate-400"
                      >({{ field.suffix }})</span
                    ></label
                  >
                  <input
                    v-model="metricsForm[field.key]"
                    type="text"
                    inputmode="decimal"
                    class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div class="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                class="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                :disabled="formSubmitting"
              >
                {{ formSubmitting ? 'Saving…' : 'Save log for today' }}
              </button>
            </div>
          </form>
        </section>

        <!-- Projects -->
        <section>
          <h2 class="mb-4 text-lg font-semibold text-slate-900">Projects</h2>
          <div
            class="mb-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:grid-cols-2"
          >
            <div>
              <label class="block text-xs font-medium text-slate-600">Name</label>
              <input
                v-model="newProject.name"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600">Status</label>
              <select
                v-model="newProject.status"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-600"
                >Hours spent</label
              >
              <input
                v-model.number="newProject.hoursSpent"
                type="number"
                min="0"
                step="0.5"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
                required
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-slate-600"
                >Description</label
              >
              <input
                v-model="newProject.description"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-sky-500/30 focus:ring-2"
              />
            </div>
            <div class="md:col-span-2">
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
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
