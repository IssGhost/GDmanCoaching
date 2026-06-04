import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaChevronRight,
  FaComments,
  FaEnvelope,
  FaPaperPlane,
  FaReceipt,
  FaTimes,
} from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const emptyQuoteForm = {
  amount: "",
  discountPercent: 0,
  scope: "",
  deliverables: "",
  turnaround: "",
  uploadInstructions: "",
};

function userIdOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusLabel(value) {
  return String(value || "open").replaceAll("_", " ");
}

function buildScopeText(form) {
  const sections = [
    form.scope?.trim() ? `Scope of work:\n${form.scope.trim()}` : "",
    form.deliverables?.trim() ? `Deliverables included:\n${form.deliverables.trim()}` : "",
    form.turnaround?.trim() ? `Turnaround time:\n${form.turnaround.trim()}` : "",
    form.uploadInstructions?.trim() ? `What the customer should upload:\n${form.uploadInstructions.trim()}` : "",
  ];

  return sections.filter(Boolean).join("\n\n").trim();
}

function quoteStatusFor(row) {
  if (row?.quote?.status && row.quote.status !== "draft") return row.quote.status;
  return row?.status || "open";
}

export default function Messages({ embedded = false }) {
  const { token, user } = useAuth();
  const { push } = useToast();

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState(emptyQuoteForm);
  const [declineMessage, setDeclineMessage] = useState(
    "I declined this quote. Please revise the amount, scope, or deliverables so we can discuss it further."
  );
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    setLoadError("");

    const data = await api.get("/inquiries/my", token);
    const list = Array.isArray(data) ? data : [];

    setRows(list);

    setSelected((current) => {
      if (!list.length) return null;
      if (!current?._id) return list[0];
      return list.find((item) => item._id === current._id) || list[0];
    });
  };

  useEffect(() => {
    load().catch((error) => {
      setLoadError(error.message || "Could not load conversations.");
      push(error.message || "Could not load conversations.", "error");
    });

    const interval = window.setInterval(() => load().catch(() => {}), 7000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!selected) {
      setQuote(emptyQuoteForm);
      return;
    }

    if (selected.quote?.status && selected.quote.status !== "draft") {
      setQuote({
        amount: selected.quote.amount || "",
        discountPercent: selected.quote.discountPercent || 0,
        scope: selected.quote.scope || "",
        deliverables: "",
        turnaround: "",
        uploadInstructions: "",
      });
    } else {
      setQuote(emptyQuoteForm);
    }
  }, [selected?._id]);

  const isCoach = useMemo(() => {
    const currentUserId = userIdOf(user?._id || user?.id);
    const coachUserId = userIdOf(selected?.coachId?.userId?._id || selected?.coachId?.userId);
    return Boolean(selected && currentUserId && coachUserId && currentUserId === coachUserId);
  }, [selected, user]);

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";
  const canSendQuote = isCoach || isAdmin;

  const openCount = rows.filter((row) => ["open", "quoted"].includes(row.status)).length;
  const sentQuotes = rows.filter((row) => row.quote?.status === "sent").length;
  const approvedQuotes = rows.filter((row) => row.quote?.status === "approved").length;

  const selectedCustomerName = selected?.playerId?.fullName || selected?.playerId?.email || "Customer";
  const selectedCoachName = selected?.coachId?.displayName || "Coach";

  const runAction = async (fn) => {
    setBusy(true);

    try {
      await fn();
    } catch (error) {
      push(error.message || "That action could not be completed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const send = () =>
    runAction(async () => {
      if (!message.trim() || !selected) return;

      const row = await api.post(`/inquiries/${selected._id}/messages`, { message }, token);
      setSelected(row);
      setMessage("");
      await load();
    });

  const sendQuote = () =>
    runAction(async () => {
      if (!selected) return;

      const amount = Number(quote.amount || 0);
      const finalScope = buildScopeText(quote);

      if (!Number.isFinite(amount) || amount <= 0) {
        push("Enter the final quote amount before sending.", "error");
        return;
      }

      if (!finalScope) {
        push("Explain the scope, deliverables, turnaround, or upload instructions before sending the quote.", "error");
        return;
      }

      const row = await api.post(
        `/inquiries/${selected._id}/quote`,
        {
          amount,
          discountPercent: Number(quote.discountPercent || 0),
          scope: finalScope,
        },
        token
      );

      setSelected(row);
      push("Quote sent for customer approval.", "success");
      await load();
    });

  const approve = () =>
    runAction(async () => {
      if (!selected) return;

      const result = await api.post(`/inquiries/${selected._id}/quote/approve`, {}, token);
      setSelected(result.inquiry);
      push(result.paymentNextStep || "Quote approved. You can now continue to secure checkout.", "success");
      await load();
    });

  const decline = () =>
    runAction(async () => {
      if (!selected) return;

      const row = await api.post(
        `/inquiries/${selected._id}/quote/decline`,
        {
          message:
            declineMessage ||
            "I declined this quote. Please revise it or message me so we can discuss the scope.",
        },
        token
      );

      setSelected(row);
      push("Quote declined. The coach can revise and resend it.", "success");
      await load();
    });

  const payQuote = () =>
    runAction(async () => {
      if (!selected) return;

      const result = await api.post(`/payments/quotes/${selected._id}/checkout`, {}, token);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.submission?._id) {
        window.location.href = `/dashboard/submissions/${result.submission._id}`;
      } else {
        push("Checkout started.", "success");
      }
    });

  return (
    <div className={embedded ? "" : "pp-page min-h-screen px-6 pt-28 pb-16"}>
      <div className={embedded ? "" : "mx-auto max-w-7xl"}>
        <header className="mb-6 rounded-[2rem] bg-[#12372a] p-7 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#c6ff4a]">
            Personalized requests
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Coach conversations & custom quotes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#dce9e3]">
                Use this page to discuss custom coaching work. Customers do not pay until a coach sends a final quote
                and the customer approves it.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Metric label="Open conversations" value={openCount} />
              <Metric label="Quotes to review" value={sentQuotes} />
              <Metric label="Approved quotes" value={approvedQuotes} />
            </div>
          </div>
        </header>

        {loadError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {loadError}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="rounded-3xl border border-[#12372a]/10 bg-white p-4 shadow-lg">
            <h2 className="mb-3 flex items-center gap-2 font-black text-[#12372a]">
              <FaComments /> Conversations
            </h2>

            {rows.length ? (
              rows.map((row) => {
                const coachView =
                  userIdOf(row.coachId?.userId?._id || row.coachId?.userId) === userIdOf(user?._id || user?.id);
                const active = selected?._id === row._id;

                return (
                  <button
                    key={row._id}
                    onClick={() => setSelected(row)}
                    className={`mb-2 w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#00a896] bg-[#eaf9f7] shadow-sm"
                        : "border-[#12372a]/10 bg-white hover:bg-[#fff8e7]"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <b className="text-[#12372a]">
                        {coachView
                          ? row.playerId?.fullName || row.playerId?.email || "Customer"
                          : row.coachId?.displayName || "Coach"}
                      </b>

                      <Status value={quoteStatusFor(row)} />
                    </div>

                    <div className="mt-1 text-sm font-semibold text-[#40584f]">
                      {row.subject}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {(row.requestedServices || []).slice(0, 3).map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#087f73]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#5f746c]">
                      Open details <FaChevronRight />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl bg-[#fff8e7] p-5 text-sm leading-6 text-[#40584f]">
                Open any coach profile and choose <b>Custom Quote Request</b> to start a conversation.
              </div>
            )}
          </aside>

          <main className="rounded-3xl border border-[#12372a]/10 bg-white p-5 shadow-lg">
            {selected ? (
              <>
                <div className="flex flex-wrap justify-between gap-3 border-b border-[#12372a]/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#12372a]">{selected.subject}</h2>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-[#087f73]">
                      <span>Customer: {selectedCustomerName}</span>
                      <span>•</span>
                      <span>Coach: {selectedCoachName}</span>
                    </div>

                    <span className="mt-2 inline-block text-sm font-bold text-[#087f73]">
                      {selected.coachId?.presenceStatus === "online"
                        ? "● Coach online now"
                        : "○ Coach offline — messages are saved"}
                    </span>
                  </div>

                  {selected.coachId?.contactEmail && (
                    <a href={`mailto:${selected.coachId.contactEmail}`} className="pp-btn-secondary px-4 py-2">
                      <FaEnvelope className="mr-2" />
                      Email coach
                    </a>
                  )}
                </div>

                {!!selected.requestedServices?.length && (
                  <section className="mt-4 rounded-2xl border border-[#00a896]/20 bg-[#eaf9f7] p-4">
                    <div className="text-xs font-black uppercase tracking-[.15em] text-[#087f73]">
                      Requested services
                    </div>

                    <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">
                      These are the services the customer selected when starting the custom request.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {selected.requestedServices.map((service) => (
                        <span
                          key={service}
                          className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#12372a]"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-4 rounded-2xl border border-[#12372a]/10 bg-[#fffdf6] p-4">
                  <h3 className="font-black text-[#12372a]">How this custom quote works</h3>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <MiniStep number="1" title="Discuss details" text="Use chat to clarify goals, timeline, and video needs." />
                    <MiniStep number="2" title="Coach sends quote" text="The quote should include price, scope, deliverables, and turnaround." />
                    <MiniStep number="3" title="Approve then pay" text="The customer only pays after approving the quote." />
                  </div>
                </section>

                <div className="my-5 max-h-96 space-y-3 overflow-auto rounded-2xl bg-[#f8fbf9] p-3">
                  {(selected.messages || []).map((item) => {
                    const ownMessage = userIdOf(item.senderId) === userIdOf(user?._id || user?.id);

                    return (
                      <div
                        key={item._id}
                        className={`rounded-2xl p-4 ${ownMessage ? "ml-8 bg-[#d9f7fb]" : "mr-8 bg-white shadow-sm"}`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[#12372a]">{item.body}</p>

                        {item.createdAt && (
                          <div className="mt-2 text-[11px] font-bold text-[#5f746c]">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!selected.messages?.length && (
                    <div className="rounded-2xl bg-white p-4 text-sm font-semibold text-[#40584f]">
                      No messages yet.
                    </div>
                  )}
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-[#12372a]">Send a message</span>

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="pp-input px-4 py-3"
                      placeholder="Ask about goals, deliverables, timing, what video to upload, or what should be included in the quote."
                    />
                  </label>

                  <button
                    onClick={send}
                    disabled={busy || !message.trim()}
                    className="pp-btn-primary self-end px-5 py-4 disabled:opacity-60"
                    title="Send message"
                  >
                    <FaPaperPlane />
                  </button>
                </div>

                {selected.quote?.status && selected.quote.status !== "draft" && (
                  <section className="mt-5 rounded-2xl border border-[#00a896]/30 bg-[#d9f7fb] p-5 text-[#12372a]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xl font-black">
                        <FaReceipt className="mr-2 inline" />
                        Custom quote: {money(selected.quote.amount)}
                      </h3>

                      <Status value={selected.quote.status} />
                    </div>

                    {selected.quote.discountPercent > 0 && (
                      <p className="mt-1 text-sm font-bold text-[#087f73]">
                        Includes {selected.quote.discountPercent}% package discount.
                      </p>
                    )}

                    <div className="mt-4 rounded-2xl bg-white/80 p-4">
                      <div className="text-xs font-black uppercase tracking-[.15em] text-[#087f73]">
                        Scope, deliverables, and instructions
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#12372a]">
                        {selected.quote.scope || "No scope details were added to this quote."}
                      </p>
                    </div>

                    {!canSendQuote && selected.quote.status === "sent" && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-[#12372a]/10 bg-white/70 p-4 text-sm font-bold leading-6 text-[#40584f]">
                          Review the amount and scope before approving. Once approved, the payment button will unlock.
                        </div>

                        <textarea
                          value={declineMessage}
                          onChange={(e) => setDeclineMessage(e.target.value)}
                          rows={3}
                          className="pp-input px-4 py-3"
                          placeholder="Optional: explain what should change if you decline."
                        />

                        <div className="flex flex-wrap gap-3">
                          <button onClick={approve} disabled={busy} className="pp-btn-primary px-4 py-2">
                            <FaCheck className="mr-2" />
                            Approve quote
                          </button>

                          <button onClick={decline} disabled={busy} className="pp-btn-secondary px-4 py-2">
                            <FaTimes className="mr-2" />
                            Decline and request changes
                          </button>
                        </div>
                      </div>
                    )}

                    {!canSendQuote && selected.quote.status === "approved" && (
                      <button onClick={payQuote} disabled={busy} className="pp-btn-primary mt-4 px-4 py-2">
                        Pay approved quote securely
                      </button>
                    )}

                    {canSendQuote && selected.quote.status === "approved" && (
                      <div className="mt-4 rounded-2xl border border-[#00a896]/20 bg-white/70 p-4 text-sm font-bold text-[#087f73]">
                        The customer approved this quote. They can now pay securely from their request dashboard.
                      </div>
                    )}
                  </section>
                )}

                {canSendQuote && (
                  <section className="mt-5 rounded-2xl border border-[#12372a]/10 bg-[#fffdf6] p-5">
                    <h3 className="text-xl font-black text-[#12372a]">
                      Create or revise the final quote
                    </h3>

                    <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">
                      This is what the customer will approve before payment. Be specific so the customer knows exactly
                      what they are paying for.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field
                        label="Final quote amount"
                        help="Total price the customer will pay before uploading video."
                      >
                        <input
                          className="pp-input mt-1 px-4 py-3"
                          type="number"
                          min="0"
                          step="0.01"
                          value={quote.amount}
                          onChange={(e) => setQuote((current) => ({ ...current, amount: e.target.value }))}
                          placeholder="Example: 75"
                        />
                      </Field>

                      <Field
                        label="Optional discount percentage"
                        help="Leave at 0 if no discount is being offered."
                      >
                        <input
                          className="pp-input mt-1 px-4 py-3"
                          type="number"
                          min="0"
                          max="100"
                          value={quote.discountPercent}
                          onChange={(e) =>
                            setQuote((current) => ({ ...current, discountPercent: e.target.value }))
                          }
                          placeholder="Example: 10"
                        />
                      </Field>

                      <Field
                        label="Scope of work"
                        help="Explain the exact work you will complete for this customer."
                        wide
                      >
                        <textarea
                          className="pp-input mt-1 px-4 py-3"
                          rows={4}
                          value={quote.scope}
                          onChange={(e) => setQuote((current) => ({ ...current, scope: e.target.value }))}
                          placeholder="Example: I will review your doubles match and focus on third-shot choices, court positioning, transition zone decisions, and kitchen pressure."
                        />
                      </Field>

                      <Field
                        label="Deliverables included"
                        help="List what the customer will receive after paying."
                        wide
                      >
                        <textarea
                          className="pp-input mt-1 px-4 py-3"
                          rows={3}
                          value={quote.deliverables}
                          onChange={(e) =>
                            setQuote((current) => ({ ...current, deliverables: e.target.value }))
                          }
                          placeholder="Example: Voice analysis, written notes, 5 priority corrections, and a personalized drill plan."
                        />
                      </Field>

                      <Field
                        label="Turnaround time"
                        help="Tell the customer how long the review should take after they upload video."
                      >
                        <input
                          className="pp-input mt-1 px-4 py-3"
                          value={quote.turnaround}
                          onChange={(e) => setQuote((current) => ({ ...current, turnaround: e.target.value }))}
                          placeholder="Example: 72 hours after upload"
                        />
                      </Field>

                      <Field
                        label="What the customer should upload"
                        help="Give upload instructions so the customer is not guessing."
                      >
                        <textarea
                          className="pp-input mt-1 px-4 py-3"
                          rows={3}
                          value={quote.uploadInstructions}
                          onChange={(e) =>
                            setQuote((current) => ({ ...current, uploadInstructions: e.target.value }))
                          }
                          placeholder="Example: Upload one match clip under 15 minutes. Tell me which player you are and what side you usually play."
                        />
                      </Field>
                    </div>

                    <button
                      onClick={sendQuote}
                      disabled={busy || !quote.amount}
                      className="pp-btn-primary mt-4 px-4 py-3 disabled:opacity-60"
                    >
                      Send quote for customer approval
                    </button>
                  </section>
                )}
              </>
            ) : (
              <div className="py-24 text-center text-[#5f746c]">
                Select a conversation to view messages and quote details.
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-32 rounded-2xl bg-white/10 px-4 py-3">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs font-bold text-white/70">{label}</div>
    </div>
  );
}

function Status({ value }) {
  const normalized = String(value || "open").toLowerCase();

  const cls =
    normalized === "approved"
      ? "bg-[#c6ff4a] text-[#12372a]"
      : normalized === "sent" || normalized === "quoted"
      ? "bg-[#ffd166] text-[#12372a]"
      : normalized === "declined"
      ? "bg-[#ffebe5] text-[#7a2b18]"
      : "bg-[#d9f7fb] text-[#087f73]";

  return (
    <span className={`h-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${cls}`}>
      {statusLabel(value)}
    </span>
  );
}

function Field({ label, help, wide, children }) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="text-sm font-black text-[#29483d]">{label}</span>
      {help && <span className="mt-1 block text-xs font-semibold leading-5 text-[#5f746c]">{help}</span>}
      {children}
    </label>
  );
}

function MiniStep({ number, title, text }) {
  return (
    <div className="rounded-2xl bg-white/80 p-3">
      <div className="grid h-7 w-7 place-items-center rounded-full bg-[#c6ff4a] text-xs font-black text-[#12372a]">
        {number}
      </div>

      <div className="mt-2 font-black text-[#12372a]">{title}</div>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#40584f]">{text}</p>
    </div>
  );
}