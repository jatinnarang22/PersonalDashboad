const statuses = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function ProjectCard({ project, onUpdateStatus }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-brand-elevated/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h4 className="font-semibold text-slate-100">{project.name}</h4>
        <p className="mt-1 text-sm text-slate-400">{project.description || '—'}</p>
        <p className="mt-2 text-xs text-slate-500">{project.hoursSpent} hrs logged</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor={`status-${project._id}`}>
          Status
        </label>
        <select
          id={`status-${project._id}`}
          className="field-control mt-0 max-w-[10rem] border-white/15 bg-brand-panel py-2 text-sm font-medium text-slate-200"
          value={project.status}
          onChange={(e) => onUpdateStatus(project._id, e.target.value)}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
