<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { currentUser, logoutAndClear } from './authState.js';
import BrandLogo from './components/BrandLogo.vue';

const route = useRoute();
const router = useRouter();
const theme = ref('night');

function applyTheme(nextTheme) {
  document.documentElement.setAttribute('data-theme', nextTheme);
}

function toggleTheme() {
  theme.value = theme.value === 'night' ? 'day' : 'night';
}

onMounted(() => {
  const saved = localStorage.getItem('pld-theme');
  if (saved === 'day' || saved === 'night') {
    theme.value = saved;
  } else {
    // Default: dark UI (calmer, more “command center”). User can switch to day any time.
    theme.value = 'night';
  }
  applyTheme(theme.value);
});

watch(theme, (v) => {
  applyTheme(v);
  localStorage.setItem('pld-theme', v);
});

function linkClass(name) {
  return route.name === name
    ? 'nav-link-active rounded-full px-3.5 py-2 text-xs font-semibold text-brand-bright ring-1 ring-brand-gold/40 ring-offset-2 ring-offset-transparent transition'
    : 'nav-link rounded-full px-3.5 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100';
}

async function logout() {
  await logoutAndClear();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen">
    <nav class="sticky top-0 z-20 border-b border-white/10 bg-brand-navy/75 backdrop-blur-xl">
      <div
        class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
      >
        <div class="flex items-center gap-4">
          <RouterLink
            to="/"
            class="flex items-center gap-2 rounded-md outline-none ring-brand-gold/40 focus-visible:ring-2"
          >
            <BrandLogo variant="nav" />
          </RouterLink>
          <div class="hidden h-5 w-px bg-white/10 sm:block" />
          <div class="flex items-center gap-1.5">
            <template v-if="currentUser">
              <RouterLink to="/" :class="linkClass('dashboard')">Home</RouterLink>
              <RouterLink to="/integrations" :class="linkClass('integrations')">Integrations</RouterLink>
              <RouterLink to="/blog" :class="linkClass('blog')">Blog</RouterLink>
              <RouterLink
                :to="{ name: 'profile', query: { edit: '1' } }"
                :class="linkClass('profile')"
                >Profile</RouterLink
              >
            </template>
            <template v-else>
              <RouterLink to="/login" :class="linkClass('login')">Login</RouterLink>
              <RouterLink to="/register" :class="linkClass('register')">Register</RouterLink>
            </template>
          </div>
        </div>
        <div
          class="nav-actions flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 ring-1 ring-white/5"
        >
          <button
            type="button"
            class="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-gold/35 hover:text-white"
            @click="toggleTheme"
          >
            {{ theme === 'night' ? 'Light theme' : 'Dark theme' }}
          </button>
          <template v-if="currentUser">
            <span class="max-w-[11rem] truncate px-2 text-xs text-slate-300 sm:max-w-[14rem]">{{
              currentUser.email
            }}</span>
            <button
              type="button"
              class="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-gold/35 hover:text-white"
              @click="logout"
            >
              Log out
            </button>
          </template>
        </div>
      </div>
    </nav>
    <div class="theme-page">
      <router-view />
    </div>
  </div>
</template>
