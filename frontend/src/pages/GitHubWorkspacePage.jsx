import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { integrationsApi } from "../services/api.js";
import GitHubContributionGrid from "../components/GitHubContributionGrid.jsx";

export default function GitHubWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    integrationsApi.githubActivity().then(({ data }) => {
      if (!data.connected) { setError("Connect GitHub first."); return; }
      setSummary(data.summary); setCalendar(data.contributionCalendar); setEvents(data.recentEvents || []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/integrations" className="text-xs text-slate-500">← Integrations</Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-100">GitHub</h1>
      {loading && <p className="py-10 text-slate-400">Loading…</p>}
      {error && <p className="text-red-300">{error}</p>}
      {summary && (
        <>
          <section className="panel mt-6 p-5"><p className="text-lg font-semibold">{summary.username}</p>
          <p className="mt-2 text-teal-100">{summary.commitsLast7Days} commits (7d)</p></section>
          <section className="panel mt-6 p-5"><GitHubContributionGrid weeks={calendar?.weeks || []} /></section>
        </>
      )}
    </div>
  );
}
