<script setup>
import { ref } from 'vue';
import BrandLogo from '../components/BrandLogo.vue';
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
    <BrandLogo variant="auth" />
    <p class="mt-8 text-sm font-medium text-brand-gold">Account</p>
    <h1 class="mt-1 text-2xl font-bold tracking-tight text-slate-100">
      Create account
    </h1>
    <p class="mt-2 text-sm text-slate-400">
      Password is hashed with bcrypt; you are logged in after sign up.
    </p>

    <form class="mt-8 space-y-4" @submit.prevent="submit">
      <div>
        <label class="field-label" for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          class="field-control"
        />
      </div>
      <div>
        <label class="field-label" for="reg-pass">Password</label>
        <input
          id="reg-pass"
          v-model="password"
          type="password"
          autocomplete="new-password"
          class="field-control"
        />
      </div>
      <div>
        <label class="field-label" for="reg-confirm">Confirm password</label>
        <input
          id="reg-confirm"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
          class="field-control"
        />
      </div>
      <button
        type="submit"
        :disabled="submitting"
        class="btn-primary w-full"
      >
        {{ submitting ? 'Sending…' : 'Register' }}
      </button>
    </form>

    <p v-if="error" class="mt-4 text-sm text-red-300">{{ error }}</p>

    <p class="mt-8 text-center text-sm text-slate-500">
      Already have an account?
      <RouterLink to="/login" class="link-accent">Log in</RouterLink>
    </p>
  </div>
</template>
