import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaDatabase, FaUser, FaUserShield, FaUserTie } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const credentials = [
  {
    role: "Customer",
    icon: FaUser,
    username: "customer",
    password: "customer",
    path: "/dashboard/submissions",
    description: "Player bookings, uploads, completed reviews, and training requests.",
  },
  {
    role: "Coach",
    icon: FaUserTie,
    username: "coach",
    password: "coach",
    path: "/coach/dashboard",
    description: "Coach packages, review queue, lesson notes, and payout activity.",
  },
  {
    role: "Admin",
    icon: FaUserShield,
    username: "admin",
    password: "admin",
    path: "/admin/coaching",
    description: "Coach approvals, submissions, platform activity, and payment splits.",
  },
];

const featureCards = [
  "In-person training bookings",
  "Online video submissions",
  "Coach review workflow",
  "Timestamped feedback",
  "Package management",
  "Split-payment tracking",
];

export default function DemoMVP() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const { signin, authBusy } = useAuth();
  const nav = useNavigate();

  const refreshRecords = async () => {
    setBusy(true);
    setStatus("");

    try {
      await api.post("/demo/seed", {});
      setStatus("Platform records are ready.");
    } catch (err) {
      setStatus(err.message || "Could not prepare platform records.");
    } finally {
      setBusy(false);
    }
  };

  const login = async (cred) => {
    const user = await signin({ email: cred.username, password: cred.password });
    if (user) nav(cred.path);
  };

  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-6xl text-center">
        <div className="pp-pill mx-auto mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black">
          <FaDatabase className="text-[#ff7b54]" /> Platform Access
        </div>

        <h1 className="text-4xl font-black text-[#12372a] md:text-6xl">
          PicklePro Coach control center.
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#5f746c]">
          Access customer, coach, and admin workspaces from one place.
        </p>
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-[2rem] border border-[#12372a]/10 bg-white/75 p-6 shadow-2xl shadow-[#12372a]/10 backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#12372a]">System records</h2>
            <p className="mt-1 text-sm leading-6 text-[#5f746c]">
              Prepare the platform with current customers, coaches, bookings, reviews, and payment activity.
            </p>
          </div>

          <button onClick={refreshRecords} disabled={busy} className="pp-btn-primary px-5 py-3 disabled:opacity-60">
            <FaDatabase className="mr-2" /> {busy ? "Preparing..." : "Refresh Records"}
          </button>
        </div>

        {status && (
          <div className="mt-4 rounded-2xl border border-[#00a896]/20 bg-[#d9f7fb]/70 p-4 text-sm font-bold text-[#087f73]">
            {status}
          </div>
        )}
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-3">
        {credentials.map((cred) => {
          const Icon = cred.icon;

          return (
            <div key={cred.role} className="pp-card-solid rounded-3xl p-6">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]">
                <Icon />
              </div>

              <h3 className="text-xl font-black text-[#12372a]">{cred.role} Access</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-[#5f746c]">{cred.description}</p>

              <div className="mt-4 space-y-2 rounded-2xl bg-[#fff8e7] p-4 text-sm text-[#5f746c]">
                <div><b>Username:</b> {cred.username}</div>
                <div><b>Password:</b> {cred.password}</div>
              </div>

              <button
                onClick={() => login(cred)}
                disabled={authBusy}
                className="pp-btn-primary mt-5 w-full px-4 py-3 disabled:opacity-60"
              >
                Login as {cred.role}
              </button>

              <Link to={cred.path} className="pp-btn-secondary mt-3 w-full px-4 py-3 text-center">
                Open Workspace
              </Link>
            </div>
          );
        })}
      </section>

      <section className="mx-auto mt-8 max-w-6xl rounded-[2rem] border border-[#12372a]/10 bg-gradient-to-br from-[#fffef8] via-[#d9f7fb] to-[#fff1c7] p-8 shadow-xl shadow-[#12372a]/10">
        <h2 className="text-2xl font-black text-[#12372a]">Platform capabilities</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {featureCards.map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-4 text-[#5f746c]">
              <FaCheckCircle className="mt-1 shrink-0 text-[#00a896]" />
              <span className="font-bold">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}