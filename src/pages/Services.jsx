import { Link } from "react-router-dom";
import { FaCalendarCheck, FaCheckCircle, FaCloudUploadAlt, FaCommentDots, FaCreditCard, FaMapMarkerAlt, FaUsers } from "react-icons/fa";

const steps = [
  { icon: FaMapMarkerAlt, title: "Pick a training type", text: "Choose in-person private lessons, group clinics, tournament prep, or online video review." },
  { icon: FaCalendarCheck, title: "Book the coach", text: "Select a package by location, specialty, skill level, rate, and session format." },
  { icon: FaCreditCard, title: "Pay online", text: "Checkout creates coach payout records and optional split-payment allocation." },
  { icon: FaCommentDots, title: "Get a plan", text: "Train on court or receive video notes, then save drills and next-step goals in your dashboard." },
];

const tracks = [
  {
    title: "In-person training",
    icon: FaUsers,
    text: "Players book coaches for private lessons, doubles strategy sessions, beginner fundamentals, drilling blocks, group clinics, and tournament preparation.",
    items: ["Court location and coach city/state", "Session-based pricing", "Facility or assistant-coach payout splits", "Follow-up drills saved to player dashboard"],
  },
  {
    title: "Online video review",
    icon: FaCloudUploadAlt,
    text: "Players upload match footage when they want remote feedback, post-session breakdowns, or a detailed timestamped analysis from a coach.",
    items: ["Private video submission", "Timestamped technique notes", "Strengths and weaknesses", "Recommended drills and strategy"],
  },
];

export default function Services() {
  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="pp-kicker">Training options</p>
        <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-black text-[#12372a] md:text-6xl">
          Book local pickleball training or online video review from one platform.
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#5f746c]">
          This is a hybrid coaching marketplace. Players can schedule real on-court sessions, buy video reviews, or use both together for a full improvement plan.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-5 md:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="pp-card rounded-3xl p-6">
            <step.icon className="mb-4 text-3xl text-[#00a896]" />
            <div className="text-sm font-black text-[#087f73]">Step {index + 1}</div>
            <h2 className="mt-1 text-xl font-black text-[#12372a]">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f746c]">{step.text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-2">
        {tracks.map((track) => (
          <div key={track.title} className="pp-card-solid rounded-[2rem] p-8">
            <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]"><track.icon /></div>
            <h2 className="text-3xl font-black text-[#12372a]">{track.title}</h2>
            <p className="mt-3 leading-7 text-[#5f746c]">{track.text}</p>
            <div className="mt-6 grid gap-3">
              {track.items.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white/70 p-4 text-[#5f746c]"><FaCheckCircle className="mt-1 shrink-0 text-[#00a896]" /> <span className="font-bold">{item}</span></div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-6xl rounded-[2rem] border border-[#12372a]/10 bg-gradient-to-br from-[#fffef8] via-[#d9f7fb] to-[#fff1c7] p-8 shadow-2xl shadow-[#12372a]/10">
        <h2 className="text-3xl font-black text-[#12372a]">What a coach can deliver</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["On-court lesson plan", "Private drilling session", "Group clinic booking", "Timestamped video notes", "Strengths and weaknesses", "Recommended drills", "Tournament strategy", "Player dashboard archive"].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl bg-white/70 p-4 font-bold text-[#5f746c]"><FaCheckCircle className="mt-1 text-[#00a896]" /> {item}</div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/coaches" className="pp-btn-primary px-5 py-3 text-center">Book Training</Link>
          <Link to="/coach-signup" className="pp-btn-secondary px-5 py-3 text-center">Coach Signup</Link>
        </div>
      </section>
    </div>
  );
}