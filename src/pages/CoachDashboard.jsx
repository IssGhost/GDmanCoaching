import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaCloudUploadAlt, FaClipboardList, FaPlus, FaUserEdit } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { imageFileToDataUrl } from "../lib/uploads";
import { normalizePhase } from "../lib/workflow";

const initialPackage = {
  title: "",
  description: "",
  price: 0,
  reviewType: "single_video",
  turnaroundHours: 72,
  maxVideoMinutes: 15,
  discountPercent: 0,
  packageDeal: false,
  includesVoiceAnalysis: true,
  includesTranscriptPdf: false,
  includesDrillPlanPdf: true,
};

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

export default function CoachDashboard() {
  const { token } = useAuth();
  const { push } = useToast();

  const [data, setData] = useState(null);
  const [pkg, setPkg] = useState(initialPackage);
  const [profileForm, setProfileForm] = useState(null);
  const [busy, setBusy] = useState(false);
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
      });
    } catch (err) {
      setLoadError(err.message || "Your coach dashboard could not be loaded.");
      setData({ profile: null, submissions: [], packages: [], splits: [] });
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const stats = useMemo(() => {
    const rows = data?.submissions || [];

    return {
      awaiting: rows.filter((r) => normalizePhase(r.phase || r.status) === "awaiting_upload").length,
      ready: rows.filter((r) => normalizePhase(r.phase || r.status) === "ready_for_review").length,
      completed: rows.filter((r) => normalizePhase(r.phase || r.status) === "reviewed").length,
      options: data?.packages?.length || 0,
    };
  }, [data]);

  const uploadProfilePhoto = async (file) => {
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

  const createPackage = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      await api.post("/coaches/packages", { ...pkg, price: Math.max(Number(pkg.price || 0), 0), maxVideoMinutes: Math.min(Number(pkg.maxVideoMinutes || 15), 15) }, token);
      push("Package created.", "success");
      setPkg(initialPackage);
      load();
    } catch {
      setData((current) => ({
        ...current,
        packages: [{ _id: `local-${Date.now()}`, ...pkg }, ...(current?.packages || [])],
      }));

      setPkg(initialPackage);
      push("Package added.", "success");
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
        {loadError && <div className="rounded-2xl border border-[#b94024]/20 bg-[#ffebe5] p-4 font-bold text-[#7a2b18]">{loadError}</div>}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pp-kicker">Coach dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-[#12372a]">
              {data.profile?.displayName || "Coach"}
            </h1>
            <p className="mt-1 text-[#5f746c]">
              Manage your public profile, player uploads, active reviews, completed feedback, and online coaching options.
            </p>
          </div>

          <span className="pp-btn-primary px-5 py-3 text-sm">
            <FaUserEdit className="mr-2" /> Profile Editable
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<FaCloudUploadAlt />} label="Awaiting uploads" value={stats.awaiting} />
          <Stat icon={<FaClipboardList />} label="Ready reviews" value={stats.ready} />
          <Stat icon={<FaCheckCircle />} label="Completed reviews" value={stats.completed} />
          <Stat icon={<FaUserEdit />} label="Online options" value={stats.options} />
        </div>

        {profileForm && (
          <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm">
            <h2 className="text-2xl font-black text-[#12372a]">Edit public coach profile</h2>
            <p className="mt-1 text-sm leading-6 text-[#5f746c]">Update your profile photo, biography, DUPR ID, specializations, and social media links.</p>
            <form onSubmit={updateProfile} className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-black text-[#12372a]">Profile photo upload</span>
                <input type="file" accept="image/*" onChange={(e) => uploadProfilePhoto(e.target.files?.[0])} className="pp-input px-4 py-3 file:mr-4 file:rounded-full file:border-0 file:bg-[#c6ff4a] file:px-4 file:py-2 file:font-black file:text-[#12372a]" />
                {profileForm.avatarUrl && <img src={profileForm.avatarUrl} alt="Profile preview" className="mt-3 h-64 w-full rounded-3xl object-cover" />}
              </label>
              <input className="pp-input px-4 py-3" placeholder="DUPR ID (example: 7DVMM4)" value={profileForm.duprId || ""} onChange={(e) => setProfileForm((p) => ({ ...p, duprId: e.target.value }))} />
              <input type="number" step="0.001" className="pp-input px-4 py-3" placeholder="DUPR singles rating" value={profileForm.duprSingles ?? ""} onChange={(e) => setProfileForm((p) => ({ ...p, duprSingles: e.target.value }))} />
              <input type="number" step="0.001" className="pp-input px-4 py-3" placeholder="DUPR doubles rating" value={profileForm.duprDoubles ?? ""} onChange={(e) => setProfileForm((p) => ({ ...p, duprDoubles: e.target.value }))} />
              <p className="text-xs font-semibold leading-5 text-[#40584f] md:col-span-2">Enter the current ratings shown on your DUPR profile. Ratings do not automatically sync from a DUPR ID.</p>
              <input className="pp-input px-4 py-3 md:col-span-2" placeholder="Areas of specialization, comma-separated" value={Array.isArray(profileForm.specialties) ? profileForm.specialties.join(", ") : profileForm.specialties || ""} onChange={(e) => setProfileForm((p) => ({ ...p, specialties: e.target.value }))} />
              <input className="pp-input px-4 py-3" placeholder="Instagram URL" value={profileForm.instagram || ""} onChange={(e) => setProfileForm((p) => ({ ...p, instagram: e.target.value }))} />
              <input className="pp-input px-4 py-3" placeholder="YouTube URL" value={profileForm.youtube || ""} onChange={(e) => setProfileForm((p) => ({ ...p, youtube: e.target.value }))} />
              <input className="pp-input px-4 py-3" type="email" placeholder="Public contact email" value={profileForm.contactEmail || ""} onChange={(e) => setProfileForm((p) => ({ ...p, contactEmail: e.target.value }))} />
              <select className="pp-input px-4 py-3" value={profileForm.presenceStatus || "offline"} onChange={(e) => setProfileForm((p) => ({ ...p, presenceStatus: e.target.value }))}><option value="online">Online / available to chat</option><option value="offline">Offline / reply when available</option></select>
              <label className="flex items-center gap-2 rounded-xl border border-[#12372a]/10 bg-white px-4 py-3 font-bold text-[#12372a]"><input type="checkbox" checked={profileForm.acceptingInquiries !== false} onChange={(e) => setProfileForm((p) => ({ ...p, acceptingInquiries: e.target.checked }))} /> Accepting new inquiries</label>
              <input className="pp-input px-4 py-3" placeholder="Personal website" value={profileForm.website || ""} onChange={(e) => setProfileForm((p) => ({ ...p, website: e.target.value }))} />
              <textarea maxLength={5000} rows={6} className="pp-input px-4 py-3 md:col-span-2" placeholder="Biography and coaching expectations" value={profileForm.bio || ""} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} />
              <button className="pp-btn-primary px-4 py-3 md:col-span-2 disabled:opacity-60" disabled={busy}>Save Profile</button>
            </form>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm">
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
                          {row.playerId?.fullName || row.playerId?.email || "Player"} • {row.packageId?.title || "Coaching package"}
                        </p>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${meta.cls}`}>
                        Open
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#12372a]/10 bg-white/84 p-5 shadow-sm">
            <h2 className="text-2xl font-black text-[#12372a]">Create online coaching option</h2>

            <form onSubmit={createPackage} className="mt-5 grid gap-3">
              <input
                className="pp-input px-4 py-3"
                placeholder="Package title"
                value={pkg.title}
                onChange={(e) => setPkg((p) => ({ ...p, title: e.target.value }))}
                required
              />

              <textarea
                className="pp-input px-4 py-3"
                placeholder="Package description"
                value={pkg.description}
                onChange={(e) => setPkg((p) => ({ ...p, description: e.target.value }))}
                required
              />

              <div className="grid gap-3 sm:grid-cols-1">
                <select
                  className="pp-input px-4 py-3"
                  value={pkg.reviewType}
                  onChange={(e) => setPkg((p) => ({ ...p, reviewType: e.target.value }))}
                >
                  <option value="single_video">Single video review</option>
                  <option value="match_breakdown">Match breakdown</option>
                  <option value="strategy_consultation">Strategy consultation</option>
                  <option value="training_plan">Personalized training plan</option>
                  <option value="monthly">Customized monthly program</option>
                  <option value="doubles_strategy">Doubles strategy</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input type="number" min="0" step="0.01" className="pp-input px-4 py-3" value={pkg.price} onChange={(e) => setPkg((p) => ({ ...p, price: e.target.value }))} placeholder="Price" required />
                <input type="number" min="0" max="100" className="pp-input px-4 py-3" value={pkg.discountPercent} onChange={(e) => setPkg((p) => ({ ...p, discountPercent: e.target.value, packageDeal: Number(e.target.value) > 0 }))} placeholder="Package discount %" />
                <input
                  type="number"
                  className="pp-input px-4 py-3"
                  value={pkg.turnaroundHours}
                  onChange={(e) => setPkg((p) => ({ ...p, turnaroundHours: Number(e.target.value) }))}
                />

                <input
                  type="number"
                  className="pp-input px-4 py-3"
                  value={pkg.maxVideoMinutes}
                  max="15"
                  onChange={(e) => setPkg((p) => ({ ...p, maxVideoMinutes: Math.min(Number(e.target.value), 15) }))}
                />
              </div>

              <div className="grid gap-2 rounded-2xl border border-[#12372a]/10 bg-white p-4 text-sm font-bold text-[#12372a]">
                {[['includesVoiceAnalysis','Voice-recorded analysis'],['includesTranscriptPdf','Transcript PDF'],['includesDrillPlanPdf','Downloadable drill-plan PDF']].map(([key,label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(pkg[key])} onChange={(e)=>setPkg((p)=>({...p,[key]:e.target.checked}))}/>{label}</label>)}
              </div>

              <button className="pp-btn-primary px-4 py-3 disabled:opacity-60" disabled={busy}>
                <FaPlus className="mr-2" /> Add Package
              </button>
            </form>

            <h3 className="mt-6 font-black text-[#12372a]">Current packages</h3>

            <div className="mt-3 grid gap-3">
              {(data.packages || []).map((pkg) => (
                <div key={pkg._id} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                  <div className="font-black text-[#12372a]">
                    {pkg.title} — ${Number(pkg.price || 0).toFixed(2)}{pkg.discountPercent > 0 ? ` (${pkg.discountPercent}% package discount)` : ""}
                  </div>

                  <div className="mt-1 text-sm text-[#5f746c]">
                    {String(pkg.reviewType || "").replaceAll("_", " ")} • {pkg.turnaroundHours || 72}h • {Math.min(pkg.maxVideoMinutes || 15, 15)} min max video
                  </div>
                </div>
              ))}
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