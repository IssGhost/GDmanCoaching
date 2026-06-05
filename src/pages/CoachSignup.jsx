import { useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";

const initial = {
  displayName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "United States",
  playingExperienceYears: "",
  coachingExperienceYears: "",
  organization: "",
  headline: "",
  duprId: "",
  duprSingles: "",
  duprDoubles: "",
  specialties: "",
  skillLevels: "",
  bio: "",
  instagram: "",
  youtube: "",
  website: "",
};

export default function CoachSignup() {
  const { user, token } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({
    ...initial,
    displayName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [busy, setBusy] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();

    if (!user) {
      push("Create or sign into an account before applying.", "error");
      return;
    }

    setBusy(true);

    try {
      await api.post("/coaches/apply", form, token);
      push("Coach application submitted. Please allow 1–3 business days for us to review and respond to your application.", "success");
    } catch (err) {
      push(err.message || "Could not submit application.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Coach application</p>

          <h1 className="mt-3 text-4xl font-black">Apply to coach online through GOOD Coaching.</h1>

          <p className="mt-4 leading-7 text-gray-300">
            Create a public profile for remote video analysis, match reviews, strategy consultations, and personalized training plans.
            Coaches receive 90% of each completed sale; GOOD Coaching withholds a 10% operating fee. Coaches enter plan prices and can send a custom quote after discussing the requested scope.
          </p>

          <div className="mt-5 rounded-2xl border border-[#087f73]/30 bg-[#d9f7fb] p-4 text-sm font-black text-[#12372a]">
            Please allow 1–3 business days for us to review and respond to applications.
          </div>

          <div className="mt-6 space-y-3 text-sm text-gray-300">
            {[
              "Bio, DUPR ID, and social links",
              "Skill categories based on DUPR ratings",
              "Online-only coaching services",
              "15-minute video upload limit",
              "Coach-controlled plan pricing and custom quotes",
            ].map((item) => (
              <div key={item} className="flex gap-2">
                <FaCheckCircle className="mt-0.5 shrink-0 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>

          {!user && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              You need an account before applying.{" "}
              <Link to="/signup" className="font-bold underline">
                Create one here
              </Link>
              . Players provide a name, email, and password. Coaches provide those account details plus the application information on this form.
            </div>
          )}
        </aside>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
          <div className="mb-6 rounded-2xl border border-[#087f73]/30 bg-[#d9f7fb] p-4 text-sm font-black text-[#12372a]">
            Please allow 1–3 business days for us to review and respond to applications.
          </div>

          <Section title="Personal information" />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name" value={form.displayName} onChange={(v) => update("displayName", v)} required />
            <Field label="Email Address" type="email" value={form.email} onChange={(v) => update("email", v)} required />
            <Field label="Phone Number" value={form.phone} onChange={(v) => update("phone", v)} required />
            <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
            <Field label="State" value={form.state} onChange={(v) => update("state", v)} required />
            <Field label="Country" value={form.country} onChange={(v) => update("country", v)} required />
          </div>

          <Section title="Experience" />

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Years of Playing Experience"
              type="number"
              min="0"
              value={form.playingExperienceYears}
              required
              onChange={(v) => update("playingExperienceYears", v)}
            />

            <Field
              label="Years of Coaching Experience"
              type="number"
              min="0"
              value={form.coachingExperienceYears}
              required
              onChange={(v) => update("coachingExperienceYears", v)}
            />

            <Field
              label="Current Coaching Organization or Club Affiliation"
              value={form.organization}
              onChange={(v) => update("organization", v)}
              className="md:col-span-2"
            />
          </div>

          <Section title="Coaching information" />

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Headline" value={form.headline} onChange={(v) => update("headline", v)} />
            <Field label="DUPR ID" value={form.duprId} onChange={(v) => update("duprId", v)} placeholder="Example: 7DVMM4" />
            <Field label="DUPR Singles Rating" type="number" step="0.001" value={form.duprSingles} onChange={(v) => update("duprSingles", v)} />
            <Field label="DUPR Doubles Rating" type="number" step="0.001" value={form.duprDoubles} onChange={(v) => update("duprDoubles", v)} />

            <p className="text-xs leading-5 text-gray-400 md:col-span-2">
              Enter the current ratings shown on your DUPR profile. The DUPR ID creates a verification link but does not automatically sync ratings.
            </p>

            <Field
              label="Areas of Specialization"
              value={form.specialties}
              required
              onChange={(v) => update("specialties", v)}
              className="md:col-span-2"
              placeholder="Example: doubles strategy, singles strategy, drill plans, junior programs"
            />

            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Coaching Skill Levels</span>

              <select
                multiple
                value={form.skillLevels.split(", ").filter(Boolean)}
                onChange={(e) => update("skillLevels", Array.from(e.target.selectedOptions).map((o) => o.value).join(", "))}
                className="mt-1 min-h-36 w-full rounded-xl border border-white/10 bg-black p-3"
              >
                {["Beginner (2.5–3.0)", "Intermediate (3.0–4.0)", "Advanced (4.0–5.0)", "Elite (5.0+)"].map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>

              <span className="mt-1 block text-xs text-gray-500">Hold Ctrl/Cmd to select multiple categories.</span>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Coach Bio</span>

              <textarea
                maxLength={5000}
                rows={8}
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3"
                placeholder="Describe your coaching style, experience, online review process, and expectations for players."
              />

              <span className="mt-1 block text-xs text-gray-500">Up to 5,000 characters.</span>
            </label>
          </div>

          <Section title="Social media (optional)" />

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Instagram" value={form.instagram} onChange={(v) => update("instagram", v)} placeholder="https://instagram.com/..." />
            <Field label="YouTube" value={form.youtube} onChange={(v) => update("youtube", v)} placeholder="https://youtube.com/..." />
            <Field label="Personal Website" value={form.website} onChange={(v) => update("website", v)} placeholder="https://..." />
          </div>

          <button disabled={busy || !user} className="mt-8 w-full rounded-xl bg-emerald-400 px-6 py-4 font-black text-black hover:bg-emerald-300 disabled:opacity-60">
            {busy ? "Submitting application..." : user ? "Submit Coach Application" : "Sign in required"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title }) {
  return <h2 className="mb-3 mt-7 text-xl font-black text-emerald-300 first:mt-0">{title}</h2>;
}

function Field({ label, value, onChange, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-gray-400">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" {...props} />
    </label>
  );
}