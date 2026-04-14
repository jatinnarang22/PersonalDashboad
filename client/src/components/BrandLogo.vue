<script setup>
/** Final brand lockup — `public/logo.png` (copy also in `/brand/personal-life-dashboard-logo.png`). */
defineProps({
  variant: {
    type: String,
    default: 'nav',
    validator: (v) => ['nav', 'hero', 'auth'].includes(v),
  },
});
</script>

<template>
  <img
    src="/logo.png"
    alt="Personal Life Dashboard"
    class="w-auto object-contain object-left"
    :class="{
      'h-9 max-h-10': variant === 'nav',
      'h-14 max-h-16 sm:h-16': variant === 'hero',
      'mx-auto h-20 max-h-24 sm:h-24': variant === 'auth',
    }"
    width="320"
    height="120"
    loading="lazy"
    decoding="async"
  />
</template>
