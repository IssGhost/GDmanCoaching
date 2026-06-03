import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarCheck,
  FaCheckCircle,
  FaCopy,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaUsers,
} from "react-icons/fa";

const defaultRecipients = [
  { id: "lead", label: "Lead Coach", role: "main_coach", percentage: 65 },
  { id: "assistant", label: "Assistant Coach", role: "assistant_coach", percentage: 20 },
  { id: "collaborator", label: "Collaborating Coach", role: "coach", percentage: 15 },
];

const roleOptions = [
  ["main_coach", "Main coach"],
  ["assistant_coach", "Assistant coach"],
  ["collaborator", "Collaborating coach"],
  ["club", "Club partner"],
  ["other", "Other recipient"],
];

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function buildShareText(session, totals, recipients) {
  const rows = recipients
    .map((row) => `${row.label}: ${row.percentage}% (${money(row.amount)})`)
    .join("\n");

  return [
    `Shared Pickleball Coaching Session`,
    `Session: ${session.title}`,
    `Customer: ${session.customerName}`,
    `Location: ${session.location}`,
    `Date: ${session.date || "TBD"}`,
    `Total charge: ${money(session.totalCharge)}`,
    `Platform fee: ${money(totals.platformFee)}`,
    `Collaborator allocation: ${money(totals.distributable)}`,
    ``,
    `Payout split:`,
    rows,
  ].join("\n");
}

