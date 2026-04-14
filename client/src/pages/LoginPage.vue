<script setup>
import { ref } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
import { useRoute, useRouter } from 'vue-router';
import { authApi } from '../services/api.js';
import { refreshAuth, profileComplete } from '../authState.js';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const submitting = ref(false);
const error = ref('');

function formatError(e) {
  const d = e.response?.data;
  if (d?.error) return d.error;
  if (Array.isArray(d?.errors) && d.errors[0]?.msg) {
    return d.errors.map((x) => x.msg).join(', ');
  }
  return e.message || 'Login request failed';
}

async function submit() {
  submitting.value = true;
  error.value = '';
  try {
    await authApi.login({
      email: email.value,
      password: password.value,
    });
    await refreshAuth();
    const redirect = route.query.redirect;
    if (typeof redirect === 'string' && redirect) {
      router.push(redirect);
    } else if (!profileComplete.value) {
      router.push({ name: 'profile' });
    } else {
      router.push('/');
    }
  } catch (e) {
    error.value = formatError(e);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-16">
    <BrandLogo variant="auth" />
    <p class="mt-8 text-sm font-medium text-brand-gold">Account</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-100">
      Log in
    </h1>
    <p class="mt-2 text-sm text-slate-400">
      Session cookie (HTTP-only). Dashboard opens only when you are logged in.
    </p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <div>
        <label class="field-label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="username"
          class="field-control"
        />
      </div>
      <div>
        <label class="field-label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="field-control"
        />
      </div>
      <button
        type="submit"
        :disabled="submitting"
        class="btn-primary w-full"
      >
        {{ submitting ? 'Signing in…' : 'Log in' }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-red-300">{{ error }}</p>

    <p class="mt-8 text-center text-sm text-slate-500">
      No account?
      <RouterLink to="/register" class="link-accent">Register</RouterLink>
    </p>
  </div>
</template>
