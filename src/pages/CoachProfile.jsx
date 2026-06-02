import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaClock, FaCreditCard, FaShareAlt, FaStar, FaUpload } from "react-icons/fa";
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
  const [form, setForm] = useState({ title: "", goals: "", skillLevel: "", description: "" });
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
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400 text-3xl font-black text-black">
                {(coach.displayName || "C").slice(0, 1)}
              </div>
              <div>
                <h1 className="text-3xl font-black">{coach.displayName}</h1>
                <p className="text-gray-400">{coach.headline}</p>
                <div className="mt-2 flex items-center gap-2 text-amber-300"><FaStar /> {coach.rating || 5} rating • {coach.reviewCount || 0} reviews</div>
              </div>
            </div>
            <p className="mt-6 leading-7 text-gray-300">{coach.bio || "This coach is ready to review gameplay footage and create a focused training plan."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {(coach.specialties || []).map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-sm text-gray-300">{tag}</span>)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold">Platform workflow</h2>
            <div className="mt-4 space-y-4 text-sm text-gray-300">
              <div className="flex gap-3"><FaCreditCard className="mt-1 text-emerald-300" /> Pay through Stripe Connect or local demo checkout.</div>
              <div className="flex gap-3"><FaUpload className="mt-1 text-emerald-300" /> Upload match footage after payment.</div>
              <div className="flex gap-3"><FaShareAlt className="mt-1 text-emerald-300" /> Split-payment records are created for multi-coach/facility payouts.</div>
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <h2 className="text-2xl font-black">Choose a coaching package</h2>
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
                    <div className="text-2xl font-black text-emerald-300">${Number(pkg.price || 0).toFixed(0)}</div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400"><FaClock /> {pkg.turnaroundHours || coach.turnaroundHours || 48} hour turnaround • {pkg.maxVideoMinutes || 10} min max video</div>
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
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Tournament</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-400">Main goals</span>
                <textarea value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Example: help me fix my third shot drop and stop getting caught at the baseline." />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm text-gray-400">Extra context</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Opponent level, what happened in the game, tournament goals, injury limitations, etc." />
              </label>
            </div>
            <button onClick={checkout} disabled={busy || !selectedPackage} className="mt-6 w-full rounded-xl bg-emerald-400 px-6 py-4 font-black text-black hover:bg-emerald-300 disabled:opacity-60">
              {busy ? "Creating checkout..." : selectedPackage ? `Book ${selectedPackage.title} for $${Number(selectedPackage.price).toFixed(0)}` : "Select a package"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
