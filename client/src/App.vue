<script setup>
import { useRoute, useRouter } from 'vue-router';
import { currentUser, logoutAndClear } from './authState.js';

const route = useRoute();
const router = useRouter();

function linkClass(name) {
  return route.name === name
    ? 'text-sky-700 font-medium'
    : 'text-slate-600 hover:text-slate-900';
}

async function logout() {
  await logoutAndClear();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen">
    <nav
      class="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
    >
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm"
      >
        <RouterLink to="/" class="font-semibold text-slate-900"
          >Life Dashboard</RouterLink
        >
        <template v-if="currentUser">
          <RouterLink to="/" :class="linkClass('dashboard')">Home</RouterLink>
          <RouterLink
            :to="{ name: 'profile', query: { edit: '1' } }"
            :class="linkClass('profile')"
            >Profile</RouterLink
          >
          <span class="text-slate-400">|</span>
          <span class="text-slate-600">{{ currentUser.email }}</span>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
