import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaCoins,
  FaDollarSign,
  FaExclamationTriangle,
  FaHeadset,
  FaUserTie,
  FaVideo,
} from "react-icons/fa";
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

  const packageRows = useMemo(() => getCollection(database, "coachingPackages"), [database]);

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

  if (loading || !coaches || !submissions || !splits) {
    return <div className="pp-page min-h-screen px-6 pt-32 text-[#40584f]">Loading marketplace operations...</div>;
  }

  return (
    <div className="pp-page min-h-screen px-6 pt-28 pb-16 text-[#12372a]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] bg-[#12372a] p-7 text-white shadow-xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#c6ff4a]">
                Admin marketplace control
              </p>

              <h1 className="mt-2 text-4xl font-black text-white">Coach operations</h1>

              <p className="mt-2 max-w-2xl text-white/75">
                Approve providers, verify readiness, monitor fulfillment, and review coaching payment records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/admin" className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#12372a]">
                Command center
              </Link>

              <Link to="/admin/orders" className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                Payments
              </Link>

              <Link to="/admin/requests" className="rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white">
                Support
              </Link>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={FaUserTie} label="Coach profiles" value={stats.coaches} />
          <Stat icon={FaCheckCircle} label="Ready for sales" value={stats.ready} attention={stats.ready === 0} />
          <Stat icon={FaExclamationTriangle} label="No paid plans" value={stats.noPaidPlans} attention={stats.noPaidPlans > 0} />
          <Stat icon={FaDollarSign} label="Payout missing" value={stats.payoutMissing} attention={stats.payoutMissing > 0} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={FaCheckCircle} label="Pending approvals" value={stats.pending} attention={stats.pending > 0} />
          <Stat icon={FaVideo} label="Video submissions" value={stats.submissions} />
          <Stat icon={FaClipboardList} label="Payment records" value={stats.records} />
          <Stat icon={FaCoins} label="Package records" value={packageRows.length} />
        </div>

        <section className="rounded-[2rem] border border-[#12372a]/10 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">Coach readiness queue</h2>

              <p className="mt-1 text-sm text-[#40584f]">
                Expand a coach to see exactly why their profile is or is not ready for public sales.
              </p>
            </div>

            <span className="rounded-full bg-[#fff1c7] px-3 py-1 text-xs font-black">
              {stats.pending} pending approval
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {coachesWithReadiness.map((coach) => {
              const readiness = coach.readiness || buildReadiness(coach, coach.packages || []);
              const open = openCoachId === coach._id;

              return (
                <article
                  key={coach._id}
                  className={`rounded-3xl border ${
                    readiness.readyForPublicSales
                      ? "border-[#00a896]/25 bg-[#f3fffd]"
                      : "border-[#ffd166]/50 bg-[#fffdf6]"
                  }`}
                >
                  <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenCoachId(open ? "" : coach._id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <ReadinessBadge ready={readiness.readyForPublicSales} />

                        {coach.approved ? (
                          <Badge label="Approved" tone="green" />
                        ) : (
                          <Badge label="Not approved" tone="yellow" />
                        )}

                        {coach.featured && <Badge label="Featured" tone="blue" />}

                        {!readiness.hasPublicPaidPlans && <Badge label="No paid plans" tone="red" />}

                        {!readiness.payoutSetup && <Badge label="Payout incomplete" tone="yellow" />}
                      </div>

                      <h3 className="mt-2 text-xl font-black text-[#12372a]">
                        {coach.displayName || "Unnamed coach"}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-[#40584f]">
                        {coach.userId?.email || coach.contactEmail || "No email"} •{" "}
                        {(coach.specialties || []).join(", ") || "No specialties listed"}
                      </p>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateCoach(coach._id, { approved: !coach.approved })}
                        className="rounded-full border border-[#12372a]/15 px-3 py-2 text-sm font-black hover:bg-[#eaf9f7]"
                      >
                        {coach.approved ? "Pause profile" : "Approve"}
                      </button>

                      <button
                        onClick={() => updateCoach(coach._id, { featured: !coach.featured, approved: coach.approved })}
                        className="rounded-full bg-[#c6ff4a] px-3 py-2 text-sm font-black"
                      >
                        {coach.featured ? "Unfeature" : "Feature"}
                      </button>

                      <button
                        onClick={() => setOpenCoachId(open ? "" : coach._id)}
                        className="rounded-full border border-[#12372a]/10 bg-white p-3 text-[#12372a] hover:bg-[#fff8e7]"
                        aria-label={open ? "Collapse coach details" : "Expand coach details"}
                      >
                        {open ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-[#12372a]/10 p-5">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <ReadinessCard
                          title="Profile readiness"
                          rows={[
                            ["Approved", readiness.approved],
                            ["Display info complete", readiness.hasProfileInfo],
                            ["Accepting custom inquiries", readiness.acceptingInquiries],
                            ["Ready for public sales", readiness.readyForPublicSales],
                          ]}
                        />

                        <ReadinessCard
                          title="Sales readiness"
                          rows={[
                            ["Has public paid plans", readiness.hasPublicPaidPlans],
                            ["Stripe payout setup", readiness.payoutSetup],
                            ["Active paid plans", readiness.activePaidPlans?.length || 0],
                            ["Draft/free plans", readiness.draftOrFreePlans?.length || 0],
                          ]}
                        />

                        <div className="rounded-2xl border border-[#12372a]/10 bg-white p-4">
                          <h4 className="font-black text-[#12372a]">Admin notes</h4>

                          {readiness.warnings?.length ? (
                            <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-[#7a4d00]">
                              {readiness.warnings.map((warning) => (
                                <li key={warning} className="flex gap-2">
                                  <FaExclamationTriangle className="mt-1 shrink-0" />
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm font-bold text-[#087f73]">
                              This coach has the core pieces needed for public sales.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-[#12372a]/10 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-black text-[#12372a]">Coaching plans</h4>

                          <span className="rounded-full bg-[#eaf9f7] px-3 py-1 text-xs font-black text-[#087f73]">
                            {(coach.packages || []).length} total
                          </span>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {(coach.packages || []).map((pkg) => {
                            const publicPlan = pkg.active && Number(pkg.price || 0) > 0;

                            return (
                              <div key={pkg._id} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h5 className="font-black text-[#12372a]">{pkg.title}</h5>

                                    <p className="mt-1 text-sm font-semibold capitalize text-[#40584f]">
                                      {readable(pkg.reviewType)} • {pkg.turnaroundHours || 72}h turnaround
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <div className="font-black text-[#087f73]">{money(pkg.price)}</div>

                                    <Badge
                                      label={publicPlan ? "Public" : "Draft"}
                                      tone={publicPlan ? "green" : "yellow"}
                                    />
                                  </div>
                                </div>

                                <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-[#40584f]">
                                  {pkg.description || "No description entered."}
                                </p>
                              </div>
                            );
                          })}

                          {!(coach.packages || []).length && (
                            <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f] md:col-span-2">
                              No coaching packages found for this coach.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}

            {!coachesWithReadiness.length && (
              <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f]">
                No coach profiles found.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <OperationsList
            title="Fulfillment monitor"
            description="Recent customer uploads assigned to coaches."
            empty="No submissions need monitoring."
            rows={submissions.slice(0, 8).map((row) => ({
              title: row.title,
              detail: `${row.playerId?.email || "Player"} → ${row.coachId?.displayName || "Coach"}`,
              status: String(row.status || "pending").replaceAll("_", " "),
            }))}
            icon={FaVideo}
          />

          <OperationsList
            title="Payment record monitor"
            description="Recent marketplace payment and payout records."
            empty="No payment records yet."
            rows={splits.slice(0, 8).map((split) => ({
              title: String(split.chargeType || "coaching payment").replaceAll("_", " "),
              detail: `${(split.recipients || []).length} payout recipient(s)`,
              status: split.status || "pending",
            }))}
            icon={FaCoins}
          />
        </section>

        <section className="rounded-[2rem] border border-[#12372a]/10 bg-[#eaf9f7] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FaHeadset className="text-2xl text-[#087f73]" />

              <div>
                <h2 className="font-black">Need to resolve a customer issue?</h2>

                <p className="text-sm text-[#40584f]">Use the support inbox for account and service questions.</p>
              </div>
            </div>

            <Link to="/admin/requests" className="pp-btn-primary px-4 py-2 text-sm">
              Open support inbox
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, attention = false }) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        attention ? "border-[#ffd166] bg-[#fff1c7]" : "border-[#12372a]/10 bg-white"
      }`}
    >
      <Icon className="mb-3 text-2xl text-[#087f73]" />

      <div className="text-xs font-black uppercase tracking-wider text-[#5f746c]">{label}</div>

      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  );
}

function OperationsList({ title, description, empty, rows, icon: Icon }) {
  return (
    <article className="rounded-[2rem] border border-[#12372a]/10 bg-white p-6 shadow-lg">
      <div className="flex gap-3">
        <Icon className="mt-1 text-xl text-[#087f73]" />

        <div>
          <h2 className="text-xl font-black">{title}</h2>

          <p className="text-sm text-[#40584f]">{description}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row, index) => (
          <div key={`${row.title}-${index}`} className="rounded-2xl border border-[#12372a]/10 bg-[#fffdf6] p-4">
            <div className="flex justify-between gap-3">
              <div className="font-black capitalize">{row.title}</div>

              <span className="shrink-0 rounded-full bg-[#eaf9f7] px-2 py-1 text-xs font-black capitalize text-[#087f73]">
                {row.status}
              </span>
            </div>

            <div className="mt-1 text-sm text-[#40584f]">{row.detail}</div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-2xl bg-[#eaf9f7] p-4 text-sm font-semibold text-[#40584f]">{empty}</div>
        )}
      </div>
    </article>
  );
}

function ReadinessBadge({ ready }) {
  return ready ? (
    <span className="rounded-full bg-[#c6ff4a] px-3 py-1 text-xs font-black uppercase text-[#12372a]">
      Ready for public sales
    </span>
  ) : (
    <span className="rounded-full bg-[#ffebe5] px-3 py-1 text-xs font-black uppercase text-[#7a2b18]">
      Needs attention
    </span>
  );
}

function Badge({ label, tone = "green" }) {
  const cls =
    tone === "green"
      ? "bg-[#d9f7db] text-[#12552f]"
      : tone === "blue"
      ? "bg-[#d9f7fb] text-[#087f73]"
      : tone === "red"
      ? "bg-[#ffebe5] text-[#7a2b18]"
      : "bg-[#fff1c7] text-[#7a4d00]";

  return <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>{label}</span>;
}

function ReadinessCard({ title, rows }) {
  return (
    <div className="rounded-2xl border border-[#12372a]/10 bg-white p-4">
      <h4 className="font-black text-[#12372a]">{title}</h4>

      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => {
          const isBool = typeof value === "boolean";

          return (
            <div key={label} className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbf9] px-3 py-2">
              <span className="text-sm font-bold text-[#40584f]">{label}</span>

              {isBool ? (
                value ? (
                  <span className="font-black text-[#087f73]">Yes</span>
                ) : (
                  <span className="font-black text-[#b94024]">No</span>
                )
              ) : (
                <span className="font-black text-[#12372a]">{value}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}