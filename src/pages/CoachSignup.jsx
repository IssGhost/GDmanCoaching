import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  duprId: "",
  duprSingles: "",
  duprDoubles: "",
  playingExperienceYears: "",
  coachingExperienceYears: "",
  organization: "",
  headline: "",
  bio: "",
  specialties: "",
  skillLevels: "",
  socialInstagram: "",
  socialYoutube: "",
  socialWebsite: "",
  whyJoin: "",
};

const APPLICATION_ENDPOINTS = [
  "/coach-applications",
  "/coach-applications/apply",
  "/coaches/apply",
  "/coach-signup",
  "/coaches/signup",
];

function cleanNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function submitToFirstWorkingEndpoint(payload) {
  const errors = [];

  for (const endpoint of APPLICATION_ENDPOINTS) {
    try {
      const result = await api.post(endpoint, payload);
      return { endpoint, result };
    } catch (err) {
      errors.push(`${endpoint}: ${err.message || "failed"}`);
    }
  }

  throw new Error(errors.join(" | "));
}

export default function CoachSignup() {
  const { user, token, reloadUser, apiPost } = useAuth();
  const nav = useNavigate();
  const { push } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    city: "",
    state: "",
    country: "United States",
    organization: "",
    headline: "Online Pickleball Coach",
    specialties: "Video analysis, Match review, Strategy consultation",
    skillLevels: "Beginner (2.5–3.0), Intermediate (3.0–4.0), Advanced (4.0–5.0), Elite (5.0+)",
    playingExperienceYears: 3,
    coachingExperienceYears: 1,
    duprId: "",
    duprSingles: "",
    duprDoubles: "",
    instagram: "",
    youtube: "",
    website: "",
    bio: "",
    turnaroundHours: 72,
  });

  const requiredComplete = useMemo(() => {
    return Boolean(
      form.fullName.trim() &&
        form.email.trim() &&
        form.city.trim() &&
        form.state.trim() &&
        form.headline.trim() &&
        form.bio.trim()
    );
  }, [form]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const buildPayload = () => {
    const specialties = form.specialties
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const skillLevels = form.skillLevels
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return {
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      displayName: form.fullName.trim(),
      email: form.email.trim(),
      contactEmail: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: "US",
      duprId: form.duprId.trim(),
      duprSingles: cleanNumber(form.duprSingles),
      duprDoubles: cleanNumber(form.duprDoubles),
      playingExperienceYears: cleanNumber(form.playingExperienceYears),
      coachingExperienceYears: cleanNumber(form.coachingExperienceYears),
      organization: form.organization.trim(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      specialties,
      skillLevels,
      whyJoin: form.whyJoin.trim(),
      socialLinks: {
        instagram: form.socialInstagram.trim(),
        youtube: form.socialYoutube.trim(),
        website: form.socialWebsite.trim(),
        facebook: "",
        tiktok: "",
      },
      approved: false,
      acceptingInquiries: false,
      source: "public_coach_signup_page",
    };
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      push("Please sign in before submitting your coach application.", "error");
      nav("/signin", { state: { from: { pathname: "/coach-signup" } } });
      return;
    }

    setBusy(true);

    try {
      await apiPost("/coaches/apply", form);
      await reloadUser?.();
      push("Coach profile submitted. Admin approval controls public listing.", "success");
      nav("/coach/dashboard");
    } catch (err) {
      push(err.message || "Coach application could not be submitted.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="h-fit rounded-3xl border border-white/10 bg-zinc-950 p-8">
          <p className="font-bold uppercase tracking-[0.2em] text-emerald-300">Coach application</p>
          <h1 className="mt-3 text-4xl font-black">Apply to coach online through GOOD Coaching.</h1>
          <p className="mt-4 leading-7 text-gray-300">
            Create a public profile for remote video analysis, match reviews, strategy consultations, and personalized training plans. Coaches receive 90% of each completed sale; GOOD Coaching withholds a 10% operating fee. Coaches enter plan prices and can send a custom quote after discussing the requested scope.
          </p>
          <div className="mt-6 space-y-3 text-sm text-gray-300">
            {["Bio, DUPR ID, and social links", "Skill categories based on DUPR ratings", "Online-only coaching services", "15-minute video upload limit", "1–3 business day response expectation"].map((item) => (
              <div key={item} className="flex gap-2"><FaCheckCircle className="mt-0.5 text-emerald-300" /> {item}</div>
            ))}
          </div>
          {!user && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              You need an account before applying. <Link to="/signup" className="font-bold underline">Create one here</Link>. Players provide a name, email, and password. Coaches provide those account details plus the application information on this form.
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="pp-btn-primary px-6 py-3">
              Back to Home
            </Link>

            <Link to="/coaches" className="pp-btn-secondary px-6 py-3">
              Browse Coaches
            </Link>

            <Link to="/contact" className="pp-btn-secondary px-6 py-3">
              Contact GOOD Coaching
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-5xl text-center">
        <div className="pp-pill mx-auto inline-flex rounded-full px-4 py-2 text-sm font-black">
          Become a GOOD Coaching coach
        </div>

        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black text-[#12372a] md:text-6xl">
          Apply to offer online pickleball coaching.
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#40584f]">
          Complete the application below so GOOD Coaching can review your coaching background, player experience, specialties, and online coaching fit.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-[#12372a] p-7 text-white shadow-xl">
            <FaUserTie className="text-4xl text-[#c6ff4a]" />

            <h2 className="mt-4 text-2xl font-black text-white">Application review timeline</h2>

            <p className="mt-3 leading-7 text-white/85">
              Please allow 1-3 business days for us to review and respond to applications.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#12372a]/10 bg-[#fff1c7] p-6">
            <FaClipboardCheck className="text-3xl text-[#b94024]" />

            <h2 className="mt-3 text-xl font-black text-[#12372a]">Before submitting</h2>

            <ul className="mt-4 space-y-3 text-sm font-bold leading-6 text-[#40584f]">
              <li>Include your DUPR ID if available.</li>
              <li>List your main coaching specialties.</li>
              <li>Explain what level of players you want to help.</li>
              <li>Add social or website links if you want them reviewed.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/90 p-6">
            <FaEnvelope className="text-3xl text-[#00a896]" />

            <h2 className="mt-3 text-xl font-black text-[#12372a]">Need help?</h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
              Questions about applying? Contact GOOD Coaching and include the email address you plan to use for your coach account.
            </p>

            <Link to="/contact" className="pp-btn-secondary mt-5 w-full px-5 py-3">
              Contact GOOD Coaching
            </Link>
          </div>
        </aside>

        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-zinc-950 p-6 md:p-8">
          <div className="mb-6 rounded-2xl border border-[#087f73]/30 bg-[#d9f7fb] p-4 text-sm font-black text-[#12372a]">
            Please allow 1–3 business days for coaches to review and respond to inquiries.
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
            <Field label="Years of Playing Experience" type="number" min="0" value={form.playingExperienceYears} required onChange={(v) => update("playingExperienceYears", v)} />
            <Field label="Years of Coaching Experience" type="number" min="0" value={form.coachingExperienceYears} required onChange={(v) => update("coachingExperienceYears", v)} />
            <Field label="Current Coaching Organization or Club Affiliation" value={form.organization} onChange={(v) => update("organization", v)} className="md:col-span-2" />
          </div>

          <Section title="Coaching information" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Headline" value={form.headline} onChange={(v) => update("headline", v)} />
            <Field label="DUPR ID" value={form.duprId} onChange={(v) => update("duprId", v)} placeholder="Example: 7DVMM4" />
            <Field label="DUPR Singles Rating" type="number" step="0.001" value={form.duprSingles} onChange={(v) => update("duprSingles", v)} />
            <Field label="DUPR Doubles Rating" type="number" step="0.001" value={form.duprDoubles} onChange={(v) => update("duprDoubles", v)} />
            <p className="text-xs leading-5 text-gray-400 md:col-span-2">Enter the current ratings shown on your DUPR profile. The DUPR ID creates a verification link but does not automatically sync ratings.</p>
            <Field label="Areas of Specialization" value={form.specialties} required onChange={(v) => update("specialties", v)} className="md:col-span-2" />
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Coaching Skill Levels</span>
              <select multiple value={form.skillLevels.split(", ").filter(Boolean)} onChange={(e) => update("skillLevels", Array.from(e.target.selectedOptions).map((o) => o.value).join(", "))} className="mt-1 min-h-36 w-full rounded-xl border border-white/10 bg-black p-3">
                {["Beginner (2.5–3.0)", "Intermediate (3.0–4.0)", "Advanced (4.0–5.0)", "Elite (5.0+)"].map((level) => <option key={level}>{level}</option>)}
              </select>
              <span className="mt-1 block text-xs text-gray-500">Hold Ctrl/Cmd to select multiple categories.</span>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-gray-400">Coach Bio</span>
              <textarea maxLength={5000} rows={8} value={form.bio} onChange={(e) => update("bio", e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black p-3" placeholder="Describe your coaching style, experience, online review process, and expectations for players." />
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

          {!requiredComplete && (
            <p className="mt-3 text-center text-sm font-bold text-[#b94024]">
              Complete the required fields before submitting.
            </p>
          )}
        </form>
      </section>
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
