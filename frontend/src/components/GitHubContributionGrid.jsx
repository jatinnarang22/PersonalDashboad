export default function GitHubContributionGrid({ weeks = [] }) {
  if (!weeks?.length) return <p className="text-sm text-slate-500">No contribution grid data.</p>;
  return (
    <div className="github-contrib-scroll flex gap-[3px] overflow-x-auto pb-2 pt-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {(week.contributionDays || []).map((day) => (
            <div
              key={day.date}
              className="h-2.5 w-2.5 shrink-0 rounded-sm sm:h-3 sm:w-3"
              title={`${day.date}: ${day.contributionCount} contributions`}
              style={{ backgroundColor: day.color || 'rgba(110,118,129,0.35)' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
