import { FaClipboardCheck, FaComments, FaCreditCard, FaUser, FaVideo } from "react-icons/fa";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/dashboard/account", label: "Overview", icon: FaUser },
  { to: "/dashboard/orders", label: "Orders & payments", icon: FaCreditCard },
  { to: "/messages", label: "Personalized requests", icon: FaComments },
  { to: "/dashboard/submissions", label: "Training & reviews", icon: FaVideo },
];

export default function DashboardLayout() {
  const { user } = useAuth();
  return <div className="pp-page min-h-screen px-4 pt-24 pb-16 md:px-6"><div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[16rem_1fr]">
    <aside className="h-fit rounded-[2rem] bg-[#12372a] p-5 text-white shadow-xl lg:sticky lg:top-24"><div className="rounded-2xl bg-white/10 p-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c6ff4a] text-xl font-black text-[#12372a]">{(user?.fullName || user?.email || "P").slice(0,1).toUpperCase()}</div><div className="mt-3 font-black text-white">{user?.fullName || "Player account"}</div><div className="truncate text-xs text-white/65">{user?.email}</div></div><nav className="mt-5 space-y-2">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-black transition ${isActive ? "bg-[#c6ff4a] text-[#12372a]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}><Icon/>{label}</NavLink>)}</nav><a href="/coaches" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-black text-white hover:bg-white/10"><FaClipboardCheck/>Find a coach</a></aside>
    <main><header className="mb-6 rounded-[2rem] border border-[#12372a]/10 bg-white p-6 shadow-lg"><p className="pp-kicker">Player workspace</p><h1 className="mt-1 text-3xl font-black text-[#12372a]">My coaching dashboard</h1><p className="mt-1 text-sm leading-6 text-[#40584f]">Manage requests, payments, video submissions, and completed coach feedback from one place.</p></header><section className="rounded-[2rem] border border-[#12372a]/10 bg-white p-5 shadow-lg md:p-7"><Outlet/></section></main>
  </div></div>;
}
