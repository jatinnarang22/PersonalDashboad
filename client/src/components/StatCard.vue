<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
});
</script>

<template>
  <div
    class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5"
  >
    <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
      {{ label }}
    </p>
    <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-sm text-slate-500">{{ hint }}</p>
  </div>
</template>
