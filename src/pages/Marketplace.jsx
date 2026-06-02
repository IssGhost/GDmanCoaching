import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarCheck, FaFilter, FaMapMarkerAlt, FaSearch, FaStar, FaVideo } from "react-icons/fa";
import { api } from "../lib/api";

const fallbackCoaches = [
  {
    _id: "demo-1",
    displayName: "Alex Rivera",
    headline: "Private lessons, doubles strategy, and tournament prep",
    city: "Austin",
    state: "TX",
    rating: 5,
    reviewCount: 38,
    specialties: ["Private Lessons", "Doubles", "Third-shot drops", "Kitchen resets"],
    skillLevels: ["Beginner", "Intermediate", "Tournament"],
    turnaroundHours: 24,
    liveSessionRate: 85,
    videoReviewRate: 45,
    packages: [
      { _id: "demo-pkg-1", title: "1-Hour Private Lesson", price: 85, reviewType: "live_session" },
      { _id: "demo-pkg-2", title: "Single Video Review", price: 45, reviewType: "single_video" },
    ],
  },
  {
    _id: "demo-2",
    displayName: "Morgan Chen",
    headline: "Footwork, resets, beginner fundamentals, and clinics",
    city: "Round Rock",
    state: "TX",
    rating: 4.9,
    reviewCount: 24,
    specialties: ["Group Clinics", "Footwork", "Beginner basics", "Serve return"],
    skillLevels: ["Beginner", "Intermediate"],
    turnaroundHours: 24,
    liveSessionRate: 75,
    videoReviewRate: 35,
    packages: [{ _id: "demo-pkg-3", title: "Beginner Court Session", price: 75, reviewType: "live_session" }],
  },
];

function packageLabel(pkg) {
  const type = String(pkg?.reviewType || "").replaceAll("_", " ");
  if (pkg?.reviewType === "live_session") return "In-person training";
  if (pkg?.reviewType === "single_video" || pkg?.reviewType === "match_breakdown" || pkg?.reviewType === "doubles_strategy") return "Video review";
  return type || "Coaching";
}

export default function Marketplace() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");

  useEffect(() => {
    api.get("/coaches")
      .then((rows) => setCoaches(rows.length ? rows : fallbackCoaches))
      .catch(() => setCoaches(fallbackCoaches))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coaches.filter((coach) => {
      const text = [coach.displayName, coach.headline, coach.city, coach.state, ...(coach.specialties || []), ...(coach.skillLevels || [])]
        .join(" ")
        .toLowerCase();
      return (!q || text.includes(q)) && (level === "all" || (coach.skillLevels || []).join(" ").toLowerCase().includes(level));
    });
  }, [coaches, query, level]);

  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="pp-kicker">Coach marketplace</p>
            <h1 className="mt-2 text-4xl font-black text-[#12372a] md:text-6xl">Book pickleball coaching your way.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f746c]">
              Schedule in-person private lessons, group clinics, tournament prep, or online video review. Demo mode also tracks coach payouts and split-payment records.
            </p>
          </div>
          <div className="rounded-3xl border border-[#12372a]/10 bg-white/75 p-4 shadow-xl shadow-[#12372a]/10 backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <FaSearch className="absolute left-3 top-3.5 text-[#5f746c]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pp-input py-3 pl-10 pr-3"
                  placeholder="Search coach, city, skill, strategy..."
                />
              </label>
              <label className="relative">
                <FaFilter className="absolute left-3 top-3.5 text-[#5f746c]" />
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="pp-input py-3 pl-10 pr-8">
                  <option value="all">All levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="tournament">Tournament</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pp-card-solid rounded-2xl p-8 text-[#5f746c]">Loading coaches...</div>
        ) : list.length === 0 ? (
          <div className="pp-card-solid rounded-2xl p-8 text-center">
            <h2 className="text-xl font-black text-[#12372a]">No coaches matched that filter.</h2>
            <button onClick={() => { setQuery(""); setLevel("all"); }} className="pp-btn-primary mt-4 px-4 py-2">Reset filters</button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((coach) => {
              const firstPackage = coach.packages?.[0];
              const isDemo = String(coach._id).startsWith("demo-");
              return (
                <article key={coach._id} className="flex flex-col rounded-3xl border border-[#12372a]/10 bg-white/78 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur transition hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className="pp-ball grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black text-[#12372a]">
                      {(coach.displayName || "C").slice(0, 1)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#12372a]">{coach.displayName}</h2>
                      <p className="text-sm leading-5 text-[#5f746c]">{coach.headline}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-[#5f746c]">
                        <span className="flex items-center gap-1"><FaMapMarkerAlt /> {coach.city || "Online"}{coach.state ? `, ${coach.state}` : ""}</span>
                        <span className="flex items-center gap-1 text-[#ff7b54]"><FaStar /> {coach.rating || 5} ({coach.reviewCount || 0})</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {(coach.specialties || []).slice(0, 4).map((s) => (
                      <span key={s} className="pp-chip rounded-full px-3 py-1 text-xs">{s}</span>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#00a896]/15 bg-[#d9f7fb]/55 p-4">
                    <div className="text-sm font-bold text-[#5f746c]">Starting at</div>
                    <div className="text-3xl font-black text-[#087f73]">${Number(firstPackage?.price || coach.liveSessionRate || coach.videoReviewRate || 45).toFixed(0)}</div>
                    <div className="mt-1 text-sm font-bold text-[#5f746c]">{firstPackage?.title || "Coaching package"}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-white/75 px-3 py-1 text-[#087f73]"><FaCalendarCheck className="mr-1 inline" /> In-person</span>
                      <span className="rounded-full bg-white/75 px-3 py-1 text-[#087f73]"><FaVideo className="mr-1 inline" /> Video review</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(coach.packages || []).slice(0, 3).map((pkg) => (
                      <div key={pkg._id} className="flex items-center justify-between gap-3 rounded-xl bg-white/65 p-3 text-sm">
                        <span className="font-black text-[#12372a]">{pkg.title}</span>
                        <span className="shrink-0 rounded-full bg-[#fff1c7] px-2 py-1 text-xs font-black text-[#5f746c]">{packageLabel(pkg)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex gap-3 pt-5">
                    {isDemo ? (
                      <Link to="/demo" className="pp-btn-secondary flex-1 px-4 py-3 text-center">Seed Demo</Link>
                    ) : (
                      <Link to={`/coaches/${coach._id}`} className="pp-btn-secondary flex-1 px-4 py-3 text-center">View Profile</Link>
                    )}
                    <Link to={isDemo ? "/signin" : `/coaches/${coach._id}`} className="pp-btn-primary flex-1 px-4 py-3 text-center">Book</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}