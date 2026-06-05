import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaClipboardList,
  FaComments,
  FaDollarSign,
  FaPlus,
  FaUserEdit,
} from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { imageFileToDataUrl } from "../lib/uploads";
import { normalizePhase } from "../lib/workflow";

const initialPackage = {
  title: "",
  description: "",
  price: "",
  reviewType: "single_video",
  turnaroundHours: 72,
  maxVideoMinutes: 15,
  discountPercent: 0,
  packageDeal: false,
  includesVoiceAnalysis: true,
  includesTranscriptPdf: false,
  includesDrillPlanPdf: true,
  includesResponseVideo: false,
  active: true,
};

const PACKAGE_TEMPLATES = [
  {
    title: "Single Video Review",
    range: "$25–$45",
    price: 35,
    reviewType: "single_video",
    turnaroundHours: 48,
    description:
      "One focused review of a short match or drill clip. I will point out the biggest corrections, explain what to work on next, and include drills you can practice immediately.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: false,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Full Match Breakdown",
    range: "$50–$90",
    price: 75,
    reviewType: "match_breakdown",
    turnaroundHours: 72,
    description:
      "A deeper breakdown of match footage with notes on shot selection, court positioning, patterns, decision-making, and the main habits costing you points.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: true,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Doubles Strategy Review",
    range: "$35–$75",
    price: 55,
    reviewType: "doubles_strategy",
    turnaroundHours: 72,
    description:
      "A doubles-focused review covering partner spacing, movement, stacking, third-shot choices, kitchen pressure, resets, and point construction.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: false,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Singles Strategy Review",
    range: "$35–$75",
    price: 55,
    reviewType: "singles_strategy",
    turnaroundHours: 72,
    description:
      "A singles-focused review covering court positioning, patterns, serve and return strategy, shot selection, point construction, and how to create pressure one-on-one.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: false,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Personalized Training Plan",
    range: "$60–$125",
    price: 95,
    reviewType: "training_plan",
    turnaroundHours: 96,
    description:
      "A custom improvement plan based on the customer’s goals, current skill level, and uploaded footage. Includes priorities, drills, and a weekly practice structure.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: true,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Package Discount Bundle",
    range: "$100–$180",
    price: 140,
    reviewType: "package_discount",
    turnaroundHours: 120,
    discountPercent: 10,
    packageDeal: true,
    description:
      "A discounted bundle for multiple short video reviews. Example: four separate 15-minute video reviews purchased together at a lower total price than buying each one individually.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: false,
    includesDrillPlanPdf: true,
    includesResponseVideo: false,
  },
  {
    title: "Monthly Coaching Program",
    range: "$150–$300",
    price: 225,
    reviewType: "monthly",
    turnaroundHours: 120,
    description:
      "A monthly remote coaching option for players who want ongoing feedback, structured improvement goals, and repeated review throughout the month.",
    includesVoiceAnalysis: true,
    includesTranscriptPdf: true,
    includesDrillPlanPdf: true,
    includesResponseVideo: true,
  },
];

