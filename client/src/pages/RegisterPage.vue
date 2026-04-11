<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '../services/api.js';
import { refreshAuth, profileComplete } from '../authState.js';

const router = useRouter();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const submitting = ref(false);
const error = ref('');

function formatError(e) {
  const d = e.response?.data;
  if (d?.error) return d.error;
  if (Array.isArray(d?.errors) && d.errors[0]?.msg) {
    return d.errors.map((x) => x.msg).join(', ');
  }
  return e.message || 'Registration request failed';
}

async function submit() {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }
  submitting.value = true;
  error.value = '';
  try {
    await authApi.register({
      email: email.value,
      password: password.value,
    });
    await refreshAuth();
    if (profileComplete.value) {
      router.push({ name: 'dashboard' });
    } else {
      router.push({ name: 'profile' });
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
    <p class="text-sm font-medium text-sky-600">Account</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">
      Create account
    </h1>
    <p class="mt-2 text-sm text-slate-500">
      Password is hashed with bcrypt; you are logged in after sign up.
    </p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm font-medium text-slate-700" for="reg-email"
          >Email</label
        >
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700" for="reg-pass"
          >Password</label
        >
        <input
          id="reg-pass"
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <div>
        <label
          class="block text-sm font-medium text-slate-700"
          for="reg-confirm"
          >Confirm password</label
        >
        <input
          id="reg-confirm"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-60"
      >
        {{ submitting ? 'Sending…' : 'Register' }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-red-700">{{ error }}</p>

    <p class="mt-8 text-center text-sm text-slate-500">
      Already have an account?
      <RouterLink
        to="/login"
        class="font-medium text-sky-600 hover:text-sky-700"
        >Log in</RouterLink
      >
    </p>
  </div>
</template>
