import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { api } from "../lib/api";

const fallback = [
  {
    _id: "fallback-1",
    name: "Renee M.",
    location: "Magnolia, TX",
    service: "Aerobic repair",
    rating: 5,
    text: "They diagnosed our alarm issue quickly, explained the repair, and left the yard cleaner than expected.",
  },
  {
    _id: "fallback-2",
    name: "Jason T.",
    location: "Pinehurst, TX",
    service: "Pump-out",
    rating: 5,
    text: "Fast scheduling and straightforward pricing. Exactly what you want when a septic problem shows up.",
  },
  {
    _id: "fallback-3",
    name: "Alicia R.",
    location: "Tomball, TX",
    service: "Maintenance plan",
    rating: 5,
    text: "The maintenance reminders and service notes make it easy to stay ahead of issues.",
  },
];

export default function Testimonials() {
  const [rows, setRows] = useState(fallback);

  useEffect(() => {
    api.get("/testimonials")
      .then((data) => data?.length && setRows(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 pt-32 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Customer proof</p>
        <h1 className="mt-3 text-center text-4xl font-extrabold">What Customers Say</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
          Published reviews from the admin portal appear here and on the home page.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {rows.map((t) => (
            <article key={t._id || t.name} className="rounded-lg border border-white/10 bg-zinc-950 p-6">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating || 5 }).map((_, i) => <FaStar key={i} className="text-amber-400" />)}
              </div>
              <p className="text-gray-300">"{t.text}"</p>
              <div className="mt-5 font-bold">{t.name}</div>
              <div className="text-sm text-gray-500">{[t.service, t.location].filter(Boolean).join(" / ")}</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
