// FILE: src/components/AccountMenu.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AccountMenu() {
  const { user, signout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = useMemo(() => {
    const name = user?.fullName || user?.email || "U";
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] || "U").toUpperCase() + (parts[1]?.[0]?.toUpperCase() || "");
  }, [user]);

  const roleLabel = user?.role === "admin" ? "Admin" : user?.role === "coach" ? "Coach" : "Customer";
  const go = (path) => { setOpen(false); nav(path); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#12372a]/10 bg-white/75 text-[#12372a] shadow-sm transition hover:bg-[#d9f7fb]"
        title="Account"
      >
        <span className="text-sm font-black">{initials}</span>
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#fff8e7] bg-[#c6ff4a]" />
      </button>

      {open && (
        <div className="absolute right-0 z-[60] mt-2 w-72 overflow-hidden rounded-2xl border border-[#12372a]/10 bg-[#fffef8]/95 text-[#12372a] shadow-2xl shadow-[#12372a]/15 backdrop-blur-xl">
          <div className="border-b border-[#12372a]/10 bg-[#d9f7fb]/50 px-4 py-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#087f73]">Signed in as</div>
            <div className="mt-1 truncate text-sm font-black">{user?.fullName || user?.email}</div>
            <div className="mt-1 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-black text-[#5f746c]">{roleLabel}</div>
          </div>

          <div className="grid p-2 text-sm font-bold">
            <button onClick={() => go("/dashboard/account")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">My Account</button>
            <button onClick={() => go("/messages")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Messages & Quotes</button>
            <button onClick={() => go("/dashboard/submissions")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Training + Reviews</button>
            <button onClick={() => go("/coaches")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Book Coaching</button>

            {(user?.role === "coach" || user?.role === "admin") && (
              <button onClick={() => go("/coach/dashboard")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Coach Dashboard</button>
            )}

            {user?.role === "admin" && (
              <>
                <button onClick={() => go("/admin/coaching")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Coaching Admin</button>
                <button onClick={() => go("/admin/users")} className="rounded-xl px-4 py-2.5 text-left hover:bg-[#d9f7fb]">Manage Users</button>
              </>
            )}
          </div>

          <div className="border-t border-[#12372a]/10 p-2">
            <button
              onClick={() => { signout(); setOpen(false); nav("/"); }}
              className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-black text-[#b94024] hover:bg-[#ff7b54]/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-[50]" onClick={() => setOpen(false)} aria-hidden />}
    </div>
  );
}