export default function CoachSessionSplit() {
  const [session, setSession] = useState({
    title: "Saturday Doubles Consultation",
    customerName: "Casey Customer",
    packageType: "Group Consultation",
    location: "Round Rock Outdoor Courts",
    date: new Date().toISOString().slice(0, 10),
    totalCharge: 240,
    platformFeePercent: 15,
    notes: "Small-group doubles consultation with one lead coach, assistant coach, and online partner split.",
  });

  const [recipients, setRecipients] = useState(defaultRecipients);
  const [createdSessions, setCreatedSessions] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("picklepro_shared_sessions") || "[]");
      if (Array.isArray(saved)) setCreatedSessions(saved);
    } catch {
      setCreatedSessions([]);
    }
  }, []);

  const totals = useMemo(() => {
    const totalCharge = Number(session.totalCharge || 0);
    const platformFeePercent = Number(session.platformFeePercent || 0);
    const platformFee = totalCharge * (platformFeePercent / 100);
    const distributable = Math.max(0, totalCharge - platformFee);
    const recipientPercent = recipients.reduce((sum, row) => sum + Number(row.percentage || 0), 0);
    const recipientTotal = recipients.reduce((sum, row) => sum + distributable * (Number(row.percentage || 0) / 100), 0);

    return {
      totalCharge,
      platformFeePercent,
      platformFee,
      distributable,
      recipientPercent,
      recipientTotal,
      remainingPercent: 100 - recipientPercent,
    };
  }, [session, recipients]);

  const recipientsWithAmounts = useMemo(() => {
    return recipients.map((row) => ({
      ...row,
      amount: totals.distributable * (Number(row.percentage || 0) / 100),
    }));
  }, [recipients, totals.distributable]);

  const splitIsValid = Math.abs(totals.recipientPercent - 100) < 0.001;

  const updateRecipient = (id, key, value) => {
    setRecipients((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const addRecipient = () => {
    setRecipients((current) => [
      ...current,
      {
        id: `recipient-${Date.now()}`,
        label: "New Recipient",
        role: "other",
        percentage: 0,
      },
    ]);
  };

  const removeRecipient = (id) => {
    setRecipients((current) => current.filter((row) => row.id !== id));
  };

  const saveSession = () => {
    const record = {
      id: `split-${Date.now()}`,
      createdAt: new Date().toISOString(),
      session,
      totals,
      recipients: recipientsWithAmounts,
      status: splitIsValid ? "Ready" : "Needs adjustment",
    };

    const next = [record, ...createdSessions].slice(0, 6);
    setCreatedSessions(next);
    localStorage.setItem("picklepro_shared_sessions", JSON.stringify(next));
  };

  const copyShare = async () => {
    const text = buildShareText(session, totals, recipientsWithAmounts);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-7xl">
        <Link to="/coaches" className="text-sm font-black text-[#087f73] hover:underline">
          ← Back to coaches
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="pp-kicker">Shared coaching session</p>

            <h1 className="mt-2 text-4xl font-black text-[#12372a] md:text-6xl">
              Create an online coaching collaboration record.
            </h1>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#5f746c]">
              Use this when an online coaching request, strategy consultation, or training plan involves more than one coach collaborator.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/78 p-5 shadow-xl shadow-[#12372a]/10 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-3">
              <Summary label="Customer charge" value={money(totals.totalCharge)} icon={<FaMoneyBillWave />} />
              <Summary label="Platform fee" value={money(totals.platformFee)} icon={<FaExchangeAlt />} />
              <Summary label="Recipient split" value={`${totals.recipientPercent.toFixed(0)}%`} icon={<FaUsers />} valid={splitIsValid} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur">
          <h2 className="text-2xl font-black text-[#12372a]">Session details</h2>

          <div className="mt-5 grid gap-4">
            <Field label="Session title">
              <input className="pp-input px-4 py-3" value={session.title} onChange={(e) => setSession((s) => ({ ...s, title: e.target.value }))} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name">
                <input className="pp-input px-4 py-3" value={session.customerName} onChange={(e) => setSession((s) => ({ ...s, customerName: e.target.value }))} />
              </Field>

              <Field label="Package type">
                <select className="pp-input px-4 py-3" value={session.packageType} onChange={(e) => setSession((s) => ({ ...s, packageType: e.target.value }))}>
                  <option>Online Coaching Request</option>
                  <option>Group Consultation</option>
                  <option>Hybrid Training</option>
                  <option>Tournament Prep</option>
                  <option>Collaborator Event</option>
                  <option>Video Review Bundle</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location">
                <input className="pp-input px-4 py-3" value={session.location} onChange={(e) => setSession((s) => ({ ...s, location: e.target.value }))} />
              </Field>

              <Field label="Date">
                <input type="date" className="pp-input px-4 py-3" value={session.date} onChange={(e) => setSession((s) => ({ ...s, date: e.target.value }))} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total customer charge">
                <input type="number" min="0" step="0.01" className="pp-input px-4 py-3" value={session.totalCharge} onChange={(e) => setSession((s) => ({ ...s, totalCharge: Number(e.target.value) }))} />
              </Field>

              <Field label="Platform fee %">
                <input type="number" min="0" max="100" step="0.1" className="pp-input px-4 py-3" value={session.platformFeePercent} onChange={(e) => setSession((s) => ({ ...s, platformFeePercent: Number(e.target.value) }))} />
              </Field>
            </div>

            <Field label="Session notes">
              <textarea rows={4} className="pp-input px-4 py-3" value={session.notes} onChange={(e) => setSession((s) => ({ ...s, notes: e.target.value }))} />
            </Field>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-black text-[#12372a]">Payout recipients</h2>
              <p className="mt-1 text-sm text-[#5f746c]">Percentages divide the amount left after the platform fee.</p>
            </div>

            <button onClick={addRecipient} className="pp-btn-secondary px-4 py-2 text-sm">
              <FaPlus className="mr-2" /> Add recipient
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {recipientsWithAmounts.map((row) => (
              <div key={row.id} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_120px_auto] md:items-end">
                  <Field label="Recipient">
                    <input className="pp-input px-3 py-2" value={row.label} onChange={(e) => updateRecipient(row.id, "label", e.target.value)} />
                  </Field>

                  <Field label="Role">
                    <select className="pp-input px-3 py-2" value={row.role} onChange={(e) => updateRecipient(row.id, "role", e.target.value)}>
                      {roleOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Split %">
                    <input type="number" min="0" max="100" step="0.1" className="pp-input px-3 py-2" value={row.percentage} onChange={(e) => updateRecipient(row.id, "percentage", Number(e.target.value))} />
                  </Field>

                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.12em] text-[#087f73]">Amount</div>
                    <div className="mt-1 rounded-xl bg-white/80 px-3 py-2 text-sm font-black text-[#12372a]">{money(row.amount)}</div>
                  </div>

                  <button onClick={() => removeRecipient(row.id)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#ff7b54]/20 bg-[#ff7b54]/10 text-[#b94024] hover:bg-[#ff7b54]/15" title="Remove recipient">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-5 rounded-2xl p-4 text-sm font-bold ${splitIsValid ? "border border-[#00a896]/20 bg-[#d9f7fb]/70 text-[#087f73]" : "border border-[#ff7b54]/25 bg-[#ff7b54]/10 text-[#b94024]"}`}>
            {splitIsValid
              ? "Split is balanced at 100%. This session is ready to share."
              : `Split must equal 100%. Current split is ${totals.recipientPercent.toFixed(1)}%, leaving ${totals.remainingPercent.toFixed(1)}%.`}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-[#12372a]/10 bg-gradient-to-br from-[#fffef8] via-[#d9f7fb] to-[#fff1c7] p-6 shadow-xl shadow-[#12372a]/10">
          <h2 className="text-2xl font-black text-[#12372a]">Collaboration preview</h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#12372a]/10 bg-white/78">
            <PreviewRow label="Customer charge" value={money(totals.totalCharge)} />
            <PreviewRow label={`Platform fee (${totals.platformFeePercent}%)`} value={money(totals.platformFee)} />
            <PreviewRow label="Amount available for recipients" value={money(totals.distributable)} strong />

            {recipientsWithAmounts.map((row) => (
              <PreviewRow key={row.id} label={`${row.label} (${row.percentage}%)`} value={money(row.amount)} />
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={saveSession} className="pp-btn-primary px-5 py-3">
              <FaCheckCircle className="mr-2" /> Create Shared Session
            </button>

            <button onClick={copyShare} className="pp-btn-secondary px-5 py-3">
              <FaCopy className="mr-2" /> {copied ? "Copied" : "Copy Summary"}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur">
          <h2 className="text-2xl font-black text-[#12372a]">Created sessions</h2>
          <p className="mt-1 text-sm leading-6 text-[#5f746c]">
            Recently created shared sessions are saved in this browser for quick review.
          </p>

          <div className="mt-5 grid gap-3">
            {createdSessions.length === 0 ? (
              <div className="rounded-2xl bg-[#fff8e7] p-4 text-sm text-[#5f746c]">No shared sessions created yet.</div>
            ) : (
              createdSessions.map((record) => (
                <div key={record.id} className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-black text-[#12372a]">{record.session.title}</div>
                      <div className="mt-1 text-sm text-[#5f746c]">{record.session.customerName} • {record.session.packageType}</div>
                    </div>

                    <span className="rounded-full bg-[#c6ff4a] px-3 py-1 text-xs font-black text-[#12372a]">{record.status}</span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-[#5f746c] sm:grid-cols-2">
                    <div>Total: <b className="text-[#12372a]">{money(record.totals.totalCharge)}</b></div>
                    <div>Recipient allocation: <b className="text-[#12372a]">{money(record.totals.distributable)}</b></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur">
        <h2 className="text-2xl font-black text-[#12372a]">Where this fits in the coaching flow</h2>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <FlowStep icon={<FaCalendarCheck />} title="Book" text="Customer requests a review, consultation, or training plan." />
          <FlowStep icon={<FaMoneyBillWave />} title="Charge" text="The full session amount is recorded as the customer charge." />
          <FlowStep icon={<FaExchangeAlt />} title="Split" text="The collaboration record is divided between the main coach and any assisting coaches." />
          <FlowStep icon={<FaCheckCircle />} title="Track" text="The session and split can be reviewed by the coach or admin." />
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-[#087f73]">{label}</span>
      {children}
    </label>
  );
}

function Summary({ icon, label, value, valid = true }) {
  return (
    <div className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-4">
      <div className={`mb-2 text-2xl ${valid ? "text-[#00a896]" : "text-[#ff7b54]"}`}>{icon}</div>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-[#087f73]">{label}</div>
      <div className="mt-1 text-xl font-black text-[#12372a]">{value}</div>
    </div>
  );
}

function PreviewRow({ label, value, strong = false }) {
  return (
    <div className={`grid grid-cols-2 border-b border-[#12372a]/10 px-4 py-3 text-sm last:border-b-0 ${strong ? "bg-[#c6ff4a]/25" : ""}`}>
      <span className="font-bold text-[#5f746c]">{label}</span>
      <span className="text-right font-black text-[#12372a]">{value}</span>
    </div>
  );
}

function FlowStep({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-[#12372a]/10 bg-[#fff8e7] p-5">
      <div className="mb-3 text-2xl text-[#00a896]">{icon}</div>
      <h3 className="font-black text-[#12372a]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5f746c]">{text}</p>
    </div>
  );
}