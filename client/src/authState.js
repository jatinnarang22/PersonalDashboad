import { ref } from 'vue';
import { authApi } from './services/api.js';

export const currentUser = ref(null);
/** From GET /api/auth/me — true when profile has enough fields to skip /profile */
export const profileComplete = ref(false);

export async function refreshAuth() {
  try {
    const { data } = await authApi.me();
    currentUser.value = data.user ?? null;
    profileComplete.value = data.profileComplete === true;
  } catch {
    currentUser.value = null;
    profileComplete.value = false;
  }
}

export async function logoutAndClear() {
  try {
    await authApi.logout();
  } catch {
    /* ignore */
  }
  currentUser.value = null;
  profileComplete.value = false;
}
