import { Link } from "react-router-dom";
import { FaCheckCircle, FaCloudUploadAlt, FaCreditCard, FaPlay, FaStar, FaSun, FaUserTie } from "react-icons/fa";

const steps = [
  { title: "Pick a coach", text: "Choose a coach by skill level, specialty, package, and turnaround time." },
  { title: "Pay securely", text: "Checkout creates the order, coach payout, platform fee, and split-payment record when needed." },
  { title: "Upload video", text: "Submit your match footage directly through the site after booking." },
  { title: "Get reviewed", text: "Receive timestamped notes, drills, strengths, and a complete improvement plan." },
];

const specialties = ["Doubles rotation", "Third-shot drops", "Serve + return", "Kitchen resets", "Tournament prep", "Beginner fundamentals"];

export default function Home() {
  return (
    <div className="pp-page">
      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute left-8 top-28 h-24 w-24 rounded-full bg-[#ffd166]/35 blur-2xl" />
        <div className="absolute right-8 top-40 h-32 w-32 rounded-full bg-[#90e0ef]/55 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="pp-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black">
              <FaSun className="text-[#ff7b54]" /> Outdoor video coaching marketplace
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-tight text-[#12372a] md:text-7xl">
              Sharpen your pickleball game with coach-reviewed video feedback.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f746c]">
              Players upload match footage. Coaches get paid through the platform, split payouts when needed, and deliver timestamped notes, drills, and strategy from one bright, easy dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/coaches" className="pp-btn-primary px-7 py-4 text-center">
                Find a Coach
              </Link>
              <Link to="/coach-signup" className="pp-btn-secondary px-7 py-4 text-center">
                Become a Coach
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm font-bold text-[#5f746c] sm:grid-cols-3">
              {["Secure coach payouts", "Private video submissions", "Timestamped improvement plans"].map((item) => (
                <div key={item} className="flex items-center gap-2"><FaCheckCircle className="text-[#00a896]" /> {item}</div>
              ))}
            </div>
          </div>

          <div className="pp-card rounded-[2rem] p-5">
            <div className="pp-court-card relative overflow-hidden rounded-[1.5rem] p-5 text-white shadow-2xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#c6ff4a]/80 blur-xl" />
              <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#ffd166]/50 blur-2xl" />
              <div className="relative mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white/75">Review in progress</div>
                  <div className="text-xl font-black">Tournament Match Breakdown</div>
                </div>
                <span className="rounded-full bg-[#c6ff4a] px-3 py-1 text-xs font-black text-[#12372a]">PAID</span>
              </div>
              <div className="relative grid aspect-video place-items-center rounded-2xl border border-white/30 bg-white/15 backdrop-blur">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white/25 text-3xl shadow-xl"><FaPlay /></div>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#12372a]">Coach notes ready</div>
              </div>
              <div className="relative mt-5 space-y-3">
                {[
                  ["00:42", "Recover forward after the third-shot drop."],
                  ["01:18", "Good cross-court dink decision. Keep paddle higher."],
                  ["02:09", "You overcommitted wide. Reset through the middle."],
                ].map(([time, note]) => (
                  <div key={time} className="flex gap-3 rounded-xl border border-white/25 bg-white/18 p-3 text-sm backdrop-blur">
                    <span className="font-black text-[#c6ff4a]">{time}</span>
                    <span className="text-white/90">{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: FaCreditCard, title: "Coach payments", text: "Stripe Connect-ready flow for coach payouts, platform fees, and split-payment records." },
            { icon: FaCloudUploadAlt, title: "Video submission", text: "Direct upload workflow with a no-key demo fallback for local testing." },
            { icon: FaUserTie, title: "Coach dashboard", text: "Coaches manage packages, payment onboarding, assigned videos, and completed reviews." },
          ].map((card) => (
            <div key={card.title} className="pp-card-solid rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]"><card.icon /></div>
              <h2 className="text-xl font-black text-[#12372a]">{card.title}</h2>
              <p className="mt-2 leading-7 text-[#5f746c]">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="pp-kicker">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-[#12372a] md:text-5xl">A complete paid review loop</h2>
          </div>
          <Link to="/coaches" className="pp-btn-secondary px-5 py-3">Browse coaching packages</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="pp-card rounded-3xl p-5">
              <div className="pp-ball mb-4 grid h-11 w-11 place-items-center rounded-full font-black text-[#12372a]">{i + 1}</div>
              <h3 className="text-lg font-black text-[#12372a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5f746c]">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 pb-20">
        <div className="rounded-[2rem] border border-[#12372a]/10 bg-gradient-to-br from-[#fffef8] via-[#d9f7fb] to-[#fff1c7] p-8 shadow-2xl shadow-[#12372a]/10 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex text-[#ff7b54]"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <h2 className="mt-3 text-3xl font-black text-[#12372a]">Built for sunny courts, busy coaches, and players who want real feedback.</h2>
              <p className="mt-3 leading-7 text-[#5f746c]">The backend supports coach profiles, coaching packages, payment splits, video submissions, and reviews.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {specialties.map((item) => (
                <span key={item} className="rounded-full border border-[#00a896]/15 bg-white/70 px-4 py-2 text-sm font-bold text-[#087f73]">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}