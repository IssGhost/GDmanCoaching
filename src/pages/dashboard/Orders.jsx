import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarCheck, FaCreditCard, FaMapMarkerAlt, FaReceipt, FaVideo } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { DEMO_ORDERS } from "../../lib/demoData";

const FILTERS = ["all", "pending", "paid", "scheduled", "completed", "canceled"];

function typeIcon(type = "") {
  const normalized = String(type).toLowerCase();
  if (normalized.includes("video")) return <FaVideo />;
  if (normalized.includes("person") || normalized.includes("training")) return <FaMapMarkerAlt />;
  return <FaCalendarCheck />;
}

export default function DashboardOrders() {
  const { token } = useAuth();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/orders/my", token).then((data) => setRows(data?.length ? data : DEMO_ORDERS)).catch(() => setRows(DEMO_ORDERS));
  }, [token]);

  const list = useMemo(() => (rows || []).filter((o) => (filter === "all" ? true : o.status === filter)), [rows, filter]);
  const totals = useMemo(() => ({ count: list.length, sum: list.reduce((a, b) => a + (Number(b.total) || 0), 0) }), [list]);

  if (!rows) return <div className="text-[#5f746c]">Loading training orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black text-[#12372a]">Training Orders</h1>
          <p className="mt-1 text-sm text-[#5f746c]">Paid in-person lessons, clinics, video reviews, and hybrid coaching packages.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-[#5f746c]">
          Filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="pp-input min-w-36 px-3 py-2">
            {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary icon={<FaReceipt />} label="Orders" value={totals.count} />
        <Summary icon={<FaCreditCard />} label="Paid volume" value={`$${totals.sum.toFixed(2)}`} />
        <div className="rounded-3xl border border-[#12372a]/10 bg-[#fff1c7]/70 p-5 text-center shadow-sm">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-[#087f73]">Next step</div>
          <Link to="/coaches" className="pp-btn-primary mt-3 px-4 py-2 text-sm">Book more coaching</Link>
        </div>
      </div>

      <div className="grid gap-4">
        {list.map((order) => (
          <article key={order._id} className="rounded-[2rem] border border-[#12372a]/10 bg-white/82 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9f7fb] text-xl text-[#00a896]">{typeIcon(order.orderType || order.items?.[0]?.tag)}</div>
                <div>
                  <h2 className="text-lg font-black text-[#12372a]">#{order.number || order._id.slice(-6).toUpperCase()}</h2>
                  <p className="text-sm text-[#5f746c]">{order.orderType || order.items?.[0]?.name || "Coaching package"}</p>
                  <p className="mt-1 text-xs font-bold text-[#5f746c]">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-2xl font-black text-[#12372a]">${Number(order.total || 0).toFixed(2)}</div>
                <div className="mt-1 inline-flex rounded-full bg-[#c6ff4a] px-3 py-1 text-xs font-black capitalize text-[#12372a]">{order.status || "pending"}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Summary({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-[#12372a]/10 bg-white/80 p-5 shadow-sm">
      <div className="mb-3 text-2xl text-[#00a896]">{icon}</div>
      <div className="text-xs font-black uppercase tracking-[0.14em] text-[#087f73]">{label}</div>
      <div className="mt-1 text-2xl font-black text-[#12372a]">{value}</div>
    </div>
  );
}