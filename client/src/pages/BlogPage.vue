<script setup>
import { computed, ref } from 'vue';

const query = ref('');
const selectedTag = ref('All');

const posts = ref([
  {
    id: '1',
    title: 'How I Keep My Focus Blocks Effective',
    excerpt:
      'A practical routine for deep work using coding windows, breaks, and distraction caps from the dashboard.',
    date: '2026-04-20',
    readTime: '4 min',
    tag: 'Productivity',
  },
  {
    id: '2',
    title: 'Weekly Dashboard Review Template',
    excerpt:
      'Use this checklist every Sunday to track progress in coding, health, and social usage trends.',
    date: '2026-04-18',
    readTime: '6 min',
    tag: 'System',
  },
  {
    id: '3',
    title: 'Turning Daily Logs Into Better Decisions',
    excerpt:
      'How trend charts and snapshots reveal behavior patterns and where to adjust your daily targets.',
    date: '2026-04-15',
    readTime: '5 min',
    tag: 'Insights',
  },
]);

const tags = computed(() => ['All', ...new Set(posts.value.map((p) => p.tag))]);

const filteredPosts = computed(() => {
  const q = query.value.trim().toLowerCase();
  return posts.value.filter((p) => {
    const tagOk = selectedTag.value === 'All' || p.tag === selectedTag.value;
    const qOk =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q);
    return tagOk && qOk;
  });
});
</script>

<template>
  <div class="dash-reveal mx-auto max-w-6xl px-4 py-10">
    <div class="dash-section-head">
      <div>
        <p class="dash-eyebrow">Content</p>
        <h1 class="dash-title">Blog</h1>
        <p class="dash-desc">Playbooks, weekly reviews, and practical guides from your dashboard data.</p>
      </div>
    </div>

    <div class="panel mb-6 p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          v-model="query"
          type="text"
          class="field-control mt-0 text-sm"
          placeholder="Search posts..."
        />
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="btn-secondary px-3 py-1.5 text-xs"
            :class="selectedTag === tag ? 'ring-1 ring-brand-gold/50' : ''"
            @click="selectedTag = tag"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="post in filteredPosts"
        :key="post.id"
        class="panel p-5 transition hover:-translate-y-1"
      >
        <div class="mb-3 flex items-center justify-between text-xs text-slate-500">
          <span>{{ post.date }}</span>
          <span>{{ post.readTime }}</span>
        </div>
        <h2 class="font-display text-lg font-semibold text-slate-100">{{ post.title }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-slate-300">{{ post.excerpt }}</p>
        <div class="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
          {{ post.tag }}
        </div>
      </article>
    </div>
  </div>
</template>
