<script setup>
import { ref, onMounted } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import { useRouter } from 'vue-router';
import { profileApi } from '../services/api.js';
import { emptyProfile } from '../constants/profileDefaults.js';

const router = useRouter();

/** Only platforms with realistic free developer / public APIs for stats or automation */
const socialFields = [
  ['instagram', 'Instagram'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['youtube', 'YouTube'],
];

const profile = ref(emptyProfile());
const loading = ref(true);
const saving = ref(false);
const error = ref('');

function applyServerProfile(p) {
  const base = emptyProfile();
  for (const k of Object.keys(base)) {
    const v = p[k];
    if (v === null || v === undefined) base[k] = '';
    else if (typeof v === 'number' && (k === 'heightCm' || k === 'weightKg')) {
      base[k] = String(v);
    } else base[k] = String(v);
  }
  profile.value = base;
}

function buildPayload() {
  const p = profile.value;
  const num = (s) => {
    const n = parseFloat(String(s).trim());
    return Number.isFinite(n) ? n : null;
  };
  return {
    displayName: p.displayName.trim(),
    email: p.email.trim(),
    bio: p.bio.trim(),
    heightCm: num(p.heightCm),
    weightKg: num(p.weightKg),
    dateOfBirth: p.dateOfBirth.trim(),
    gender: p.gender.trim(),
    phone: p.phone.trim(),
    city: p.city.trim(),
    country: p.country.trim(),
    timezone: p.timezone.trim(),
    website: p.website.trim(),
    instagram: p.instagram.trim(),
    linkedin: p.linkedin.trim(),
    github: p.github.trim(),
    youtube: p.youtube.trim(),
  };
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await profileApi.get();
    if (data?.profile) applyServerProfile(data.profile);
  } catch (e) {
    error.value =
      e.response?.data?.error || e.message || 'Could not load profile';
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await profileApi.update(buildPayload());
    await router.push({ name: 'dashboard' });
  } catch (e) {
    error.value =
      e.response?.data?.error || e.message || 'Could not save profile';
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <BrandLogo variant="hero" />
    <p class="mt-8 text-sm font-medium text-brand-gold">Profile</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-100">
      Your details
    </h1>
    <p class="mt-2 text-sm text-slate-400">
      Saved on your user document in MongoDB. Social fields are plain URLs only (no OAuth).
      If you use
      <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">USE_MEMORY_MONGO=true</code>,
      data is still in MongoDB but clears when the API process stops—use a real
      <code class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">MONGODB_URI</code>
      to keep it after restarts.
    </p>

    <div
      v-if="error"
      class="mt-6 rounded-xl border border-red-500/30 bg-red-950/50 px-4 py-3 text-sm text-red-200"
    >
      {{ error }}
    </div>
    <div v-if="loading" class="py-16 text-center text-slate-500">
      Loading profile…
    </div>

    <form v-else class="mt-8 space-y-10" @submit.prevent="save">
      <section>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Basics
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="field-label">Display name</label>
            <input
              v-model="profile.displayName"
              type="text"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Email</label>
            <input
              v-model="profile.email"
              type="email"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Phone</label>
            <input
              v-model="profile.phone"
              type="tel"
              class="field-control"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="field-label">Bio</label>
            <textarea
              v-model="profile.bio"
              rows="3"
              class="field-control"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Body
        </h2>
        <p class="mb-3 text-xs text-slate-500">
          Stored as metric (cm / kg) — convert in the UI if you prefer imperial.
        </p>
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="field-label">Height (cm)</label>
            <input
              v-model="profile.heightCm"
              type="text"
              inputmode="decimal"
              placeholder="e.g. 175"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Weight (kg)</label>
            <input
              v-model="profile.weightKg"
              type="text"
              inputmode="decimal"
              placeholder="e.g. 70"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Date of birth</label>
            <input
              v-model="profile.dateOfBirth"
              type="date"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Gender</label>
            <input
              v-model="profile.gender"
              type="text"
              placeholder="optional"
              class="field-control"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Location & site
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="field-label">City</label>
            <input
              v-model="profile.city"
              type="text"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Country</label>
            <input
              v-model="profile.country"
              type="text"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Timezone</label>
            <input
              v-model="profile.timezone"
              type="text"
              placeholder="e.g. America/New_York"
              class="field-control"
            />
          </div>
          <div>
            <label class="field-label">Personal website</label>
            <input
              v-model="profile.website"
              type="url"
              placeholder="https://"
              class="field-control"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Social & links
        </h2>
        <p class="mb-3 text-xs text-slate-500">
          Only services where public or free-tier developer APIs exist for stats or automation
          (e.g. GitHub, YouTube). Paste profile URLs — no OAuth here.
        </p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="pair in socialFields" :key="pair[0]">
            <label class="field-label">{{ pair[1] }}</label>
            <input
              v-model="profile[pair[0]]"
              type="url"
              placeholder="https://"
              class="field-control text-sm"
            />
          </div>
        </div>
      </section>

      <div class="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          :disabled="saving"
          class="btn-primary rounded-lg px-5 py-2.5"
        >
          {{ saving ? 'Saving…' : 'Save profile' }}
        </button>
        <RouterLink
          to="/"
          class="text-sm font-medium text-slate-400 hover:text-slate-200"
          >Back to dashboard</RouterLink
        >
      </div>
    </form>
  </div>
</template>
