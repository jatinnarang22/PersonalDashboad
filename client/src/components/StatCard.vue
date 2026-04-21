<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
});
</script>

<template>
  <div class="panel group p-5 transition duration-300">
    <div
      class="mb-3 h-px w-12 bg-gradient-to-r from-brand-gold/90 to-transparent transition group-hover:w-16"
    />
    <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {{ label }}
    </p>
    <p class="font-display mt-2 text-2xl font-semibold tracking-tight text-white">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1.5 text-xs leading-snug text-slate-500">{{ hint }}</p>
  </div>
</template>