function phaseMeta(row) {
  const phase = normalizePhase(row.phase || row.status);

  if (phase === "awaiting_upload") {
    return {
      label: "Awaiting Upload",
      icon: <FaCloudUploadAlt />,
      cls: "bg-[#d9f7fb] text-[#087f73]",
      path: `/coach/submissions/${row._id}/review?phase=awaiting_upload`,
    };
  }

  if (phase === "ready_for_review") {
    return {
      label: "Ready For Review",
      icon: <FaClipboardList />,
      cls: "bg-[#ffd166] text-[#12372a]",
      path: `/coach/submissions/${row._id}/review?phase=ready_for_review`,
    };
  }

  return {
    label: "Reviewed",
    icon: <FaCheckCircle />,
    cls: "bg-[#c6ff4a] text-[#12372a]",
    path: `/coach/submissions/${row._id}/review?phase=reviewed`,
  };
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function packageStatus(item) {
  const price = Number(item.price || 0);

  if (item.active && price > 0) {
    return {
      label: "Public buy-now plan",
      cls: "bg-[#c6ff4a] text-[#12372a]",
    };
  }

  return {
    label: "Draft / not public",
    cls: "bg-[#fff0cf] text-[#7a4d00]",
  };
}

function readableReviewType(value) {
  return String(value || "single_video").replaceAll("_", " ");
}

function includedDeliverables(item) {
  const rows = [];

  if (item.includesVoiceAnalysis) rows.push("Voice analysis");
  if (item.includesTranscriptPdf) rows.push("Transcript PDF");
  if (item.includesDrillPlanPdf) rows.push("Drill-plan PDF");
  if (item.includesResponseVideo) rows.push("Response video");

  return rows.length ? rows.join(" • ") : "No deliverables selected";
}

export default function CoachDashboard() {
  const { token } = useAuth();
  const { push } = useToast();

  const [data, setData] = useState(null);
  const [pkg, setPkg] = useState(initialPackage);
  const [profileForm, setProfileForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoadError("");

    try {
      const result = await api.get("/coaches/dashboard", token);

      setProfileForm({
        ...(result?.profile || {}),
        instagram: result?.profile?.socialLinks?.instagram || "",
        youtube: result?.profile?.socialLinks?.youtube || "",
        website: result?.profile?.socialLinks?.website || "",
      });

      setData({
        ...result,
        submissions: Array.isArray(result?.submissions) ? result.submissions : [],
        packages: Array.isArray(result?.packages) ? result.packages : [],
        splits: Array.isArray(result?.splits) ? result.splits : [],
        inquiries: Array.isArray(result?.inquiries) ? result.inquiries : [],
        readiness: result?.readiness || null,
      });
    } catch (err) {
      setLoadError(err.message || "Your coach dashboard could not be loaded.");
      setData({
        profile: null,
        submissions: [],
        packages: [],
        splits: [],
        inquiries: [],
        readiness: null,
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stats = useMemo(() => {
    const rows = data?.submissions || [];
    const packages = data?.packages || [];

    return {
      awaiting: rows.filter((r) => normalizePhase(r.phase || r.status) === "awaiting_upload").length,
      ready: rows.filter((r) => normalizePhase(r.phase || r.status) === "ready_for_review").length,
      completed: rows.filter((r) => normalizePhase(r.phase || r.status) === "reviewed").length,
      options: packages.filter((item) => item.active && Number(item.price || 0) > 0).length,
      requests: data?.inquiries?.filter((item) => ["open", "quoted"].includes(item.status)).length || 0,
    };
  }, [data]);

  const applyTemplate = (template) => {
    setPkg((current) => ({
      ...current,
      ...template,
      maxVideoMinutes: 15,
      active: true,
      discountPercent: template.discountPercent || 0,
      packageDeal: Boolean(template.packageDeal || template.discountPercent),
    }));

    push(`${template.title} template applied. Adjust the price and wording before publishing.`, "success");
  };

  const uploadProfilePhoto = async (file) => {
    if (!file) return;

    try {
      const dataUrl = await imageFileToDataUrl(file);
      setProfileForm((p) => ({ ...p, avatarUrl: dataUrl }));
      push("Profile photo selected.", "success");
    } catch (err) {
      push(err.message || "Could not load that image.", "error");
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      await api.put("/coaches/me", profileForm, token);
      push("Coach profile updated.", "success");
      load();
    } catch (err) {
      push(err.message || "Profile update failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const openPayoutSetup = async () => {
    setPayoutBusy(true);

    try {
      const result = await api.post("/payments/connect/account", {}, token);
      if (!result?.onboardingUrl) throw new Error("Payout setup link was not returned.");
      window.location.assign(result.onboardingUrl);
    } catch (err) {
      push(err.message || "Payout setup is not available yet.", "error");
      setPayoutBusy(false);
    }
  };

  const createPackage = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      const payload = {
        ...pkg,
        price: Number(pkg.price || 0),
        discountPercent: Number(pkg.discountPercent || 0),
        turnaroundHours: Number(pkg.turnaroundHours || 72),
        maxVideoMinutes: Math.min(Number(pkg.maxVideoMinutes || 15), 15),
        packageDeal: Boolean(pkg.packageDeal || Number(pkg.discountPercent || 0) > 0 || pkg.reviewType === "package_discount"),
        active: pkg.active !== false,
      };

      await api.post("/coaches/packages", payload, token);

      push(
        payload.active
          ? "Plan published. Customers can now purchase it."
          : "Draft plan saved. It will not show publicly until published with a price greater than $0.",
        "success"
      );

      setPkg(initialPackage);
      load();
    } catch (err) {
      push(err.message || "Plan was not saved. Check the required fields and try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    return <div className="pp-app-shell px-6 pt-32 text-[#5f746c]">Loading coach dashboard...</div>;
  }

  return (
    <div className="pp-app-shell px-6 pt-32 pb-16">
      <div className="mx-auto max-w-7xl space-y-6">
        {loadError && (
          <div className="rounded-2xl border border-[#b94024]/20 bg-[#ffebe5] p-4 font-bold text-[#7a2b18]">
            {loadError}
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pp-kicker">Coach operations center</p>

            <h1 className="mt-2 text-4xl font-black text-[#12372a]">
              {data.profile?.displayName || "Coach"}
            </h1>

            <p className="mt-1 text-[#5f746c]">
              Run your coaching business: answer client requests, complete reviews, publish services, and manage payouts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/messages" className="pp-btn-primary px-5 py-3 text-sm">
              <FaComments className="mr-2" /> Open requests
            </Link>

            {data.profile?._id && (
              <Link to={`/coaches/${data.profile._id}`} className="pp-btn-secondary px-5 py-3 text-sm">
                View public profile
              </Link>
            )}
          </div>
        </div>

        {data.readiness?.warnings?.length > 0 && (
          <section className="rounded-[2rem] border border-[#ffd166]/40 bg-[#fff8e7] p-5 shadow-sm">
            <h2 className="text-xl font-black text-[#12372a]">Profile readiness</h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">
              Complete these items so customers can clearly understand and purchase your coaching services.
            </p>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {data.readiness.warnings.map((warning) => (
                <div key={warning} className="rounded-2xl border border-[#12372a]/10 bg-white p-3 text-sm font-bold text-[#7a4d00]">
                  {warning}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Coach workflow shortcuts">
          <a
            href="#request-inbox"
            className="rounded-3xl border border-[#12372a]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1"
          >
            <FaComments className="text-2xl text-[#087f73]" />
            <h2 className="mt-3 font-black text-[#12372a]">Respond to clients</h2>
            <p className="mt-1 text-sm text-[#40584f]">Discuss goals and prepare custom quotes.</p>
          </a>

          <a
            href="#review-queue"
            className="rounded-3xl border border-[#12372a]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1"
          >
            <FaClipboardList className="text-2xl text-[#087f73]" />
            <h2 className="mt-3 font-black text-[#12372a]">Complete reviews</h2>
            <p className="mt-1 text-sm text-[#40584f]">Open uploaded videos and deliver feedback.</p>
          </a>

          <a
            href="#offerings"
            className="rounded-3xl border border-[#12372a]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1"
          >
            <FaPlus className="text-2xl text-[#087f73]" />
            <h2 className="mt-3 font-black text-[#12372a]">Manage services</h2>
            <p className="mt-1 text-sm text-[#40584f]">Publish packages, pricing, and deliverables.</p>
          </a>

          <button
            type="button"
            onClick={openPayoutSetup}
            disabled={payoutBusy}
            className="rounded-3xl border border-[#12372a]/10 bg-[#12372a] p-5 text-left text-white shadow-sm transition hover:-translate-y-1 disabled:opacity-60"
          >
            <FaDollarSign className="text-2xl text-[#c6ff4a]" />
            <h2 className="mt-3 font-black text-white">
              {data.profile?.stripeAccountId ? "Manage payouts" : "Set up payouts"}
            </h2>
            <p className="mt-1 text-sm text-white/75">
              {payoutBusy ? "Opening secure Stripe setup..." : "Connect the account used to receive earnings."}
            </p>
          </button>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={<FaComments />} label="Open requests" value={stats.requests} />
          <Stat icon={<FaCloudUploadAlt />} label="Awaiting uploads" value={stats.awaiting} />
          <Stat icon={<FaClipboardList />} label="Ready reviews" value={stats.ready} />
          <Stat icon={<FaCheckCircle />} label="Completed reviews" value={stats.completed} />
          <Stat icon={<FaUserEdit />} label="Public paid plans" value={stats.options} />
        </div>

        <section
          id="request-inbox"
          className="scroll-mt-28 rounded-[2rem] border border-[#12372a]/10 bg-white/90 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-[#12372a]">Personalized request inbox</h2>
              <p className="mt-1 text-sm text-[#40584f]">
                Discuss custom requests and send final quotes for customer approval.
              </p>
            </div>

            <Link to="/messages" className="pp-btn-primary px-4 py-2 text-sm">
              Open all conversations
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(data.inquiries || []).slice(0, 4).map((item) => (
              <Link
                to="/messages"
                key={item._id}
                className="rounded-2xl border border-[#12372a]/10 bg-[#fffdf6] p-4 hover:bg-[#eaf9f7]"
              >
                <div className="flex justify-between gap-3">
                  <div className="font-black text-[#12372a]">
                    {item.playerId?.fullName || item.playerId?.email || "Customer"}
                  </div>

                  <span className="rounded-full bg-[#c6ff4a] px-2 py-1 text-[10px] font-black uppercase text-[#12372a]">
                    {item.status}
                  </span>
                </div>

                <div className="mt-1 text-sm font-semibold text-[#40584f]">{item.subject}</div>

                <div className="mt-2 text-xs text-[#087f73]">
                  {(item.requestedServices || []).join(" • ") || "General coaching request"}
                </div>
              </Link>
            ))}

            {!(data.inquiries || []).length && (
              <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f] md:col-span-2">
                New personalized requests will appear here and in Messages.
              </div>
            )}
          </div>
        </section>

        {profileForm && (
          <section
            id="profile"
            className="scroll-mt-28 rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm"
          >
            <h2 className="text-2xl font-black text-[#12372a]">Public profile and business details</h2>

            <p className="mt-1 text-sm leading-6 text-[#5f746c]">
              Update your profile photo, biography, DUPR ID, specializations, and social media links.
            </p>

            <form onSubmit={updateProfile} className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Profile photo upload</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => uploadProfilePhoto(e.target.files?.[0])}
                  className="pp-input px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-[#c6ff4a] file:px-4 file:py-2 file:font-black file:text-[#12372a]"
                />

                {profileForm.avatarUrl && (
                  <img
                    src={profileForm.avatarUrl}
                    alt="Profile preview"
                    className="mt-3 h-64 w-full rounded-3xl object-cover"
                  />
                )}
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">DUPR ID</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="Example: 7DVMM4"
                  value={profileForm.duprId || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, duprId: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">DUPR singles rating</span>
                <input
                  type="number"
                  step="0.001"
                  className="pp-input px-4 py-3"
                  placeholder="Example: 4.125"
                  value={profileForm.duprSingles ?? ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, duprSingles: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">DUPR doubles rating</span>
                <input
                  type="number"
                  step="0.001"
                  className="pp-input px-4 py-3"
                  placeholder="Example: 4.250"
                  value={profileForm.duprDoubles ?? ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, duprDoubles: e.target.value }))}
                />
              </label>

              <p className="text-xs font-semibold leading-5 text-[#40584f] md:col-span-2">
                Enter the current ratings shown on your DUPR profile. Ratings do not automatically sync from a DUPR ID.
              </p>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Areas of specialization</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="Example: doubles strategy, singles strategy, third-shot drops, resets, junior programs"
                  value={Array.isArray(profileForm.specialties) ? profileForm.specialties.join(", ") : profileForm.specialties || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, specialties: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Instagram URL</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="https://instagram.com/yourprofile"
                  value={profileForm.instagram || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, instagram: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">YouTube URL</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="https://youtube.com/@yourchannel"
                  value={profileForm.youtube || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, youtube: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Public contact email</span>
                <input
                  className="pp-input px-4 py-3"
                  type="email"
                  placeholder="coach@example.com"
                  value={profileForm.contactEmail || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, contactEmail: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Availability status</span>
                <select
                  className="pp-input px-4 py-3"
                  value={profileForm.presenceStatus || "offline"}
                  onChange={(e) => setProfileForm((p) => ({ ...p, presenceStatus: e.target.value }))}
                >
                  <option value="online">Online / available to chat</option>
                  <option value="offline">Offline / reply when available</option>
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-[#12372a]/10 bg-white px-4 py-3 font-bold text-[#12372a]">
                <input
                  type="checkbox"
                  checked={profileForm.acceptingInquiries !== false}
                  onChange={(e) => setProfileForm((p) => ({ ...p, acceptingInquiries: e.target.checked }))}
                />
                Accepting new custom inquiries
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Personal website</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="https://yourwebsite.com"
                  value={profileForm.website || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Biography and coaching expectations</span>
                <textarea
                  maxLength={5000}
                  rows={6}
                  className="pp-input px-4 py-3"
                  placeholder="Explain who you coach, what players can expect, your coaching style, and what types of videos customers should upload."
                  value={profileForm.bio || ""}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                />
              </label>

              <button className="pp-btn-primary px-4 py-3 md:col-span-2 disabled:opacity-60" disabled={busy}>
                Save Profile
              </button>
            </form>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section
            id="review-queue"
            className="scroll-mt-28 rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm"
          >
            <h2 className="text-2xl font-black text-[#12372a]">Review queue</h2>

            <p className="mt-1 text-sm leading-6 text-[#5f746c]">
              Track which players still need to upload, which submissions are ready for review, and which reviews have been completed.
            </p>

            <div className="mt-5 space-y-3">
              {data.submissions.map((row) => {
                const meta = phaseMeta(row);

                return (
                  <Link
                    key={`${row._id}-${row.status}`}
                    to={meta.path}
                    className="block rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4 transition hover:-translate-y-0.5 hover:bg-[#d9f7fb]/55"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#087f73]">
                          {meta.icon} {meta.label}
                        </div>

                        <h3 className="font-black text-[#12372a]">{row.title}</h3>

                        <p className="mt-1 text-sm text-[#5f746c]">
                          {row.playerId?.fullName || row.playerId?.email || "Player"} •{" "}
                          {row.packageId?.title || "Coaching package"}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${meta.cls}`}>
                        Open
                      </span>
                    </div>
                  </Link>
                );
              })}

              {!data.submissions.length && (
                <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f]">
                  Paid submissions will appear here when customers purchase a plan or approve a custom quote.
                </div>
              )}
            </div>
          </section>

          <section
            id="offerings"
            className="scroll-mt-28 rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm"
          >
            <h2 className="text-2xl font-black text-[#12372a]">Create buy-now coaching plan</h2>

            <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
              Customers can purchase these plans without messaging you first. If the plan is active, it must have a price greater than $0 before it appears publicly.
            </p>

            <div className="mt-5 rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
              <h3 className="font-black text-[#12372a]">Quick templates with suggested pricing</h3>

              <p className="mt-1 text-xs font-semibold text-[#40584f]">
                Click one to fill the form, then adjust the price and wording to match what you actually offer.
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PACKAGE_TEMPLATES.map((template) => (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="rounded-2xl border border-[#12372a]/10 bg-white p-3 text-left text-sm transition hover:bg-[#eaf9f7]"
                  >
                    <div className="font-black text-[#12372a]">{template.title}</div>
                    <div className="text-xs font-bold text-[#087f73]">Suggested range: {template.range}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#00a896]/20 bg-[#eaf9f7] p-4 text-sm font-semibold leading-6 text-[#40584f]">
              <h3 className="font-black text-[#12372a]">How package discounts appear to customers</h3>
              <p className="mt-2">
                Example: if you create a “Package Discount Bundle” for four 15-minute video reviews, the customer sees one buy-now plan with one total price. After purchase, they get access to the video submission workflow. You can explain in the description that the package includes four separate reviews and how the customer should submit each clip.
              </p>
            </div>

            <form onSubmit={createPackage} className="mt-5 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Plan name</span>
                <input
                  className="pp-input px-4 py-3"
                  placeholder="Example: Single Video Review"
                  value={pkg.title}
                  onChange={(e) => setPkg((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Customer-facing description</span>
                <textarea
                  rows={5}
                  className="pp-input px-4 py-3"
                  placeholder="Explain exactly what the customer receives, what they should upload, and what kind of feedback you will provide."
                  value={pkg.description}
                  onChange={(e) => setPkg((p) => ({ ...p, description: e.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Plan type</span>
                <select
                  className="pp-input px-4 py-3"
                  value={pkg.reviewType}
                  onChange={(e) =>
                    setPkg((p) => ({
                      ...p,
                      reviewType: e.target.value,
                      packageDeal: e.target.value === "package_discount" ? true : p.packageDeal,
                    }))
                  }
                >
                  <option value="single_video">Single video review</option>
                  <option value="match_breakdown">Match breakdown</option>
                  <option value="doubles_strategy">Doubles strategy</option>
                  <option value="singles_strategy">Singles strategy</option>
                  <option value="strategy_consultation">Strategy consultation</option>
                  <option value="training_plan">Personalized training plan</option>
                  <option value="package_discount">Package discount</option>
                  <option value="monthly">Customized monthly program</option>
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#12372a]">Price customer pays now</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pp-input px-4 py-3"
                    value={pkg.price}
                    onChange={(e) => setPkg((p) => ({ ...p, price: e.target.value }))}
                    placeholder="Example: 35"
                  />
                  <span className="mt-1 block text-xs font-semibold text-[#40584f]">
                    Public plans must be greater than $0. Drafts can be saved at $0.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#12372a]">Optional package discount percentage</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="pp-input px-4 py-3"
                    value={pkg.discountPercent}
                    onChange={(e) =>
                      setPkg((p) => ({
                        ...p,
                        discountPercent: e.target.value,
                        packageDeal: Number(e.target.value) > 0 || p.reviewType === "package_discount",
                      }))
                    }
                    placeholder="Example: 10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#12372a]">Turnaround time in hours</span>
                  <input
                    type="number"
                    min="1"
                    className="pp-input px-4 py-3"
                    value={pkg.turnaroundHours}
                    onChange={(e) => setPkg((p) => ({ ...p, turnaroundHours: Number(e.target.value) }))}
                    placeholder="Example: 72"
                  />
                  <span className="mt-1 block text-xs font-semibold text-[#40584f]">
                    Example: 48 = two days, 72 = three days.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-[#12372a]">Maximum video upload length</span>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    className="pp-input px-4 py-3"
                    value={pkg.maxVideoMinutes}
                    onChange={(e) =>
                      setPkg((p) => ({
                        ...p,
                        maxVideoMinutes: Math.min(Number(e.target.value || 15), 15),
                      }))
                    }
                    placeholder="Maximum 15 minutes"
                  />
                  <span className="mt-1 block text-xs font-semibold text-[#40584f]">
                    Current upload limit is 15 minutes.
                  </span>
                </label>
              </div>

              <div className="grid gap-2 rounded-2xl border border-[#12372a]/10 bg-white p-4 text-sm font-bold text-[#12372a]">
                <h3 className="font-black text-[#12372a]">What is included?</h3>

                {[
                  ["includesVoiceAnalysis", "Voice-recorded analysis"],
                  ["includesTranscriptPdf", "Transcript PDF"],
                  ["includesDrillPlanPdf", "Downloadable drill-plan PDF"],
                  ["includesResponseVideo", "Response video"],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(pkg[key])}
                      onChange={(e) => setPkg((p) => ({ ...p, [key]: e.target.checked }))}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4 font-bold text-[#12372a]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(pkg.packageDeal || Number(pkg.discountPercent || 0) > 0 || pkg.reviewType === "package_discount")}
                  onChange={(e) => setPkg((p) => ({ ...p, packageDeal: e.target.checked }))}
                />

                <span>
                  Mark this as a package discount
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#40584f]">
                    Use this for bundles such as four video reviews at a lower total price. Explain the bundle details clearly in the description.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-[#12372a]/10 bg-[#eaf9f7] p-4 font-bold text-[#12372a]">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={pkg.active !== false}
                  onChange={(e) => setPkg((p) => ({ ...p, active: e.target.checked }))}
                />

                <span>
                  Publish this plan publicly
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#40584f]">
                    Turn this off to save as a draft. Public plans require a price greater than $0 and appear on your customer-facing profile.
                  </span>
                </span>
              </label>

              <button className="pp-btn-primary px-4 py-3 disabled:opacity-60" disabled={busy}>
                <FaPlus className="mr-2" />
                {pkg.active !== false ? "Publish Buy-Now Plan" : "Save Draft Plan"}
              </button>
            </form>

            <h3 className="mt-6 font-black text-[#12372a]">Current coaching plans</h3>

            <div className="mt-3 grid gap-3">
              {(data.packages || []).map((item) => {
                const status = packageStatus(item);

                return (
                  <div key={item._id} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-black text-[#12372a]">
                          {item.title} — {money(item.price)}
                          {item.discountPercent > 0 ? ` (${item.discountPercent}% package discount)` : ""}
                        </div>

                        <div className="mt-1 text-sm text-[#5f746c]">
                          {readableReviewType(item.reviewType)} • {item.turnaroundHours || 72}h turnaround •{" "}
                          {Math.min(item.maxVideoMinutes || 15, 15)} min max video
                        </div>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-3 text-sm font-semibold leading-6 text-[#40584f]">
                      {item.description || "No description entered yet."}
                    </p>

                    <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs font-bold text-[#087f73]">
                      Includes: {includedDeliverables(item)}
                    </div>

                    {(item.packageDeal || item.discountPercent > 0 || item.reviewType === "package_discount") && (
                      <div className="mt-3 rounded-xl bg-[#eaf9f7] p-3 text-xs font-bold text-[#087f73]">
                        Package discount plan: customers purchase this as one discounted bundle. Make sure the description explains how many reviews or sessions are included.
                      </div>
                    )}

                    {(!item.active || Number(item.price || 0) <= 0) && (
                      <div className="mt-3 rounded-xl border border-[#ffd166]/50 bg-white p-3 text-xs font-bold text-[#7a4d00]">
                        This plan is not public. To make it public, save it as active with a price greater than $0.
                      </div>
                    )}
                  </div>
                );
              })}

              {!(data.packages || []).length && (
                <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f]">
                  No coaching plans yet. Use a template above or create your first buy-now plan manually.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-[#12372a]/10 bg-white/82 p-5 shadow-sm">
      <div className="mb-3 text-2xl text-[#00a896]">{icon}</div>
      <div className="text-sm text-[#5f746c]">{label}</div>
      <div className="mt-1 text-3xl font-black text-[#12372a]">{value}</div>
    </div>
  );
}