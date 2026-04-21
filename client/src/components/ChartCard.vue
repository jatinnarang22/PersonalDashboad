<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="panel p-5">
    <div class="mb-4 border-b border-white/10 pb-3">
      <h3 class="font-display text-base font-semibold tracking-tight text-slate-100">{{ title }}</h3>
      <p v-if="subtitle" class="text-xs text-slate-500">{{ subtitle }}</p>
    </div>
    <div class="min-h-[240px]">
      <slot />
    </div>
  </div>
</template>
