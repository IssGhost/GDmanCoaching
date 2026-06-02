import { useState } from "react";
import { FaClock, FaPhoneAlt, FaMapMarkerAlt, FaShieldAlt } from "react-icons/fa";
import { api } from "../lib/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  city: "",
  service: "Aerobic system service",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    try {
      await api.post("/tickets", {
        subject: `${form.service} request from ${form.name}`,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        message: form.message,
        source: "website-contact",
      });
      setForm(emptyForm);
      setStatus("Thanks. Your request was sent and the team will follow up shortly.");
    } catch (err) {
      setStatus(err.message || "Could not send your request. Please call 281-252-0777.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden pt-36 pb-12 px-6">
        <div className="absolute inset-0">
          <img src="/images/IMG_0797.JPG" alt="" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">Fast local dispatch</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold md:text-6xl">Schedule septic service without the runaround.</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Tell us what is happening with your system. We will route the right technician and follow up with clear next steps.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg border border-white/10 bg-zinc-950 p-6 shadow-lg md:p-8">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <input value={form.name} onChange={(e) => update("name", e.target.value)} type="text" placeholder="Name" className="rounded-md border border-white/10 bg-zinc-900 p-3" required />
              <input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="Email" className="rounded-md border border-white/10 bg-zinc-900 p-3" required />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} type="tel" placeholder="Phone" className="rounded-md border border-white/10 bg-zinc-900 p-3" required />
              <input value={form.city} onChange={(e) => update("city", e.target.value)} type="text" placeholder="City / ZIP" className="rounded-md border border-white/10 bg-zinc-900 p-3" />
            </div>
            <select value={form.service} onChange={(e) => update("service", e.target.value)} className="w-full rounded-md border border-white/10 bg-zinc-900 p-3">
              <option>Aerobic system service</option>
              <option>Septic tank pumping</option>
              <option>Emergency repair</option>
              <option>New install or replacement</option>
              <option>Inspection or maintenance plan</option>
              <option>Parts or marketplace question</option>
            </select>
            <textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="What are you seeing, hearing, or smelling?" rows="5" className="w-full rounded-md border border-white/10 bg-zinc-900 p-3" />
            <button type="submit" className="w-full rounded-md bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400">
              Send Service Request
            </button>
            {status && <p className="text-sm text-emerald-300">{status}</p>}
          </form>
        </div>

        <aside className="rounded-lg border border-white/10 bg-zinc-950 p-6">
          <h3 className="text-xl font-semibold">Reach Big Papa Joe</h3>
          <div className="mt-4 space-y-4 text-gray-300">
            <a href="tel:2812520777" className="flex items-center gap-3 hover:text-white"><FaPhoneAlt className="text-emerald-400" /> 281-252-0777</a>
            <div className="flex items-center gap-3"><FaMapMarkerAlt className="text-emerald-400" /> Pinehurst, TX and surrounding areas</div>
            <div className="flex items-center gap-3"><FaClock className="text-emerald-400" /> Emergency calls available 24/7</div>
            <div className="flex items-center gap-3"><FaShieldAlt className="text-emerald-400" /> Licensed, insured, and field-tested</div>
          </div>
          <div className="mt-6 rounded-md bg-amber-400/10 p-4 text-sm text-amber-100">
            For active backups, alarm lights, or strong odors, call instead of waiting for form follow-up.
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950 p-5 text-sm text-gray-300 md:grid-cols-3">
          <div><span className="font-semibold text-white">Pump-outs:</span> clean scheduling and careful site protection.</div>
          <div><span className="font-semibold text-white">Aerobic systems:</span> alarms, air pumps, chlorination, and inspections.</div>
          <div><span className="font-semibold text-white">Installs:</span> planning, permits, equipment, and start-up support.</div>
        </div>
      </section>
    </div>
  );
}
