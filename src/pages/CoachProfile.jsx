import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaClock, FaExternalLinkAlt, FaFacebook, FaGlobe, FaInstagram, FaStar, FaTiktok, FaUpload, FaYoutube } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function CoachProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, token } = useAuth();
  const { push } = useToast();
  const [coach, setCoach] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [form, setForm] = useState({ title: "", goals: "", skillLevel: "", description: "", durationMinutes: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/coaches/${id}`)
      .then((row) => {
        setCoach(row);
        setSelectedPackageId(row.packages?.[0]?._id || "");
      })
      .catch(() => setCoach(null))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedPackage = useMemo(
    () => coach?.packages?.find((pkg) => pkg._id === selectedPackageId),
    [coach, selectedPackageId]
  );

  const checkout = async () => {
    if (!user) {
      nav("/signin", { state: { from: { pathname: `/coaches/${id}` } } });
      return;
    }
    if (!selectedPackage) return push("Select a package first.", "error");
    setBusy(true);
    try {
      const result = await api.post(
        "/payments/checkout/session",
        {
          coachId: coach._id,
          packageId: selectedPackage._id,
          ...form,
        },
        token
      );
      push("Booking created. Continue to your video submission.", "success");
      if (result.checkoutUrl?.startsWith("http")) {
        window.location.href = result.checkoutUrl;
      } else {
        nav(`/dashboard/submissions/${result.submission._id}`);
      }
    } catch (e) {
      push(e.message || "Checkout failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black px-6 pt-32 text-gray-400">Loading coach...</div>;
  if (!coach) {
    return (
      <div className="min-h-screen bg-black px-6 pt-32 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center">
          <h1 className="text-2xl font-bold">Coach not found</h1>
          <Link to="/coaches" className="mt-4 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-bold text-black">Back to coaches</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <div className="flex items-center gap-4">
              {coach.avatarUrl ? (
                <img src={coach.avatarUrl} alt={coach.displayName} className="h-20 w-20 rounded-3xl object-cover" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400 text-3xl font-black text-black">
                  {(coach.displayName || "C").slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black">{coach.displayName}</h1>
                <p className="text-gray-400">{coach.headline}</p>
                <div className="mt-2 flex items-center gap-2 text-amber-300"><FaStar /> {coach.rating || 5} rating • {coach.reviewCount || 0} reviews</div>
              </div>
            </div>
            <p className="mt-6 leading-7 text-gray-300">{coach.bio || "This coach is ready to review gameplay footage and create a focused online training plan."}</p>
            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-gray-300 sm:grid-cols-2">
              <div><span className="font-black text-emerald-300">DUPR ID:</span> {coach.duprId ? <a className="underline" href={coach.duprProfileUrl || `https://dashboard.dupr.com/dashboard/player/${coach.duprId}`} target="_blank" rel="noreferrer">{coach.duprId} <FaExternalLinkAlt className="inline" /></a> : "Not provided"}</div>
              <div><span className="font-black text-emerald-300">Singles:</span> {coach.duprSingles || "Pending"}</div>
              <div><span className="font-black text-emerald-300">Doubles:</span> {coach.duprDoubles || "Pending"}</div>
              <div><span className="font-black text-emerald-300">Location:</span> {[coach.city, coach.state, coach.country].filter(Boolean).join(", ") || "Online"}</div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {(coach.specialties || []).map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-300">{tag}</span>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Social href={coach.socialLinks?.instagram} icon={<FaInstagram />} label="Instagram" />
              <Social href={coach.socialLinks?.youtube} icon={<FaYoutube />} label="YouTube" />
              <Social href={coach.socialLinks?.facebook} icon={<FaFacebook />} label="Facebook" />
              <Social href={coach.socialLinks?.tiktok} icon={<FaTiktok />} label="TikTok" />
              <Social href={coach.socialLinks?.website} icon={<FaGlobe />} label="Website" />
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-2xl font-black">Choose an online coaching option</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(coach.packages || []).map((pkg) => (
                <button
                  key={pkg._id}
                  onClick={() => setSelectedPackageId(pkg._id)}
                  className={`rounded-2xl border p-5 text-left transition ${selectedPackageId === pkg._id ? "border-emerald-400 bg-emerald-400/10" : "border-white/10 bg-black/40 hover:bg-white/[0.05]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{pkg.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{pkg.description}</p>
                    </div>
                    <div className="text-sm font-black text-emerald-300">Coach sets pricing</div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400"><FaClock /> {pkg.turnaroundHours || coach.turnaroundHours || 72} hour target response • {Math.min(pkg.maxVideoMinutes || 15, 15)} min max video</div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-2xl font-black">Tell the coach what to review</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-gray-400">Submission title</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Doubles match from Saturday" />
              </label>
              <label className="block">
                <span className="text-sm text-gray-400">Skill level</span>
                <select value={form.skillLevel} onChange={(e) => setForm((f) => ({ ...f, skillLevel: e.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3">
                  <option value="">Select level</option>
                  <option>Beginner (2.5–3.0)</option>
                  <option>Intermediate (3.0–4.0)</option>
                  <option>Advanced (4.0–5.0)</option>
                  <option>Elite (5.0+)</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-400">Main goals</span>
                <textarea value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Example: help me fix my third shot drop and stop getting caught at the baseline." />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-400">Extra Notes</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={6} maxLength={5000} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Opponent level, what happened in the game, tournament goals, injury limitations, coaching style preferences, expectations, etc." />
              </label>
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-100">
              Please allow 1–3 business days for coaches to review and respond to inquiries. Uploaded videos are limited to 15 minutes. Coaches determine and communicate their own pricing directly.
            </div>
            <button onClick={checkout} disabled={busy || !selectedPackage} className="mt-6 w-full rounded-xl bg-emerald-400 px-6 py-4 font-black text-black hover:bg-emerald-300 disabled:opacity-60">
              {busy ? "Creating request..." : selectedPackage ? `Request ${selectedPackage.title}` : "Select an option"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}


function Social({ href, icon, label }) {
  if (!href) return null;
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-bold text-gray-200 hover:bg-emerald-400 hover:text-black">
      {icon} {label}
    </a>
  );
}
