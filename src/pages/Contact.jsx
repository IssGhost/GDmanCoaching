import { Link } from "react-router-dom";
import { FaEnvelope, FaQuestionCircle, FaUserTie } from "react-icons/fa";

export default function Contact() {
  return (
    <div className="pp-page px-6 pt-32 pb-16">
      <section className="mx-auto max-w-5xl text-center">
        <p className="pp-kicker">Contact GOOD Coaching</p>

        <h1 className="mt-3 text-4xl font-black text-[#12372a] md:text-6xl">
          How can we help?
        </h1>

        <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-[#40584f]">
          Need help with coach profiles, custom quote requests, video submissions, payments, or account access?
          Use the options below to get to the right place.
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

          <Link to="/faq" className="pp-btn-secondary mt-5 w-full px-5 py-3 text-center">
            Open FAQ
          </Link>
        </div>

        <div className="pp-card-solid rounded-3xl p-6">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#c6ff4a] text-2xl text-[#12372a]">
            <FaEnvelope />
          </div>

          <h2 className="text-xl font-black text-[#12372a]">Account help</h2>

          <p className="mt-2 leading-7 text-[#40584f]">
            If you already have an account, use your dashboard to view requests, orders, and video submissions.
          </p>

          <Link to="/signin" className="pp-btn-secondary mt-5 w-full px-5 py-3 text-center">
            Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}