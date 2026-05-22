import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { integrationsApi, integrationOAuthStartUrl } from "../services/api.js";
const VALID = new Set(["youtube","instagram","wakatime"]);
export default function IntegrationWorkspacePage() {
  const { platform } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (platform === "github") { navigate("/integrations/github", { replace: true }); return; }
    if (!VALID.has(platform)) { navigate("/integrations"); return; }
    integrationsApi.status().then(({ data }) => setStatus(data));
  }, [platform, navigate]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/integrations">← Back</Link>
      <h1 className="mt-3 text-2xl capitalize text-slate-100">{platform}</h1>
      <p className="mt-4 text-sm text-slate-400">{status?.[platform]?.connected ? "Connected" : "Not connected"}</p>
      {!status?.[platform]?.connected && platform !== "wakatime" && (
        <button type="button" className="btn-primary mt-4 text-xs" onClick={() => { window.location.href = integrationOAuthStartUrl(platform); }}>Connect</button>
      )}
    </div>
  );
}
