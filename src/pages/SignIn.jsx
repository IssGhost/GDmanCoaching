import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaDatabase,
  FaLock,
  FaMapMarkerAlt,
  FaPlayCircle,
  FaUser,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const quickAccess = [
  {
    role: "Customer",
    icon: FaUser,
    email: "customer",
    password: "customer",
    start: "/dashboard/submissions",
    text: "Bookings, uploads, reviews, and training requests.",
  },
  {
    role: "Coach",
    icon: FaUserTie,
    email: "coach",
    password: "coach",
    start: "/coach/dashboard",
    text: "Packages, submissions, review queue, and payouts.",
  },
  {
    role: "Admin",
    icon: FaUserShield,
    email: "admin",
    password: "admin",
    start: "/admin/coaching",
    text: "Coach approvals, platform activity, and split payments.",
  },
];

function routeFor(user, fallback = "/dashboard/submissions") {
  if (user?.role === "admin") return "/admin/coaching";
  if (user?.role === "coach") return "/coach/dashboard";
  return fallback;
}

export default function SignIn() {
  const { signin, authBusy } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard/submissions";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recordsReady, setRecordsReady] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const submitCredentials = async (nextEmail, nextPassword, forcedRoute) => {
    setError("");

    try {
      const user = await signin({ email: nextEmail, password: nextPassword });
      if (user) nav(forcedRoute || routeFor(user, from), { replace: true });
    } catch (err) {
      setError(err?.message || "Failed to sign in.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await submitCredentials(email, password);
  };

  const refreshRecords = async () => {
    setPreparing(true);
    setError("");

    try {
      await api.post("/demo/seed", {});
      setRecordsReady(true);
    } catch (err) {
      setError(err?.message || "Could not prepare platform records.");
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="pp-page grid min-h-screen place-items-center px-6 pt-28 pb-16">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#12372a]/10 bg-white/75 shadow-2xl shadow-[#12372a]/10 backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="pp-court-card relative hidden p-8 text-white lg:block">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#c6ff4a]/80 blur-xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#ffd166]/45 blur-2xl" />

          <div className="relative">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-2xl">
              <FaMapMarkerAlt />
            </div>

            <h2 className="text-4xl font-black text-white">Access the full coaching platform.</h2>

            <p className="mt-4 leading-7 text-white/85">
              Use quick access to enter the customer, coach, and admin workspaces for in-person training, video review, and split-payment tracking.
            </p>

            <div className="mt-8 grid gap-3 text-sm font-bold text-white/90">
              <div className="rounded-xl bg-white/15 p-3">Customer booking and training dashboard</div>
              <div className="rounded-xl bg-white/15 p-3">Coach review workflow and package tools</div>
              <div className="rounded-xl bg-white/15 p-3">Admin approvals and payment tracking</div>
            </div>
          </div>
        </aside>

        <div className="p-6 md:p-10">
          <div>
            <div className="pp-pill mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black">
              <FaPlayCircle /> Quick role access
            </div>

            <h1 className="text-3xl font-black text-[#12372a]">Sign in</h1>

            <p className="mt-2 text-sm leading-6 text-[#5f746c]">
              Access bookings, in-person sessions, video reviews, coach payouts, split payments, and admin controls.
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-[#ffd166]/45 bg-[#fff1c7]/75 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-black text-[#12372a]">Platform records</div>
                <div className="text-xs leading-5 text-[#5f746c]">
                  Prepares customer, coach, booking, review, and payment activity records.
                </div>
              </div>

              <button
                onClick={refreshRecords}
                disabled={preparing}
                className="pp-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                type="button"
              >
                <FaDatabase className="mr-2" /> {preparing ? "Preparing..." : recordsReady ? "Ready" : "Refresh Records"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {quickAccess.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => submitCredentials(item.email, item.password, item.start)}
                  disabled={authBusy}
                  className="rounded-2xl border border-[#12372a]/10 bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:bg-white disabled:opacity-60"
                >
                  <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#d9f7fb] text-[#00a896]">
                    <Icon />
                  </div>

                  <div className="font-black text-[#12372a]">{item.role}</div>
                  <div className="mt-1 text-xs leading-5 text-[#5f746c]">{item.text}</div>

                  <div className="mt-3 rounded-xl bg-[#fff8e7] p-2 text-xs font-bold text-[#5f746c]">
                    {item.email} / {item.password}
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <label className="block space-y-2">
              <span className="text-sm font-black text-[#12372a]">Email or username</span>
              <input
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pp-input px-4 py-3"
                placeholder="customer, coach, admin, or you@domain.com"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-black text-[#12372a]">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pp-input px-4 py-3"
                placeholder="Your password"
                required
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-[#ff7b54]/20 bg-[#ff7b54]/10 p-3 text-sm font-bold text-[#b94024] whitespace-pre-wrap">
                {error}
              </div>
            )}

            <button disabled={authBusy} className="pp-btn-primary w-full px-5 py-3 disabled:opacity-60">
              {authBusy ? "Signing in..." : "Continue"}
            </button>

            <p className="text-sm text-[#5f746c]">
              Need an account?{" "}
              <Link to="/signup" className="font-black text-[#087f73] hover:underline">
                Create one
              </Link>
              .
            </p>

            <p className="flex items-center gap-2 text-xs font-bold text-[#5f746c]">
              <FaLock className="text-[#00a896]" /> Secure dashboard access for customers, coaches, and admins.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}