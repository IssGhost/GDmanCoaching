import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaDollarSign, FaUserTie, FaVideo } from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export default function AdminCoaching() {
  const { token } = useAuth();
  const { push } = useToast();
  const [coaches, setCoaches] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [splits, setSplits] = useState(null);

  const load = async () => {
    setCoaches(await api.get("/admin/coaches", token).catch(() => []));
    setSubmissions(await api.get("/admin/submissions", token).catch(() => []));
    setSplits(await api.get("/admin/payment-splits", token).catch(() => []));
  };

  useEffect(() => { load(); }, [token]);

  const stats = useMemo(() => ({
    coaches: coaches?.length || 0,
    pending: coaches?.filter((c) => !c.approved).length || 0,
    submissions: submissions?.length || 0,
    payoutVolume: (splits || []).reduce((sum, split) => sum + (split.recipients || []).reduce((a, r) => a + Number(r.amount || 0), 0), 0),
  }), [coaches, submissions, splits]);

  const updateCoach = async (id, changes) => {
    try {
      await api.put(`/admin/coaches/${id}`, changes, token);
      push("Coach updated.", "success");
      load();
    } catch (e) {
      push(e.message || "Could not update coach", "error");
    }
  };

  if (!coaches || !submissions || !splits) return <div className="min-h-screen bg-black px-6 pt-32 text-gray-400">Loading coaching admin...</div>;

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="font-bold uppercase tracking-[0.2em] text-emerald-300">Admin</p>
          <h1 className="mt-2 text-4xl font-black">Coaching Marketplace Control</h1>
          <p className="mt-2 text-gray-400">Approve coaches, monitor video submissions, and audit split-payment records.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={FaUserTie} label="Coaches" value={stats.coaches} />
          <Stat icon={FaCheckCircle} label="Pending approvals" value={stats.pending} />
          <Stat icon={FaVideo} label="Submissions" value={stats.submissions} />
          <Stat icon={FaDollarSign} label="Tracked payouts" value={`$${stats.payoutVolume.toFixed(2)}`} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <h2 className="text-xl font-bold">Coach approvals</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-left text-gray-300">
                <tr>
                  <th className="px-4 py-3">Coach</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Specialties</th>
                  <th className="px-4 py-3">Fee %</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => (
                  <tr key={coach._id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold">{coach.displayName}</td>
                    <td className="px-4 py-3 text-gray-400">{coach.userId?.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{(coach.specialties || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3">{coach.defaultPlatformFeePercent || 15}%</td>
                    <td className="px-4 py-3">{coach.approved ? "Approved" : "Pending"}{coach.featured ? " • Featured" : ""}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => updateCoach(coach._id, { approved: !coach.approved })} className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">
                          {coach.approved ? "Unapprove" : "Approve"}
                        </button>
                        <button onClick={() => updateCoach(coach._id, { featured: !coach.featured, approved: coach.approved })} className="rounded-lg bg-emerald-400 px-3 py-2 font-bold text-black hover:bg-emerald-300">
                          {coach.featured ? "Unfeature" : "Feature"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold">Recent submissions</h2>
            <div className="mt-4 space-y-3">
              {submissions.slice(0, 8).map((row) => (
                <div key={row._id} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                  <div className="font-bold">{row.title}</div>
                  <div className="text-gray-400">{row.playerId?.email || "Player"} → {row.coachId?.displayName || "Coach"}</div>
                  <div className="mt-1 capitalize text-emerald-300">{row.status.replaceAll("_", " ")}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold">Payment split records</h2>
            <div className="mt-4 space-y-3">
              {splits.slice(0, 8).map((split) => (
                <div key={split._id} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <div className="font-bold capitalize">{split.chargeType.replaceAll("_", " ")}</div>
                    <div className="text-emerald-300">{split.status}</div>
                  </div>
                  <div className="mt-2 text-gray-400">Platform fee: ${Number(split.platformFee || 0).toFixed(2)}</div>
                  <div className="mt-2 space-y-1">
                    {(split.recipients || []).map((r, idx) => (
                      <div key={`${split._id}-${idx}`} className="text-gray-300">{r.label || r.role}: ${Number(r.amount || 0).toFixed(2)} {r.stripeAccountId ? `→ ${r.stripeAccountId}` : ""}</div>
                    ))}
                  </div>
                </div>
              ))}
              {splits.length === 0 && <p className="text-gray-400">No payment splits yet.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
      <Icon className="mb-3 text-2xl text-emerald-300" />
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-3xl font-black">{value}</div>
    </div>
  );
}
