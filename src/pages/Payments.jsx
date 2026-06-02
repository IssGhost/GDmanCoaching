import { Link } from "react-router-dom";
import {
  FaCalendarCheck,
  FaCheckCircle,
  FaCloudUploadAlt,
  FaExchangeAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const pricingCards = [
  {
    title: "Private Lesson",
    price: "$85+",
    subtitle: "1-on-1 in-person coaching",
    icon: FaMapMarkerAlt,
    text: "For players who want focused court time, technical correction, drilling, and a clear improvement plan after the session.",
    items: ["Local court training", "Footwork and positioning", "Session recap", "Optional follow-up upload"],
  },
  {
    title: "Video Review",
    price: "$45+",
    subtitle: "Remote match breakdown",
    icon: FaCloudUploadAlt,
    text: "For players who upload footage and want timestamped feedback, strengths, weaknesses, and recommended drills.",
    items: ["Private video submission", "Timestamped coach notes", "Drill plan", "Player dashboard report"],
  },
  {
    title: "Hybrid Coaching",
    price: "$125+",
    subtitle: "Lesson plus follow-up review",
    icon: FaCalendarCheck,
    text: "For players who want an in-person lesson and then a follow-up video review to confirm progress after practice.",
    items: ["On-court session", "Follow-up upload", "Coach review", "Next-step training plan"],
  },
  {
    title: "Group Clinic",
    price: "$65+ / player",
    subtitle: "Small group training",
    icon: FaUsers,
    text: "For doubles teams, clubs, or small groups that need shared training time and optional revenue split support.",
    items: ["Clinic booking", "Group goals", "Facility split support", "Coach payout tracking"],
  },
];

const payoutSteps = [
  "Player books a coaching package and pays online.",
  "The platform records the package, coach, player, session type, and payment details.",
  "The platform fee is separated from the coach/facility payout amount.",
  "Shared sessions can divide the remaining payout between a main coach, assistant coach, club, or court facility.",
];

export default function Payments() {
  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-6xl text-center">
        <p className="pp-kicker">Pricing and payouts</p>

        <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-black text-[#12372a] md:text-6xl">
          Flexible coaching prices for lessons, clinics, video reviews, and shared sessions.
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#5f746c]">
          The pricing page shows players what they can book and gives coaches a clear structure for package pricing, online payment, payout tracking, and divisible session revenue.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
        {pricingCards.map((card) => (
          <PriceCard key={card.title} {...card} />
        ))}
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-8 shadow-xl shadow-[#12372a]/10 backdrop-blur">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]">
            <FaMoneyBillWave />
          </div>

          <h2 className="text-3xl font-black text-[#12372a]">
            What the payment system is meant to handle
          </h2>

          <p className="mt-3 leading-7 text-[#5f746c]">
            This is not just a static price sheet. The goal is to support a real coaching marketplace where coaches can create packages, customers can book training, and the business can track who gets paid from each session.
          </p>

          <div className="mt-6 grid gap-3">
            {payoutSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-2xl bg-[#fff8e7] p-4 text-sm leading-6 text-[#5f746c]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c6ff4a] text-xs font-black text-[#12372a]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#12372a]/10 bg-gradient-to-br from-[#fffef8] via-[#d9f7fb] to-[#fff1c7] p-8 shadow-xl shadow-[#12372a]/10">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-2xl text-[#00a896]">
            <FaExchangeAlt />
          </div>

          <h2 className="text-3xl font-black text-[#12372a]">Shared session payout example</h2>

          <p className="mt-3 leading-7 text-[#5f746c]">
            A group clinic or partnered lesson may need to split the payout between the lead coach, assistant coach, and court facility while still keeping the platform fee separate.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[#12372a]/10 bg-white/75">
            <div className="grid grid-cols-2 border-b border-[#12372a]/10 bg-[#d9f7fb]/55 px-4 py-3 text-sm font-black text-[#12372a]">
              <span>Recipient</span>
              <span className="text-right">Example amount</span>
            </div>

            {[
              ["Customer charge", "$240.00"],
              ["Platform fee", "$36.00"],
              ["Lead coach", "$132.60"],
              ["Assistant coach", "$40.80"],
              ["Court facility", "$30.60"],
            ].map(([label, amount]) => (
              <div key={label} className="grid grid-cols-2 border-b border-[#12372a]/10 px-4 py-3 text-sm last:border-b-0">
                <span className="font-bold text-[#5f746c]">{label}</span>
                <span className="text-right font-black text-[#12372a]">{amount}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/coaches" className="pp-btn-primary px-5 py-3 text-center">
              Browse Coaches
            </Link>

            <Link to="/coaches/session-split" className="pp-btn-secondary px-5 py-3 text-center">
              Create Shared Session
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-8 shadow-xl shadow-[#12372a]/10 backdrop-blur">
        <h2 className="text-3xl font-black text-[#12372a]">Why this matters</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Feature
            icon={FaShieldAlt}
            title="Clear for players"
            text="Players understand what they are buying before they book: lesson, review, clinic, or hybrid coaching."
          />

          <Feature
            icon={FaMoneyBillWave}
            title="Useful for coaches"
            text="Coaches can package their services and track expected earnings from each booking."
          />

          <Feature
            icon={FaExchangeAlt}
            title="Ready for partnerships"
            text="Facilities, assistant coaches, and shared clinics can be represented in the split-payment workflow."
          />
        </div>
      </section>
    </div>
  );
}

function PriceCard({ icon: Icon, title, price, subtitle, text, items }) {
  return (
    <article className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-6 shadow-xl shadow-[#12372a]/10 backdrop-blur transition hover:-translate-y-1">
      <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]">
        <Icon />
      </div>

      <h2 className="text-xl font-black text-[#12372a]">{title}</h2>
      <div className="mt-2 text-3xl font-black text-[#087f73]">{price}</div>
      <div className="mt-1 text-sm font-black text-[#ff7b54]">{subtitle}</div>

      <p className="mt-4 text-sm leading-6 text-[#5f746c]">{text}</p>

      <div className="mt-5 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm font-bold text-[#5f746c]">
            <FaCheckCircle className="mt-1 shrink-0 text-[#00a896]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-3xl border border-[#12372a]/10 bg-[#fff8e7] p-6">
      <Icon className="mb-4 text-3xl text-[#00a896]" />
      <h3 className="text-xl font-black text-[#12372a]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5f746c]">{text}</p>
    </div>
  );
}