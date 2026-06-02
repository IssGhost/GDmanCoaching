import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaCloudUploadAlt, FaClipboardList, FaMoneyBillWave, FaPlus } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { DEMO_SUBMISSIONS, normalizePhase } from "../lib/demoData";

const initialPackage = {
  title: "",
  description: "",
  price: 45,
  reviewType: "single_video",
  turnaroundHours: 48,
  maxVideoMinutes: 10,
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
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const result = await api.get("/coaches/dashboard", token);

      const liveSubmissions = Array.isArray(result?.submissions) ? result.submissions : [];
      const mergedSubmissions = [
        ...DEMO_SUBMISSIONS,
        ...liveSubmissions.filter((row) => !DEMO_SUBMISSIONS.some((demoRow) => demoRow._id === row._id)),
      ];

      setData({
        ...result,
        submissions: mergedSubmissions,
        profile: result?.profile || {
          displayName: "Jordan Coach",
          approved: true,
          payoutsEnabled: true,
        },
        packages: result?.packages?.length
          ? result.packages
          : [
              { _id: "pkg-1", title: "1-Hour Private Lesson", price: 85, reviewType: "live_session", turnaroundHours: 24 },
              { _id: "pkg-2", title: "Single Video Review", price: 45, reviewType: "single_video", turnaroundHours: 24 },
              { _id: "pkg-3", title: "Hybrid Training Package", price: 125, reviewType: "monthly", turnaroundHours: 24 },
            ],
        splits: result?.splits || [],
      });
    } catch {
      setData({
        profile: {
          displayName: "Jordan Coach",
          approved: true,
          payoutsEnabled: true,
        },
        submissions: DEMO_SUBMISSIONS,
        packages: [
          { _id: "pkg-1", title: "1-Hour Private Lesson", price: 85, reviewType: "live_session", turnaroundHours: 24 },
          { _id: "pkg-2", title: "Single Video Review", price: 45, reviewType: "single_video", turnaroundHours: 24 },
          { _id: "pkg-3", title: "Hybrid Training Package", price: 125, reviewType: "monthly", turnaroundHours: 24 },
        ],
        splits: [],
      });
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
      payout: 182.75,
    };
  }, [data]);

  const createPackage = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      await api.post("/coaches/packages", pkg, token);
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
    return <div className="pp-demo-shell px-6 pt-32 text-[#5f746c]">Loading coach dashboard...</div>;
  }

  return (
    <div className="pp-demo-shell px-6 pt-32 pb-16">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pp-kicker">Coach dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-[#12372a]">
              {data.profile?.displayName || "Coach"}
            </h1>
            <p className="mt-1 text-[#5f746c]">
              Manage player uploads, active reviews, completed feedback, coaching packages, and payout activity.
            </p>
          </div>

          <span className="pp-btn-primary px-5 py-3 text-sm">
            <FaMoneyBillWave className="mr-2" /> Payouts Enabled
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<FaCloudUploadAlt />} label="Awaiting uploads" value={stats.awaiting} />
          <Stat icon={<FaClipboardList />} label="Ready reviews" value={stats.ready} />
          <Stat icon={<FaCheckCircle />} label="Completed reviews" value={stats.completed} />
          <Stat icon={<FaMoneyBillWave />} label="Tracked payouts" value={`$${stats.payout.toFixed(2)}`} />
        </div>

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
            <h2 className="text-2xl font-black text-[#12372a]">Create coaching package</h2>

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

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  className="pp-input px-4 py-3"
                  value={pkg.price}
                  onChange={(e) => setPkg((p) => ({ ...p, price: Number(e.target.value) }))}
                />

                <select
                  className="pp-input px-4 py-3"
                  value={pkg.reviewType}
                  onChange={(e) => setPkg((p) => ({ ...p, reviewType: e.target.value }))}
                >
                  <option value="live_session">In-person lesson</option>
                  <option value="single_video">Single video review</option>
                  <option value="match_breakdown">Match breakdown</option>
                  <option value="monthly">Hybrid package</option>
                  <option value="doubles_strategy">Doubles strategy</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                  onChange={(e) => setPkg((p) => ({ ...p, maxVideoMinutes: Number(e.target.value) }))}
                />
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
                    {pkg.title} — ${pkg.price}
                  </div>

                  <div className="mt-1 text-sm text-[#5f746c]">
                    {String(pkg.reviewType || "").replaceAll("_", " ")} • {pkg.turnaroundHours || 24}h
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