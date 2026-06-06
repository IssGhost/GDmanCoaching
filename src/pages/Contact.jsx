import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaQuestionCircle, FaUserTie } from "react-icons/fa";
import { useToast } from "../components/Toast";
import { api } from "../lib/api";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  topic: "General question",
  message: "",
};

export default function Contact() {
  const { push } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const mailtoFallback = () => {
    const subject = encodeURIComponent(`GOOD Coaching Contact: ${form.topic || "General question"}`);
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Phone: ${form.phone || "Not provided"}`,
        `Topic: ${form.topic}`,
        "",
        "Message:",
        form.message,
      ].join("\n")
    );

    window.location.href = `mailto:blake@goodmanpickleball.com?subject=${subject}&body=${body}`;
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      push("Please enter your name, email, and message.", "error");
      return;
    }

    setBusy(true);

    try {
      await api.post("/contact", form);
      push("Message sent to GOOD Coaching.", "success");
      setForm(INITIAL_FORM);
    } catch (err) {
      push("Opening your email app so you can send the message directly.", "success");
      mailtoFallback();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="pp-kicker">Contact GOOD Coaching</p>

        <h1 className="mt-3 text-4xl font-black text-[#12372a] md:text-6xl">
          How can we help?
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#40584f]">
          Need help with coach profiles, custom quote requests, video submissions, payments, or account access?
          Send a message below or use the quick links to get where you need to go.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
        <div className="pp-card-solid rounded-3xl p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-2xl text-[#00a896]">
            <FaUserTie />
          </div>

          <h2 className="text-xl font-black text-[#12372a]">Find a coach</h2>

          <p className="mt-2 leading-7 text-[#40584f]">
            Browse approved coaches, compare packages, and choose the right review option.
          </p>

          <Link to="/coaches" className="pp-btn-primary mt-5 w-full px-5 py-3 text-center">
            Browse Coaches
          </Link>
        </div>

        <div className="pp-card-solid rounded-3xl p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1c7] text-2xl text-[#b94024]">
            <FaQuestionCircle />
          </div>

          <h2 className="text-xl font-black text-[#12372a]">Common questions</h2>

          <p className="mt-2 leading-7 text-[#40584f]">
            Review answers about uploads, custom requests, payments, and coaching timelines.
          </p>

          <Link to="/faq" className="pp-btn-primary mt-5 w-full px-5 py-3 text-center">
            Open FAQ
          </Link>
        </div>

        <div className="pp-card-solid rounded-3xl p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#c6ff4a] text-2xl text-[#12372a]">
            <FaEnvelope />
          </div>

          <h2 className="text-xl font-black text-[#12372a]">Account help</h2>

          <p className="mt-2 leading-7 text-[#40584f]">
            Sign in to view requests, orders, video submissions, and messages.
          </p>

          <Link to="/signin" className="pp-btn-primary mt-5 w-full px-5 py-3 text-center">
            Sign In
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-[#12372a] p-7 text-white shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c6ff4a]">
            Send a message
          </p>

          <h2 className="mt-3 text-3xl font-black text-white">
            Contact GOOD Coaching directly.
          </h2>

          <p className="mt-3 leading-7 text-white/85">
            Use this form for customer questions, coach application questions, payment concerns, video upload issues,
            or general platform support.
          </p>

          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm font-bold leading-6 text-white/90">
            Messages are sent to:
            <br />
            <span className="text-[#c6ff4a]">blake@goodmanpickleball.com</span>
          </div>
        </div>

        <form onSubmit={submit} className="pp-card-solid rounded-[2rem] p-7">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Your name</span>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="pp-input px-4 py-3"
                placeholder="Full name"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="pp-input px-4 py-3"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Phone number optional</span>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="pp-input px-4 py-3"
                placeholder="Optional"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Topic</span>
              <select
                value={form.topic}
                onChange={(e) => update("topic", e.target.value)}
                className="pp-input px-4 py-3"
              >
                <option>General question</option>
                <option>Player account help</option>
                <option>Coach application help</option>
                <option>Payment or order issue</option>
                <option>Video upload issue</option>
                <option>Custom quote question</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-black text-[#12372a]">How can we help?</span>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={7}
                className="pp-input px-4 py-3"
                placeholder="Tell us what happened, what account email you used, and what you need help with."
                required
              />
            </label>
          </div>

          <button disabled={busy} className="pp-btn-primary mt-6 w-full px-6 py-4 disabled:opacity-60">
            {busy ? "Sending..." : "Send Message"}
          </button>

          <button
            type="button"
            onClick={mailtoFallback}
            className="pp-btn-secondary mt-3 w-full px-6 py-3"
          >
            Open Email App Instead
          </button>
        </form>
      </section>
    </div>
  );
}