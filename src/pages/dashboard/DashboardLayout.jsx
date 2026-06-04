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
  const item = "rounded-xl px-4 py-2 text-sm font-black transition";
  const active = "bg-[#c6ff4a] text-[#12372a] shadow-sm";
  const hover = "text-[#12372a]/75 hover:bg-white/70 hover:text-[#12372a]";

  return <div className="pp-page min-h-screen px-6 pt-28 pb-16"><div className="mx-auto max-w-7xl">
    <header className="mb-6 rounded-[2rem] border border-[#12372a]/10 bg-white/75 p-5 shadow-xl shadow-[#12372a]/10 backdrop-blur"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="pp-kicker">Player dashboard</p><h1 className="mt-1 text-3xl font-black text-[#12372a]">My Pickleball Coaching</h1><p className="mt-1 text-sm text-[#5f746c]">Signed in as {user?.fullName || user?.email}. Track online bookings, personalized requests, video submissions, coach notes, and payments.</p></div><nav className="flex flex-wrap gap-2"><NavLink to="/dashboard/account" className={({ isActive }) => `${item} ${isActive ? active : hover}`}>Account</NavLink><NavLink to="/dashboard/orders" className={({ isActive }) => `${item} ${isActive ? active : hover}`}>Orders</NavLink><NavLink to="/messages" className={({ isActive }) => `${item} ${isActive ? active : hover}`}>Personalized Requests</NavLink><NavLink to="/dashboard/submissions" className={({ isActive }) => `${item} ${isActive ? active : hover}`}>Training + Reviews</NavLink></nav></div></header>
    <main className="rounded-[2rem] border border-[#12372a]/10 bg-white/75 p-5 shadow-xl shadow-[#12372a]/10 backdrop-blur md:p-7"><div className="mb-6 flex flex-wrap gap-3"><a href="/coaches" className="pp-btn-primary px-4 py-2 text-sm">Find a coach</a><a href="/messages" className="pp-btn-secondary px-4 py-2 text-sm">View requests</a></div><Outlet/></main>
  </div></div>;
}
