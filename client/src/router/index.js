import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';
import ProfilePage from '../pages/ProfilePage.vue';
import { refreshAuth, currentUser, profileComplete } from '../authState.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { guestOnly: true } },
    { path: '/profile', name: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to, from, next) => {
  await refreshAuth();

  if (to.meta.requiresAuth && !currentUser.value) {
    const query =
      to.path !== '/' ? { redirect: to.fullPath } : {};
    return next({ name: 'login', query });
  }

  // Skip onboarding profile when already complete (nav "Profile" uses ?edit=1 to edit)
  if (
    to.name === 'profile' &&
    currentUser.value &&
    profileComplete.value &&
    to.query.edit !== '1'
  ) {
    return next({ name: 'dashboard' });
  }

  if (to.meta.guestOnly && currentUser.value) {
    return next({ name: 'dashboard' });
  }

  next();
});

export default router;
