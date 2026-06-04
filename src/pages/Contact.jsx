import { useState } from "react";
import { FaClock, FaEnvelope, FaShieldAlt, FaVideo } from "react-icons/fa";
import { api } from "../lib/api";

const emptyForm = { name: "", email: "", phone: "", city: "", service: "Online coaching question", message: "" };

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      await api.post("/tickets", { subject: `${form.service} from ${form.name}`, ...form, source: "website-contact" });
      setForm(emptyForm);
      setStatus("Thanks. Your message was sent. Please allow 1–3 business days for review and response.");
    } catch (err) {
      setStatus(err.message || "Could not send your request right now.");
    }
  };

  return (
    <div className="min-h-screen bg-black px-6 pt-32 pb-16 text-white">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Contact GOOD Coaching</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-6xl">Questions about online coaching?</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-300">Send a question about coach profiles, video submissions, account setup, or becoming a coach.</p>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-lg md:col-span-2 md:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} type="text" placeholder="Name" className="rounded-xl border border-white/10 bg-zinc-900 p-3" required />
              <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="Email" className="rounded-xl border border-white/10 bg-zinc-900 p-3" required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} type="tel" placeholder="Phone" className="rounded-xl border border-white/10 bg-zinc-900 p-3" />
              <input value={form.city} onChange={(e) => update("city", e.target.value)} type="text" placeholder="City, State, Country" className="rounded-xl border border-white/10 bg-zinc-900 p-3" />
            </div>
            <select value={form.service} onChange={(e) => update("service", e.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3">
              <option>Online coaching question</option>
              <option>Video upload support</option>
              <option>Coach application question</option>
              <option>Account access question</option>
              <option>DUPR profile question</option>
            </select>
            <textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="How can we help?" rows="6" className="w-full rounded-xl border border-white/10 bg-zinc-900 p-3" />
            <button type="submit" className="w-full rounded-xl bg-emerald-400 py-3 font-black text-black hover:bg-emerald-300">Send Message</button>
            {status && <p className="text-sm text-emerald-300">{status}</p>}
          </form>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <h3 className="text-xl font-semibold">Helpful reminders</h3>
          <div className="mt-4 space-y-4 text-gray-300">
            <div className="flex items-center gap-3"><FaVideo className="text-emerald-400" /> Videos are limited to 15 minutes.</div>
            <div className="flex items-center gap-3"><FaClock className="text-emerald-400" /> Allow 1–3 business days for coach responses.</div>
            <div className="flex items-center gap-3"><FaShieldAlt className="text-emerald-400" /> Coaches set pricing directly.</div>
            <div className="flex items-center gap-3"><FaEnvelope className="text-emerald-400" /> Keep account email current for replies.</div>
          </div>
        </aside>
      </section>
    </div>
  );
}
