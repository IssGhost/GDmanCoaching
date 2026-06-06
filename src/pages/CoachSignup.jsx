import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaClipboardCheck,
  FaEnvelope,
  FaSpinner,
  FaUserTie,
} from "react-icons/fa";
import { api } from "../lib/api";
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
  const { push } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

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

    if (!requiredComplete) {
      push("Please complete the required fields before submitting.", "error");
      return;
    }

    setBusy(true);

    try {
      const payload = buildPayload();
      const result = await submitToFirstWorkingEndpoint(payload);

      setSubmittedEmail(payload.email);
      setSubmitted(true);

      window.scrollTo({ top: 0, behavior: "smooth" });

      push("Coach application submitted successfully.", "success");

      console.log("Coach application submitted through:", result.endpoint);
    } catch (err) {
      push(err.message || "Coach application could not be submitted.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="pp-page px-6 pt-32 pb-16">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-[#12372a]/10 bg-white/90 p-8 text-center shadow-2xl shadow-[#12372a]/10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#c6ff4a] text-4xl text-[#12372a] shadow-lg">
            <FaCheckCircle />
          </div>

          <p className="pp-kicker mt-6">Application submitted</p>

          <h1 className="mt-3 text-4xl font-black text-[#12372a] md:text-6xl">
            Your coach application has been submitted.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#40584f]">
            Thank you for applying to GOOD Coaching. Please allow 1-3 business days for us to review and respond to your application.
          </p>

          {submittedEmail && (
            <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-[#eaf9f7] p-4 text-sm font-bold text-[#40584f]">
              We received the application for:
              <br />
              <span className="text-[#087f73]">{submittedEmail}</span>
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

        <form onSubmit={submit} className="pp-card-solid rounded-[2rem] p-7">
          <h2 className="text-2xl font-black text-[#12372a]">Coach application</h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
            Required fields are marked with an asterisk. The information entered here helps admins decide whether to approve your public coach profile.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Full name *"
              value={form.fullName}
              onChange={(value) => update("fullName", value)}
              placeholder="Blake Goodman"
              required
            />

            <Field
              label="Email *"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
              placeholder="coach@example.com"
              required
            />

            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => update("phone", value)}
              placeholder="Optional"
            />

            <Field
              label="Organization / club"
              value={form.organization}
              onChange={(value) => update("organization", value)}
              placeholder="Optional"
            />

            <Field
              label="City *"
              value={form.city}
              onChange={(value) => update("city", value)}
              placeholder="Round Rock"
              required
            />

            <Field
              label="State *"
              value={form.state}
              onChange={(value) => update("state", value)}
              placeholder="TX"
              required
            />

            <Field
              label="DUPR ID"
              value={form.duprId}
              onChange={(value) => update("duprId", value)}
              placeholder="Optional"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="DUPR singles"
                type="number"
                value={form.duprSingles}
                onChange={(value) => update("duprSingles", value)}
                placeholder="0.00"
              />

              <Field
                label="DUPR doubles"
                type="number"
                value={form.duprDoubles}
                onChange={(value) => update("duprDoubles", value)}
                placeholder="0.00"
              />
            </div>

            <Field
              label="Years playing"
              type="number"
              value={form.playingExperienceYears}
              onChange={(value) => update("playingExperienceYears", value)}
              placeholder="Example: 5"
            />

            <Field
              label="Years coaching"
              type="number"
              value={form.coachingExperienceYears}
              onChange={(value) => update("coachingExperienceYears", value)}
              placeholder="Example: 2"
            />

            <Field
              label="Profile headline *"
              value={form.headline}
              onChange={(value) => update("headline", value)}
              placeholder="Video reviews, doubles strategy, and tournament prep"
              required
              className="md:col-span-2"
            />

            <Field
              label="Specialties"
              value={form.specialties}
              onChange={(value) => update("specialties", value)}
              placeholder="Doubles strategy, footwork, third-shot drops, video review"
              helper="Separate each specialty with a comma."
              className="md:col-span-2"
            />

            <Field
              label="Skill levels"
              value={form.skillLevels}
              onChange={(value) => update("skillLevels", value)}
              placeholder="Beginner, Intermediate, Advanced, Tournament Prep"
              helper="Separate each skill level with a comma."
              className="md:col-span-2"
            />

            <TextArea
              label="Coach bio *"
              value={form.bio}
              onChange={(value) => update("bio", value)}
              placeholder="Tell players about your coaching style, experience, and what they can expect from your feedback."
              required
              rows={6}
              className="md:col-span-2"
            />

            <TextArea
              label="Why do you want to join GOOD Coaching?"
              value={form.whyJoin}
              onChange={(value) => update("whyJoin", value)}
              placeholder="Share why this platform is a good fit for your coaching services."
              rows={4}
              className="md:col-span-2"
            />

            <Field
              label="Instagram"
              value={form.socialInstagram}
              onChange={(value) => update("socialInstagram", value)}
              placeholder="https://instagram.com/..."
            />

            <Field
              label="YouTube"
              value={form.socialYoutube}
              onChange={(value) => update("socialYoutube", value)}
              placeholder="https://youtube.com/..."
            />

            <Field
              label="Website"
              value={form.socialWebsite}
              onChange={(value) => update("socialWebsite", value)}
              placeholder="https://..."
              className="md:col-span-2"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !requiredComplete}
            className="pp-btn-primary mt-7 w-full px-6 py-4 disabled:opacity-60"
          >
            {busy ? (
              <>
                <FaSpinner className="mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              "Submit Coach Application"
            )}
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

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  helper = "",
  required = false,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-black text-[#12372a]">{label}</span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pp-input px-4 py-3"
        placeholder={placeholder}
        required={required}
      />

      {helper && <span className="mt-1 block text-xs font-semibold text-[#5f746c]">{helper}</span>}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  helper = "",
  required = false,
  rows = 4,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-black text-[#12372a]">{label}</span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pp-input px-4 py-3"
        placeholder={placeholder}
        required={required}
        rows={rows}
      />

      {helper && <span className="mt-1 block text-xs font-semibold text-[#5f746c]">{helper}</span>}
    </label>
  );
}