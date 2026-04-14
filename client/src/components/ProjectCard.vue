<script setup>
const props = defineProps({
  project: { type: Object, required: true },
});

const emit = defineEmits(['update-status']);

const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

function onStatusChange(e) {
  emit('update-status', props.project._id, e.target.value);
}
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-xl border border-white/10 bg-brand-elevated/80 p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h4 class="font-semibold text-slate-100">{{ project.name }}</h4>
      <p class="mt-1 text-sm text-slate-400">{{ project.description || '—' }}</p>
      <p class="mt-2 text-xs text-slate-500">
        {{ project.hoursSpent }} hrs logged
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <label class="sr-only" :for="`status-${project._id}`">Status</label>
      <select
        :id="`status-${project._id}`"
        class="field-control mt-0 max-w-[10rem] border-white/15 bg-brand-panel py-2 text-sm font-medium text-slate-200"
        :value="project.status"
        @change="onStatusChange"
      >
        <option v-for="s in statuses" :key="s.value" :value="s.value">
          {{ s.label }}
        </option>
      </select>
    </div>
  </div>
</template>
