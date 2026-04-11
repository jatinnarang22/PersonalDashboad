<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5"
  >
    <div class="mb-4">
      <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <div class="min-h-[240px]">
      <slot />
    </div>
  </div>
</template>
