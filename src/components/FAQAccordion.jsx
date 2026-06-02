import { useState } from "react";

const faqs = [
  {
    q: "Can I book a coach for in-person pickleball training?",
    a: "Yes. The platform is built for in-person lessons, private drilling sessions, group clinics, tournament prep, and online video reviews. Coach profiles can list city, state, rates, specialties, and available training types.",
  },
  {
    q: "Is video review still supported?",
    a: "Yes. Players can book a video-review package, upload match footage, and receive timestamped comments, written notes, strengths, weaknesses, and recommended drills in their dashboard.",
  },
  {
    q: "How do coaches get paid?",
    a: "The payment flow is Stripe Connect-ready. A player pays for the session or review, the platform records its fee, and the coach payout is tracked. In demo mode, checkout can be tested without live Stripe keys.",
  },
  {
    q: "Can one booking be split between multiple people?",
    a: "Yes. Payment split records support shared payouts for a main coach, assistant coach, club, court facility, or platform fee. This is useful for group clinics, partnered lessons, and facility revenue sharing.",
  },
  {
    q: "What types of coaching packages should coaches offer?",
    a: "Good starter packages include one-hour private lessons, two-hour doubles clinics, tournament prep sessions, beginner fundamentals, single-video review, and monthly hybrid coaching with both in-person and video feedback.",
  },
  {
    q: "Do coaches need approval before appearing publicly?",
    a: "The current admin flow supports coach approval. A coach can create a profile, but the admin can control whether that coach is visible in the marketplace.",
  },
  {
    q: "Where do players see their booked training or submitted videos?",
    a: "Players use their dashboard to view orders, coaching submissions, video review status, completed feedback, and any saved notes from their coach.",
  },
  {
    q: "Can the site handle local courts and locations?",
    a: "Yes. Coach profiles include city and state fields, and the marketplace copy is designed around local outdoor courts, in-person lessons, and online review options.",
  },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-10">
      {faqs.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className="overflow-hidden rounded-2xl border border-[#12372a]/10 bg-white/75 shadow-sm backdrop-blur">
            <button
              className="flex w-full items-center justify-between gap-4 p-5 text-left font-black text-[#12372a] transition hover:bg-[#d9f7fb]/50"
              onClick={() => setOpenIndex(open ? null : i)}
            >
              <span>{item.q}</span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c6ff4a] text-[#12372a]">{open ? "−" : "+"}</span>
            </button>
            {open && <div className="border-t border-[#12372a]/10 bg-[#fffef8]/80 p-5 leading-7 text-[#5f746c]">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}