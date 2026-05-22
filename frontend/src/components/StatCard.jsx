export default function StatCard({ label, value, hint = '' }) {
  return (
    <div className="stat-card group rounded-xl border border-white/[0.06] bg-white/[0.025] p-5 shadow-sm ring-1 ring-white/[0.04] transition duration-300 hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.04] hover:shadow-md">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="stat-card-value font-display mt-2 text-2xl font-semibold tracking-tight text-slate-100">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}
