import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function CoachSignup() {
  const { user, token, reloadUser } = useAuth();
  const nav = useNavigate();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.fullName || "",
    headline: "Pickleball Coach",
    city: "",
    state: "TX",
    specialties: "Doubles strategy, Third-shot drops, Kitchen resets",
    skillLevels: "Beginner, Intermediate",
    yearsExperience: 3,
    videoReviewRate: 45,
    liveSessionRate: 75,
    turnaroundHours: 48,
    bio: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      nav("/signin", { state: { from: { pathname: "/coach-signup" } } });
      return;
    }
    setBusy(true);
    try {
      await api.post("/coaches/apply", form, token);
      await reloadUser?.();
      push("Coach profile created. Admin approval controls public listing.", "success");
      nav("/coach/dashboard");
    } catch (err) {
      push(err.message || "Coach application failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-8 h-fit">
          <p className="font-bold uppercase tracking-[0.2em] text-emerald-300">Coach onboarding</p>
          <h1 className="mt-3 text-4xl font-black">Start getting paid for in-person pickleball training and video reviews.</h1>
          <p className="mt-4 leading-7 text-gray-300">
           This creates your coach profile, starter training packages, and unlocks the Stripe Connect onboarding flow inside the coach dashboard. Offer private lessons, clinics, video reviews, or hybrid coaching.
          </p>
          <div className="mt-6 space-y-3 text-sm text-gray-300">
            {["Create public coach profile", "Set in-person, clinic, and video-review rates", "Generate starter packages", "Connect payouts after profile creation", "Admin can approve and feature coaches"].map((item) => (
              <div key={item} className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-300" /> {item}</div>
            ))}
          </div>
          {!user && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              You need an account before applying. <Link to="/signup" className="font-bold underline">Create one here</Link>.
            </div>
          )}
        </aside>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm text-gray-400">Display name</span>
              <input required value={form.displayName} onChange={(e) => update("displayName", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Headline</span>
              <input value={form.headline} onChange={(e) => update("headline", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">City</span>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">State</span>
              <input value={form.state} onChange={(e) => update("state", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Specialties, comma-separated</span>
              <input value={form.specialties} onChange={(e) => update("specialties", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Skill levels, comma-separated</span>
              <input value={form.skillLevels} onChange={(e) => update("skillLevels", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Years experience</span>
              <input type="number" min="0" value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Turnaround hours</span>
              <input type="number" min="1" value={form.turnaroundHours} onChange={(e) => update("turnaroundHours", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Video review rate</span>
              <input type="number" min="1" value={form.videoReviewRate} onChange={(e) => update("videoReviewRate", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">In-person session rate</span>
              <input type="number" min="1" value={form.liveSessionRate} onChange={(e) => update("liveSessionRate", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Coach bio</span>
              <textarea rows={5} value={form.bio} onChange={(e) => update("bio", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Describe your coaching style, background, and who you help most." />
            </label>
          </div>
          <button disabled={busy || !user} className="mt-6 w-full rounded-xl bg-emerald-400 px-6 py-4 font-black text-black hover:bg-emerald-300 disabled:opacity-60">
            {busy ? "Creating coach profile..." : user ? "Create Coach Profile" : "Sign in required"}
          </button>
        </form>
      </div>
    </div>
  );
}
