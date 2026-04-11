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
    class="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h4 class="font-semibold text-slate-900">{{ project.name }}</h4>
      <p class="mt-1 text-sm text-slate-600">{{ project.description || '—' }}</p>
      <p class="mt-2 text-xs text-slate-500">
        {{ project.hoursSpent }} hrs logged
      </p>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <label class="sr-only" :for="`status-${project._id}`">Status</label>
      <select
        :id="`status-${project._id}`"
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-sky-500/30 focus:ring-2"
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
