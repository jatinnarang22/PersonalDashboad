<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>

<template>
  <div class="panel p-5">
    <div class="mb-4">
      <h3 class="text-base font-semibold text-slate-100">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <div class="min-h-[240px]">
      <slot />
    </div>
  </div>
</template>
