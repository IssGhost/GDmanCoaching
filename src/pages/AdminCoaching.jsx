import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClipboardList, FaCoins, FaHeadset, FaUserTie, FaVideo } from "react-icons/fa";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

function safeId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function readable(value) {
  return String(value || "").replaceAll("_", " ");
}

function getCollection(database, key) {
  const collection = database?.collections?.find((item) => item.key === key);
  return Array.isArray(collection?.rows) ? collection.rows : [];
}

function buildReadiness(coach, packages) {
  const activePaidPlans = packages.filter((pkg) => pkg.active && Number(pkg.price || 0) > 0);
  const draftOrFreePlans = packages.filter((pkg) => !pkg.active || Number(pkg.price || 0) <= 0);

  const approved = Boolean(coach.approved);
  const hasProfileInfo = Boolean(coach.displayName && coach.headline && coach.bio);
  const hasPublicPaidPlans = activePaidPlans.length > 0;
  const acceptingInquiries = coach.acceptingInquiries !== false;
  const payoutSetup = Boolean(coach.stripeAccountId || coach.stripeOnboardingComplete || coach.payoutsEnabled);

  const warnings = [
    !approved ? "Not approved by admin." : null,
    !hasProfileInfo ? "Missing display name, headline, or biography." : null,
    !hasPublicPaidPlans ? "No active paid buy-now plans." : null,
    !acceptingInquiries ? "Not accepting custom inquiries." : null,
    !payoutSetup ? "Stripe payout setup incomplete. Mock testing can still continue." : null,
  ].filter(Boolean);

  return {
    approved,
    hasProfileInfo,
    hasPublicPaidPlans,
    acceptingInquiries,
    payoutSetup,
    activePaidPlans,
    draftOrFreePlans,
    readyForPublicSales: approved && hasProfileInfo && hasPublicPaidPlans,
    warnings,
  };
}

