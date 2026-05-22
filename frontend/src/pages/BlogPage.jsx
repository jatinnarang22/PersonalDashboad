import { useMemo, useState } from 'react';
const posts = [
  { id: '1', title: 'Focus Blocks', excerpt: 'Deep work routine.', date: '2026-04-20', readTime: '4 min', tag: 'Productivity' },
  { id: '2', title: 'Weekly Review', excerpt: 'Sunday checklist.', date: '2026-04-18', readTime: '6 min', tag: 'System' },
];
export default function BlogPage() {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('All');
  const tags = useMemo(() => ['All', ...new Set(posts.map((p) => p.tag))], []);
  const filtered = useMemo(() => posts.filter((p) => (tag === 'All' || p.tag === tag) && (!query || p.title.toLowerCase().includes(query.toLowerCase()))), [query, tag]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="dash-title">Blog</h1>
      <input className="field-control mt-4" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" />
      <div className="mt-4 flex gap-2">{tags.map((t) => <button key={t} type="button" className="btn-secondary text-xs" onClick={() => setTag(t)}>{t}</button>)}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map((p) => <article key={p.id} className="panel p-5"><h2 className="text-lg font-semibold text-slate-100">{p.title}</h2><p className="mt-2 text-sm text-slate-300">{p.excerpt}</p></article>)}</div>
    </div>
  );
}
