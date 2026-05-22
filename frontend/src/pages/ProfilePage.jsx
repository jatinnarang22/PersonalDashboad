import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo.jsx';
import { profileApi } from '../services/api.js';
import { emptyProfile } from '../constants/profileDefaults.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    profileApi.get().then(({ data }) => {
      if (data?.profile) {
        const base = emptyProfile();
        for (const k of Object.keys(base)) base[k] = data.profile[k] != null ? String(data.profile[k]) : '';
        setProfile(base);
      }
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    await profileApi.update({ displayName: profile.displayName, email: profile.email, bio: profile.bio });
    navigate('/');
  }

  if (loading) return <p className="p-10 text-center text-slate-500">Loading…</p>;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <BrandLogo variant="hero" />
      <h1 className="mt-8 text-2xl font-bold text-slate-100">Profile</h1>
      {error && <p className="mt-4 text-red-300">{error}</p>}
      <form className="mt-8 space-y-4" onSubmit={save}>
        <input className="field-control" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} placeholder="Display name" />
        <input className="field-control" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Email" />
        <textarea className="field-control" rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
        <button type="submit" className="btn-primary">Save</button>
        <Link to="/" className="ml-4 text-sm text-slate-400">Back</Link>
      </form>
    </div>
  );
}
