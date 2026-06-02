// FILE: src/pages/AdminOrders.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const STATUSES = ["pending", "paid", "shipped", "completed", "canceled"];

export default function AdminOrders() {
  const { token } = useAuth();
  const { push } = useToast();

  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const data = await api.get("/orders", token); // employee/admin list
      setRows(data);
    } catch (e) {
      setRows([]);
      push(e.message || "Failed to load orders", "error");
    }
  };

  useEffect(() => { load(); }, [token]);

  const changeStatus = async (id, status) => {
    setBusy(id);
    try {
      await api.put(`/orders/${id}`, { status }, token);
      push("Order updated", "success");
      await load();
    } catch (e) {
      push(e.message || "Failed to update order", "error");
    } finally {
      setBusy(null);
    }
  };

  if (!rows) return <div className="min-h-screen bg-black text-white pt-32 px-6">Loading...</div>;

  const list = rows.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <div className="min-h-screen bg-black text-white pt-32 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Orders</h1>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 text-sm">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o._id} className="border-t border-white/10">
                  <td className="px-4 py-3">{o.number || o._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3">{o.user?.email || o.userId}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3">${(o.total ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeStatus(o._id, s)}
                          disabled={busy === o._id || o.status === s}
                          className={`px-2 py-1 rounded border border-white/10 text-xs ${
                            o.status === s ? "bg-white/10" : "bg-gray-900 hover:bg-white/10"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>
                    No orders in this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
