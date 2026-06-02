import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import { Link } from "react-router-dom";

export default function DashboardAccount() {
  const { user, token } = useAuth();
  const { push } = useToast();

  const [form, setForm] = useState({ fullName: user?.fullName || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentQuotes, setRecentQuotes] = useState([]);

  useEffect(() => {
    // Optionally refresh profile:
    // api.get("/auth/me", token).then(u => setForm({ fullName: u.fullName||"", phone: u.phone||"" })).catch(()=>{});
    api.get("/orders/my", token).then(o => setRecentOrders(o.slice(0, 5))).catch(()=>setRecentOrders([]));
    api.get("/quotes/my", token).then(q => setRecentQuotes(q.slice(0, 5))).catch(()=>setRecentQuotes([]));
  }, [token]);

  const onSave = async () => {
    setSaving(true);
    try { await api.put("/auth/me", form, token); push("Profile updated", "success"); }
    catch (e) { push(e.message || "Update failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Summary tiles */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[
          { label: "Open Orders", value: recentOrders.filter(o => o.status !== "completed" && o.status !== "canceled").length },
          { label: "Open Quotes", value: recentQuotes.filter(q => q.status === "pending").length },
          { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
          { label: "Role", value: (user?.role || "user").toUpperCase() },
        ].map((s) => (
          <div key={s.label} className="card-pro--grid p-5 rounded-2xl">
            <div className="text-gray-400 text-xs uppercase">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Two-column: profile + recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile editor */}
        <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-400">Full Name</span>
              <input className="mt-1 w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
                     value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}/>
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Phone</span>
              <input className="mt-1 w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2"
                     value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}/>
            </label>
          </div>
          <button onClick={onSave} disabled={saving}
                  className="mt-4 bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg disabled:opacity-60">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Recent activity */}
        <div className="grid gap-6">
          <div className="card-pro--grid rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Orders</h3>
              <Link to="/dashboard/orders" className="text-sm text-green-400 hover:underline">View all</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-gray-400 text-sm">No recent orders.</div>
            ) : (
              <ul className="text-sm divide-y divide-white/10">
                {recentOrders.map(o => (
                  <li key={o._id} className="py-2 flex items-center justify-between">
                    <span>#{o.number || o._id.slice(-6).toUpperCase()}</span>
                    <span className="capitalize text-gray-300">{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-pro--grid rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Quotes</h3>
              <Link to="/dashboard/quotes" className="text-sm text-green-400 hover:underline">View all</Link>
            </div>
            {recentQuotes.length === 0 ? (
              <div className="text-gray-400 text-sm">No recent quotes.</div>
            ) : (
              <ul className="text-sm divide-y divide-white/10">
                {recentQuotes.map(q => (
                  <li key={q._id} className="py-2 grid grid-cols-[1fr_auto] gap-2">
                    <span className="truncate">{q.subject}</span>
                    <span className="capitalize text-gray-300">{q.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