export default function AdminCoaching() {
  const { token } = useAuth();
  const { push } = useToast();

  const [coaches, setCoaches] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [splits, setSplits] = useState(null);
  const [database, setDatabase] = useState(null);
  const [openCoachId, setOpenCoachId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const [coachRows, submissionRows, splitRows, databaseRows] = await Promise.all([
        api.get("/admin/coaches", token).catch(() => []),
        api.get("/admin/submissions", token).catch(() => []),
        api.get("/admin/payment-splits", token).catch(() => []),
        api.get("/admin/database?limit=500", token).catch(() => null),
      ]);

      setCoaches(Array.isArray(coachRows) ? coachRows : []);
      setSubmissions(Array.isArray(submissionRows) ? submissionRows : []);
      setSplits(Array.isArray(splitRows) ? splitRows : []);
      setDatabase(databaseRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stats = useMemo(() => ({
    coaches: coaches?.length || 0,
    pending: coaches?.filter((c) => !c.approved).length || 0,
    submissions: submissions?.length || 0,
    records: splits?.length || 0,
  }), [coaches, submissions, splits]);

  const coachesWithReadiness = useMemo(() => {
    const rows = coaches || [];

    return rows.map((coach) => {
      const packages = packageRows.filter((pkg) => safeId(pkg.coachId) === safeId(coach._id));
      const readiness = coach.readiness || buildReadiness(coach, packages);

      return {
        ...coach,
        packages,
        readiness,
      };
    });
  }, [coaches, packageRows]);

  const stats = useMemo(() => {
    const ready = coachesWithReadiness.filter((coach) => coach.readiness?.readyForPublicSales).length;
    const noPaidPlans = coachesWithReadiness.filter((coach) => !coach.readiness?.hasPublicPaidPlans).length;
    const payoutMissing = coachesWithReadiness.filter((coach) => !coach.readiness?.payoutSetup).length;

    return {
      coaches: coachesWithReadiness.length || 0,
      pending: coachesWithReadiness.filter((c) => !c.approved).length || 0,
      ready,
      noPaidPlans,
      payoutMissing,
      submissions: submissions?.length || 0,
      records: splits?.length || 0,
    };
  }, [coachesWithReadiness, submissions, splits]);

  const updateCoach = async (id, changes) => {
    try {
      await api.put(`/admin/coaches/${id}`, changes, token);
      push("Coach updated.", "success");
      load();
    } catch (e) {
      push(e.message || "Could not update coach", "error");
    }
  };

  if (!coaches || !submissions || !splits) return <div className="pp-page min-h-screen px-6 pt-32 text-[#40584f]">Loading marketplace operations...</div>;

  return (
    <div className="pp-page min-h-screen px-6 pt-28 pb-16 text-[#12372a]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-[#12372a] p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#c6ff4a]">Admin marketplace control</p><h1 className="mt-2 text-4xl font-black text-white">Coach operations</h1><p className="mt-2 max-w-2xl text-white/75">Approve providers, monitor fulfillment, and investigate coaching activity without entering customer booking flows.</p></div>
            <div className="flex flex-wrap gap-2"><Link to="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#12372a]">Command center</Link><Link to="/admin/orders" className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">Payments</Link><Link to="/admin/requests" className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">Support</Link></div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={FaUserTie} label="Coach profiles" value={stats.coaches} />
          <Stat icon={FaCheckCircle} label="Pending approvals" value={stats.pending} attention={stats.pending > 0} />
          <Stat icon={FaVideo} label="Video submissions" value={stats.submissions} />
          <Stat icon={FaClipboardList} label="Payment records" value={stats.records} />
        </div>

        <section className="rounded-[2rem] border border-[#12372a]/10 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black">Coach approval queue</h2><p className="mt-1 text-sm text-[#40584f]">Approve complete applications and feature profiles that are ready for customers.</p></div><span className="rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-black">{stats.pending} pending</span></div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm"><thead className="bg-[#eaf9f7] text-left text-[#40584f]"><tr><th className="px-4 py-3">Coach</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Specialties</th><th className="px-4 py-3">DUPR</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead>
              <tbody>{coaches.map((coach) => <tr key={coach._id} className="border-t border-[#12372a]/10"><td className="px-4 py-4 font-black">{coach.displayName}</td><td className="px-4 py-4 text-[#40584f]">{coach.userId?.email || "—"}</td><td className="px-4 py-4 text-[#40584f]">{(coach.specialties || []).join(", ") || "—"}</td><td className="px-4 py-4">{coach.duprId || "—"}</td><td className="px-4 py-4 font-bold">{coach.approved ? "Approved" : "Pending"}{coach.featured ? " • Featured" : ""}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button onClick={() => updateCoach(coach._id, { approved: !coach.approved })} className="rounded-full border border-[#12372a]/15 px-3 py-2 font-black hover:bg-[#eaf9f7]">{coach.approved ? "Pause profile" : "Approve"}</button><button onClick={() => updateCoach(coach._id, { featured: !coach.featured, approved: coach.approved })} className="rounded-full bg-[#c6ff4a] px-3 py-2 font-black">{coach.featured ? "Unfeature" : "Feature"}</button></div></td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <OperationsList title="Fulfillment monitor" description="Recent customer uploads assigned to coaches." empty="No submissions need monitoring." rows={submissions.slice(0, 8).map((row) => ({ title: row.title, detail: `${row.playerId?.email || "Player"} → ${row.coachId?.displayName || "Coach"}`, status: String(row.status || "pending").replaceAll("_", " ") }))} icon={FaVideo} />
          <OperationsList title="Payment record monitor" description="Recent marketplace payment and payout records." empty="No payment records yet." rows={splits.slice(0, 8).map((split) => ({ title: String(split.chargeType || "coaching payment").replaceAll("_", " "), detail: `${(split.recipients || []).length} payout recipient(s)`, status: split.status || "pending" }))} icon={FaCoins} />
        </section>

        <section className="rounded-[2rem] border border-[#12372a]/10 bg-[#eaf9f7] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><FaHeadset className="text-2xl text-[#087f73]"/><div><h2 className="font-black">Need to resolve a customer issue?</h2><p className="text-sm text-[#40584f]">Use the support inbox for account and service questions.</p></div></div><Link to="/admin/requests" className="pp-btn-primary px-4 py-2 text-sm">Open support inbox</Link></div></section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, attention = false }) {
  return <div className={`rounded-3xl border p-5 shadow-sm ${attention ? "border-[#ffd166] bg-[#fff1c7]" : "border-[#12372a]/10 bg-white"}`}><Icon className="mb-3 text-2xl text-[#087f73]"/><div className="text-xs font-black uppercase tracking-wider text-[#5f746c]">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>;
}

function OperationsList({ title, description, empty, rows, icon: Icon }) {
  return <article className="rounded-[2rem] border border-[#12372a]/10 bg-white p-6 shadow-lg"><div className="flex gap-3"><Icon className="mt-1 text-xl text-[#087f73]"/><div><h2 className="text-xl font-black">{title}</h2><p className="text-sm text-[#40584f]">{description}</p></div></div><div className="mt-5 space-y-3">{rows.map((row, index) => <div key={`${row.title}-${index}`} className="rounded-2xl border border-[#12372a]/10 bg-[#fffdf6] p-4"><div className="flex justify-between gap-3"><div className="font-black capitalize">{row.title}</div><span className="shrink-0 rounded-full bg-[#eaf9f7] px-2 py-1 text-xs font-black capitalize text-[#087f73]">{row.status}</span></div><div className="mt-1 text-sm text-[#40584f]">{row.detail}</div></div>)}{rows.length === 0 && <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f]">{empty}</div>}</div></article>;
}
