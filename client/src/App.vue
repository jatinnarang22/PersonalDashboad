<script setup>
import { useRoute, useRouter } from 'vue-router';
import { currentUser, logoutAndClear } from './authState.js';
import BrandLogo from './components/BrandLogo.vue';

const route = useRoute();
const router = useRouter();

function linkClass(name) {
  return route.name === name
    ? 'text-brand-gold font-medium'
    : 'text-slate-400 hover:text-slate-200';
}

async function logout() {
  await logoutAndClear();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen">
    <nav
      class="sticky top-0 z-10 border-b border-brand-gold/20 bg-brand-navy/90 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm"
      >
        <RouterLink
          to="/"
          class="flex items-center gap-2 rounded-md outline-none ring-brand-gold/40 focus-visible:ring-2"
        >
          <BrandLogo variant="nav" />
        </RouterLink>
        <template v-if="currentUser">
          <RouterLink to="/" :class="linkClass('dashboard')">Home</RouterLink>
          <RouterLink
            :to="{ name: 'profile', query: { edit: '1' } }"
            :class="linkClass('profile')"
            >Profile</RouterLink
          >
          <span class="text-slate-600">|</span>
          <span class="max-w-[14rem] truncate text-slate-400">{{ currentUser.email }}</span>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            @click="logout"
          >
            Log out
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" :class="linkClass('login')">Login</RouterLink>
          <RouterLink to="/register" :class="linkClass('register')"
            >Register</RouterLink
          >
        </template>
      </div>
    </nav>
    <router-view />
  </div>
</template>
