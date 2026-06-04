import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaComments,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaShoppingCart,
  FaStar,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const SKILL_LEVEL_OPTIONS = [
  "Beginner / newer player",
  "2.5–3.0 recreational player",
  "3.0–3.5 intermediate player",
  "3.5–4.0 competitive player",
  "4.0–4.5 advanced player",
  "4.5+ tournament player",
  "Not sure yet",
];

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function readableReviewType(value) {
  return String(value || "single_video").replaceAll("_", " ");
}

function includedDeliverables(pkg) {
  const rows = [];

  if (pkg?.includesVoiceAnalysis) rows.push("Voice-recorded analysis");
  if (pkg?.includesTranscriptPdf) rows.push("Transcript PDF");
  if (pkg?.includesDrillPlanPdf) rows.push("Downloadable drill-plan PDF");
  if (pkg?.includesResponseVideo) rows.push("Response video");

  return rows;
}

function packageIsPurchasable(pkg) {
  return Boolean(pkg?._id && pkg?.active !== false && Number(pkg?.price || 0) > 0);
}

export default function CoachProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, token } = useAuth();
  const { push } = useToast();

  const [coach, setCoach] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [openPackageId, setOpenPackageId] = useState("");
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [customRequestOpen, setCustomRequestOpen] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({
    title: "",
    goals: "",
    skillLevel: "",
    description: "",
  });

  const [customForm, setCustomForm] = useState({
    title: "",
    goals: "",
    skillLevel: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [requestedServices, setRequestedServices] = useState([]);

  useEffect(() => {
    setLoading(true);

    api
      .get(`/coaches/${id}`)
      .then((row) => {
        const packages = Array.isArray(row?.packages) ? row.packages.filter(packageIsPurchasable) : [];

        setCoach({
          ...row,
          packages,
        });

        setSelectedPackageId(packages?.[0]?._id || "");
        setOpenPackageId("");
        setPurchaseOpen(false);
      })
      .catch(() => setCoach(null))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedPackage = useMemo(
    () => coach?.packages?.find((pkg) => pkg._id === selectedPackageId),
    [coach, selectedPackageId]
  );

  const allServiceOptions = useMemo(() => {
    const packageTitles = (coach?.packages || []).map((pkg) => pkg.title).filter(Boolean);

    return [
      ...packageTitles,
      "Video analysis",
      "Full match review",
      "Doubles strategy",
      "Singles strategy",
      "Third-shot drop help",
      "Kitchen / NVZ positioning",
      "Tournament preparation",
      "Personalized drill plan",
      "Monthly training program",
      "Other custom service",
    ].filter((item, index, all) => all.indexOf(item) === index);
  }, [coach]);

  const requireLogin = () => {
    if (user) return false;

    nav("/signin", {
      state: {
        from: {
          pathname: `/coaches/${id}`,
        },
      },
    });

    return true;
  };

  const startConversation = async () => {
    if (requireLogin()) return;

    if (!inquiryMessage.trim()) {
      push("Write a short message for the coach first.", "error");
      return;
    }

    setBusy(true);

    try {
      await api.post(
        "/inquiries",
        {
          coachId: coach._id,
          subject: `Question for ${coach.displayName}`,
          message: inquiryMessage,
          requestedServices,
        },
        token
      );

      push("Conversation started. You can now discuss details with the coach.", "success");
      nav("/dashboard/requests");
    } catch (e) {
      push(e.message || "Could not start conversation.", "error");
    } finally {
      setBusy(false);
    }
  };

  const toggleRequestedService = (service) => {
    setRequestedServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service]
    );
  };

  const sendCustomRequest = async () => {
    if (requireLogin()) return;

    if (!requestedServices.length) {
      push("Select at least one service for your custom quote request.", "error");
      return;
    }

    if (!customForm.goals.trim() && !customForm.description.trim()) {
      push("Tell the coach what you want help with before sending the request.", "error");
      return;
    }

    setBusy(true);

    try {
      const message = [
        `Requested services: ${requestedServices.join(", ")}`,
        customForm.skillLevel ? `Skill level: ${customForm.skillLevel}` : "",
        customForm.goals ? `Main goals: ${customForm.goals}` : "",
        customForm.description ? `Extra notes: ${customForm.description}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      await api.post(
        "/inquiries",
        {
          coachId: coach._id,
          subject: customForm.title.trim() || `Custom quote request for ${coach.displayName}`,
          message,
          requestedServices,
        },
        token
      );

      push("Custom quote request sent. The coach can now chat with you and send a quote.", "success");
      nav("/dashboard/requests");
    } catch (e) {
      push(e.message || "Could not send custom quote request.", "error");
    } finally {
      setBusy(false);
    }
  };

  const checkout = async () => {
    if (requireLogin()) return;

    if (!selectedPackage) {
      push("Select a coaching plan first.", "error");
      return;
    }

    if (!packageIsPurchasable(selectedPackage)) {
      push("This plan is not available for purchase yet.", "error");
      return;
    }

    setBusy(true);

    try {
      const result = await api.post(
        "/payments/checkout/session",
        {
          coachId: coach._id,
          packageId: selectedPackage._id,
          title: purchaseForm.title,
          goals: purchaseForm.goals,
          skillLevel: purchaseForm.skillLevel,
          description: purchaseForm.description,
        },
        token
      );

      push("Purchase started. Continue to your video submission.", "success");

      if (result.checkoutUrl?.startsWith("http")) {
        window.location.href = result.checkoutUrl;
      } else if (result.submission?._id) {
        nav(`/dashboard/submissions/${result.submission._id}`);
      } else {
        nav("/dashboard/submissions");
      }
    } catch (e) {
      push(e.message || "Checkout failed.", "error");
    } finally {
      setBusy(false);
    }
  };

  const choosePackageForPurchase = (pkg) => {
    setSelectedPackageId(pkg._id);
    setOpenPackageId(pkg._id);
    setPurchaseOpen(true);
    setCustomRequestOpen(false);
  };

  if (loading) {
    return <div className="pp-page min-h-screen px-6 pt-32 font-bold text-[#12372a]">Loading coach...</div>;
  }

  if (!coach) {
    return (
      <div className="pp-page min-h-screen px-6 pt-32">
        <div className="pp-card-solid mx-auto max-w-3xl rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-black text-[#12372a]">Coach not found</h1>

          <Link to="/coaches" className="pp-btn-primary mt-4 px-4 py-2">
            Back to coaches
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = coach.presenceStatus === "online";
  const canChat = coach.acceptingInquiries !== false;

  return (
    <div className="pp-page min-h-screen px-6 pt-32 pb-16 text-[#12372a]">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-[#12372a]/10 bg-white shadow-xl shadow-[#12372a]/10">
            <div className="relative">
              {coach.avatarUrl ? (
                <img src={coach.avatarUrl} alt={coach.displayName} className="h-[26rem] w-full object-cover" />
              ) : (
                <div className="grid h-[26rem] w-full place-items-center bg-[#d9f7fb] text-7xl font-black text-[#12372a]">
                  {(coach.displayName || "C").slice(0, 1)}
                </div>
              )}

              <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-3 py-2 text-sm font-black text-[#12372a] shadow-lg">
                <span
                  className={`h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                    isOnline ? "bg-[#20b26b]" : "bg-[#87938e]"
                  }`}
                />

                {isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <div className="p-6">
              <h1 className="text-3xl font-black text-[#12372a]">{coach.displayName}</h1>

              <p className="mt-1 font-semibold text-[#4f665d]">{coach.headline || "Pickleball coach"}</p>

              <div className="mt-2 flex items-center gap-2 font-bold text-[#b94024]">
                <FaStar /> {coach.rating || 5} rating • {coach.reviewCount || 0} reviews
              </div>

              <p className="mt-6 leading-7 text-[#40584f]">
                {coach.bio ||
                  "This coach is ready to review gameplay footage and create a focused online training plan."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {(coach.specialties || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#00a896]/20 bg-[#d9f7fb] px-3 py-1 text-sm font-bold text-[#235747]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ExpandablePanel title="Coach details" subtitle="DUPR, location, contact, and social links" defaultOpen={false}>
            <div className="grid gap-3 rounded-2xl border border-[#00a896]/20 bg-[#eaf9f7] p-4 text-sm text-[#29483d] sm:grid-cols-2">
              <ProfileFact
                label="DUPR ID"
                value={
                  coach.duprId ? (
                    <a
                      className="font-bold underline"
                      href={coach.duprProfileUrl || `https://dashboard.dupr.com/dashboard/player/${coach.duprId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {coach.duprId} <FaExternalLinkAlt className="inline" />
                    </a>
                  ) : (
                    "Not provided"
                  )
                }
              />

              <ProfileFact label="Singles" value={coach.duprSingles ?? "Not provided"} />
              <ProfileFact label="Doubles" value={coach.duprDoubles ?? "Not provided"} />

              <ProfileFact
                label="Location"
                value={[coach.city, coach.state, coach.country].filter(Boolean).join(", ") || "Online"}
              />

              {coach.duprId && (
                <div className="text-xs font-semibold text-[#40584f] sm:col-span-2">
                  Ratings are entered by the coach. Open the linked DUPR profile to verify current ratings.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {coach.contactEmail && (
                <a href={`mailto:${coach.contactEmail}`} className="profile-action">
                  <FaEnvelope /> Email coach
                </a>
              )}

              <Social href={coach.socialLinks?.instagram} icon={<FaInstagram />} label="Instagram" />
              <Social href={coach.socialLinks?.youtube} icon={<FaYoutube />} label="YouTube" />
              <Social href={coach.socialLinks?.facebook} icon={<FaFacebook />} label="Facebook" />
              <Social href={coach.socialLinks?.tiktok} icon={<FaTiktok />} label="TikTok" />
              <Social href={coach.socialLinks?.website} icon={<FaGlobe />} label="Website" />
            </div>
          </ExpandablePanel>

          <ExpandablePanel title="How online coaching works" subtitle="Simple customer steps" defaultOpen={false}>
            <ol className="space-y-3 text-sm font-semibold leading-6 text-[#40584f]">
              <li className="flex gap-3">
                <StepBadge>1</StepBadge>
                Choose a buy-now plan or send a custom quote request.
              </li>

              <li className="flex gap-3">
                <StepBadge>2</StepBadge>
                After payment, upload a pickleball video up to 15 minutes.
              </li>

              <li className="flex gap-3">
                <StepBadge>3</StepBadge>
                The coach reviews your footage and sends feedback based on the plan.
              </li>
            </ol>
          </ExpandablePanel>
        </aside>

        <main className="space-y-5">
          <section className="rounded-3xl border border-[#00a896]/25 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-black text-[#12372a]">Questions before buying?</h2>

                <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">
                  Ask about coaching style, which plan fits you best, or what video to upload.
                </p>
              </div>

              <button
                onClick={() => setChatOpen((open) => !open)}
                disabled={!canChat}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#087f73] px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-[#066a61] disabled:cursor-not-allowed disabled:bg-[#d8dfdc] disabled:text-[#43564e]"
              >
                <span
                  className={`h-3 w-3 rounded-full border-2 border-white ${
                    isOnline ? "bg-[#55e58d]" : "bg-[#87938e]"
                  }`}
                />

                <FaComments />

                {canChat ? "Message coach" : "Chat unavailable"}
              </button>
            </div>

            {chatOpen && canChat && (
              <div className="mt-4 rounded-2xl border border-[#00a896]/20 bg-[#eaf9f7] p-4">
                <label className="block text-sm font-black text-[#12372a]" htmlFor="coach-chat-message">
                  Message to coach
                </label>

                <textarea
                  id="coach-chat-message"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                  className="pp-input mt-2 px-4 py-3"
                  placeholder="Example: I am around 3.5 and struggle with third-shot drops. Which plan would you recommend?"
                />

                <button
                  onClick={startConversation}
                  disabled={busy || !inquiryMessage.trim()}
                  className="pp-btn-primary mt-3 px-5 py-3 disabled:opacity-60"
                >
                  {busy ? "Starting conversation..." : "Send message"}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#12372a]/10 bg-white p-6 shadow-sm">
            <div>
              <p className="pp-kicker">Buy-now coaching</p>

              <h2 className="mt-1 text-2xl font-black text-[#12372a]">Buy a coaching plan</h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
                These plans have set prices and can be purchased without messaging first. Click a plan to view details.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {(coach.packages || []).map((pkg) => {
                const selected = selectedPackageId === pkg._id;
                const open = openPackageId === pkg._id;
                const deliverables = includedDeliverables(pkg);

                return (
                  <article
                    key={pkg._id}
                    className={`rounded-2xl border transition ${
                      selected ? "border-[#00a896] bg-[#eaf9f7]" : "border-[#12372a]/10 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackageId(pkg._id);
                          setOpenPackageId(open ? "" : pkg._id);
                          setCustomRequestOpen(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#c6ff4a] px-3 py-1 text-xs font-black uppercase text-[#12372a]">
                            Buy now
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-[#087f73]">
                            {readableReviewType(pkg.reviewType)}
                          </span>
                        </div>

                        <h3 className="mt-2 text-lg font-black text-[#12372a]">{pkg.title}</h3>

                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[#40584f]">
                          {pkg.description || "Coach has not added a description yet."}
                        </p>
                      </button>

                      <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
                        <div className="text-right">
                          <div className="text-2xl font-black text-[#087f73]">{money(pkg.price)}</div>
                          <div className="text-xs font-bold text-[#40584f]">
                            {pkg.turnaroundHours || coach.turnaroundHours || 72}h turnaround
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => choosePackageForPurchase(pkg)}
                          className="rounded-full bg-[#12372a] px-4 py-2 text-sm font-black text-white hover:bg-[#087f73]"
                        >
                          Purchase
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPackageId(pkg._id);
                            setOpenPackageId(open ? "" : pkg._id);
                          }}
                          className="rounded-full border border-[#12372a]/10 bg-white p-3 text-[#12372a] hover:bg-[#fff8e7]"
                          aria-label={open ? "Collapse plan details" : "Expand plan details"}
                        >
                          {open ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-[#12372a]/10 p-4">
                        <div className="grid gap-3 text-sm font-bold text-[#4f665d] md:grid-cols-3">
                          <InfoPill icon={<FaClock />} text={`${pkg.turnaroundHours || coach.turnaroundHours || 72} hour target turnaround`} />
                          <InfoPill icon={<FaCheckCircle />} text={`Upload up to ${Math.min(pkg.maxVideoMinutes || 15, 15)} minutes`} />
                          <InfoPill icon={<FaCheckCircle />} text={readableReviewType(pkg.reviewType)} />
                        </div>

                        <div className="mt-4 rounded-xl bg-white/70 p-4">
                          <div className="text-xs font-black uppercase tracking-wide text-[#087f73]">Full description</div>

                          <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
                            {pkg.description || "The coach will provide feedback based on the selected plan."}
                          </p>
                        </div>

                        <div className="mt-4 rounded-xl bg-white/70 p-4">
                          <div className="text-xs font-black uppercase tracking-wide text-[#087f73]">Included</div>

                          {deliverables.length ? (
                            <ul className="mt-2 grid gap-2 text-sm font-bold text-[#40584f] md:grid-cols-2">
                              {deliverables.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <FaCheckCircle className="mt-0.5 shrink-0 text-[#087f73]" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm font-bold text-[#40584f]">
                              The coach will provide feedback based on the selected plan.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {!(coach.packages || []).length && (
                <div className="rounded-2xl border border-[#12372a]/10 bg-[#fff8e7] p-5">
                  <h3 className="font-black text-[#12372a]">No buy-now plans are available yet.</h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#40584f]">
                    This coach can still receive custom quote requests if they are accepting inquiries.
                  </p>
                </div>
              )}
            </div>
          </section>

          <ExpandablePanel
            title="Custom Quote Request — No payment today"
            subtitle="Use this when you need something more specific than a listed plan."
            open={customRequestOpen}
            onToggle={() => {
              setCustomRequestOpen((open) => !open);
              setPurchaseOpen(false);
            }}
            highlight
          >
            <p className="text-sm font-semibold leading-6 text-[#40584f]">
              Send your goals to the coach. The coach replies with a custom quote, and you only pay after approving it.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <InfoStep number="1" title="Send request" text="Explain what you want help with and select services." />
              <InfoStep number="2" title="Coach quotes" text="The coach replies with scope, price, and deliverables." />
              <InfoStep number="3" title="Approve then pay" text="You decide whether to approve the quote before payment." />
            </div>

            <div className="mt-6 rounded-3xl border border-[#00a896]/20 bg-[#eaf9f7] p-5">
              <h3 className="text-xl font-black text-[#12372a]">Build your custom quote request</h3>

              <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">
                The more detail you provide, the easier it is for the coach to send an accurate quote.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {allServiceOptions.map((service) => (
                  <label
                    key={service}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-sm font-bold ${
                      requestedServices.includes(service)
                        ? "border-[#00a896] bg-white"
                        : "border-[#12372a]/10 bg-white/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={requestedServices.includes(service)}
                      onChange={() => toggleRequestedService(service)}
                      className="h-5 w-5 accent-[#087f73]"
                    />

                    {service}
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Request title" help="Give the coach a quick summary of what you need.">
                  <input
                    value={customForm.title}
                    onChange={(e) => setCustomForm((f) => ({ ...f, title: e.target.value }))}
                    className="pp-input mt-1 px-4 py-3"
                    placeholder="Example: Help me prepare for a doubles tournament"
                  />
                </Field>

                <Field label="Skill level" help="Choose the closest level. It is okay if you are not sure.">
                  <select
                    value={customForm.skillLevel}
                    onChange={(e) => setCustomForm((f) => ({ ...f, skillLevel: e.target.value }))}
                    className="pp-input mt-1 px-4 py-3"
                  >
                    <option value="">Select your skill level</option>

                    {SKILL_LEVEL_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Main goals" help="Tell the coach what you want to improve or what problem you want solved." wide>
                  <textarea
                    value={customForm.goals}
                    onChange={(e) => setCustomForm((f) => ({ ...f, goals: e.target.value }))}
                    rows={4}
                    className="pp-input mt-1 px-4 py-3"
                    placeholder="Example: I want help with third-shot drops, court positioning, and knowing when to speed the ball up."
                  />
                </Field>

                <Field label="Extra notes for the coach" help="Add timing, match type, tournament date, injury limits, preferred focus, or questions." wide>
                  <textarea
                    value={customForm.description}
                    onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
                    rows={5}
                    className="pp-input mt-1 px-4 py-3"
                    placeholder="Example: I play right side in doubles, have a tournament in 3 weeks, and want a plan I can practice twice a week."
                  />
                </Field>
              </div>

              <button
                onClick={sendCustomRequest}
                disabled={busy}
                className="pp-btn-primary mt-5 w-full px-6 py-4 disabled:opacity-60"
              >
                {busy ? "Sending custom request..." : "Send custom quote request — no payment today"}
              </button>
            </div>
          </ExpandablePanel>

          <ExpandablePanel
            title="Purchase details"
            subtitle={
              selectedPackage
                ? `Selected: ${selectedPackage.title} — ${money(selectedPackage.price)}`
                : "Select a buy-now plan first."
            }
            open={purchaseOpen}
            onToggle={() => {
              setPurchaseOpen((open) => !open);
              setCustomRequestOpen(false);
            }}
          >
            <p className="text-sm font-semibold leading-6 text-[#40584f]">
              Fill this out before purchasing a buy-now plan. After checkout, you will upload your video from your
              customer dashboard.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Submission title" help="A short name for the video or match you plan to upload.">
                <input
                  value={purchaseForm.title}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, title: e.target.value }))}
                  className="pp-input mt-1 px-4 py-3"
                  placeholder="Example: Doubles match from Saturday"
                />
              </Field>

              <Field label="Skill level" help="Choose the closest level so the coach can tailor the feedback.">
                <select
                  value={purchaseForm.skillLevel}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, skillLevel: e.target.value }))}
                  className="pp-input mt-1 px-4 py-3"
                >
                  <option value="">Select your skill level</option>

                  {SKILL_LEVEL_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>

              <Field label="Main goals" help="Tell the coach what you want them to focus on first." wide>
                <textarea
                  value={purchaseForm.goals}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, goals: e.target.value }))}
                  rows={4}
                  className="pp-input mt-1 px-4 py-3"
                  placeholder="Example: Help me fix my third-shot drop and stop getting caught at the baseline."
                />
              </Field>

              <Field label="Extra notes for the coach" help="Add opponent level, tournament goals, timing, injury limits, or feedback preferences." wide>
                <textarea
                  value={purchaseForm.description}
                  onChange={(e) => setPurchaseForm((f) => ({ ...f, description: e.target.value }))}
                  rows={6}
                  maxLength={5000}
                  className="pp-input mt-1 px-4 py-3"
                  placeholder="Example: This is from a 3.5 doubles match. I am the player in the blue shirt. Please focus on positioning and shot selection."
                />
              </Field>
            </div>

            <div className="mt-5 rounded-2xl border border-[#087f73]/25 bg-[#d9f7fb] p-4 text-sm font-bold leading-6 text-[#20483c]">
              Buy-now plans collect payment now. Custom quote requests do not collect payment until the coach sends a
              quote and you approve it. Uploaded videos are limited to 15 minutes.
            </div>

            <button
              onClick={checkout}
              disabled={busy || !selectedPackage}
              className="pp-btn-primary mt-6 w-full px-6 py-4 disabled:opacity-60"
            >
              <FaShoppingCart className="mr-2" />
              {busy
                ? "Starting purchase..."
                : selectedPackage
                ? `Purchase this plan — ${money(selectedPackage.price)}`
                : "Select a buy-now plan"}
            </button>
          </ExpandablePanel>
        </main>
      </div>
    </div>
  );
}

function ExpandablePanel({ title, subtitle, children, defaultOpen = false, open, onToggle, highlight = false }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = typeof open === "boolean";
  const isOpen = controlled ? open : internalOpen;

  const toggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen((value) => !value);
  };

  return (
    <section
      className={`rounded-3xl border p-5 shadow-sm ${
        highlight
          ? "border-dashed border-[#00a896]/40 bg-[#fffdf6]"
          : "border-[#12372a]/10 bg-white"
      }`}
    >
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-xl font-black text-[#12372a]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">{subtitle}</p>}
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#12372a]/10 bg-white text-[#12372a]">
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>

      {isOpen && <div className="mt-5">{children}</div>}
    </section>
  );
}

function ProfileFact({ label, value }) {
  return (
    <div>
      <span className="font-black text-[#087f73]">{label}:</span>{" "}
      <span className="font-semibold text-[#29483d]">{value}</span>
    </div>
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

function InfoStep({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-[#12372a]/10 bg-white/80 p-4">
      <StepBadge>{number}</StepBadge>

      <h3 className="mt-3 font-black text-[#12372a]">{title}</h3>

      <p className="mt-1 text-sm font-semibold leading-6 text-[#40584f]">{text}</p>
    </div>
  );
}

function InfoPill({ icon, text }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/70 p-3 capitalize">
      <span className="text-[#087f73]">{icon}</span>
      {text}
    </div>
  );
}

function StepBadge({ children }) {
  return (
    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c6ff4a] font-black text-[#12372a]">
      {children}
    </span>
  );
}

function Social({ href, icon, label }) {
  if (!href) return null;

  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="profile-action">
      {icon} {label}
    </a>
  );
}