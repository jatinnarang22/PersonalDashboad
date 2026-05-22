export default function ChartCard({ title, subtitle = '', children }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 border-b border-white/10 pb-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-slate-100">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="min-h-[240px]">{children}</div>
    </div>
  );
}
