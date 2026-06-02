import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaCalendarCheck, FaCloudUploadAlt, FaMapMarkerAlt, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const { signup, authBusy } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [accountType, setAccountType] = useState("player");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signup(email, pw, name, accountType);
      nav(accountType === "coach" ? "/coach-signup" : "/dashboard/account");
    } catch (e) {
      setErr(e.message || "Signup failed");
    }
  };

  return (
    <div className="pp-page flex min-h-screen items-center justify-center px-6 pt-28 pb-16">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="pp-card rounded-[2rem] p-8">
          <div className="pp-pill mb-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black">
            <FaUserPlus /> Join PicklePro Coach
          </div>
          <h1 className="text-4xl font-black text-[#12372a]">Create an account for training, video review, or coaching.</h1>
          <p className="mt-4 leading-7 text-[#5f746c]">
            Player accounts can book in-person sessions, buy video reviews, and track feedback. Coach accounts can apply for approval, create packages, and connect payouts.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              [FaMapMarkerAlt, "Book local in-person pickleball training"],
              [FaCloudUploadAlt, "Upload match video for remote coach review"],
              [FaCalendarCheck, "Track sessions, packages, and next-step drills"],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-center gap-3 rounded-2xl bg-white/65 p-3 text-sm font-bold text-[#12372a]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9f7fb] text-[#00a896]"><Icon /></span>
                {text}
              </div>
            ))}
          </div>
        </aside>

        <form onSubmit={submit} className="rounded-[2rem] border border-[#12372a]/10 bg-white/78 p-6 shadow-2xl shadow-[#12372a]/10 backdrop-blur md:p-8">
          <h2 className="text-2xl font-black text-[#12372a]">Account details</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f746c]">Choose player if you are booking training. Choose coach if you want to offer lessons, clinics, or video reviews.</p>

          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Full Name</span>
              <input className="pp-input px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Account Type</span>
              <select className="pp-input px-4 py-3" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                <option value="player">Player / Student</option>
                <option value="coach">Coach</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Email</span>
              <input className="pp-input px-4 py-3" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" required />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-black text-[#12372a]">Password</span>
              <input className="pp-input px-4 py-3" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Minimum 8 characters" type="password" required />
            </label>
          </div>

          {err && <p className="mt-4 rounded-2xl border border-[#ff7b54]/20 bg-[#ff7b54]/10 p-3 text-sm font-bold text-[#b94024]">{err}</p>}

          <button disabled={authBusy} className="pp-btn-primary mt-6 w-full px-5 py-3 disabled:opacity-60">
            {authBusy ? "Creating..." : accountType === "coach" ? "Create Coach Account" : "Create Player Account"}
          </button>

          <p className="mt-4 text-sm text-[#5f746c]">
            Already have an account? <Link to="/signin" className="font-black text-[#087f73] hover:underline">Sign in</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}