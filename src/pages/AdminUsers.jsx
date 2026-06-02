import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/users", token);
      setRows(data);
    } catch (e) {
      push(e.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (id, role) => {
    try {
      const u = await api.put(`/admin/users/${id}/role`, { role }, token);
      setRows((r) => r.map((x) => (x._id === id ? u : x)));
      push(`Role updated to ${role}`, "success");
    } catch (e) {
      push(e.message || "Role update failed", "error");
    }
  };

  const removeUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api.del(`/admin/users/${id}`, token);
      push("User deleted", "success");
      fetchUsers();
    } catch (e) {
      push(e.message || "Delete failed", "error");
    }
  };

  return (
    <div className="min-h-screen bg-black bg-noise text-white pt-28 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
        <p className="text-gray-400 mb-6">Update customer, employee, and admin access.</p>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-gray-950">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Name / Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u._id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{u.fullName || "-"}</div>
                      <div className="text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {["user", "employee", "admin"].map((r) => (
                          <button
                            key={r}
                            disabled={u._id === me?._id && r !== "admin"}
                            onClick={() => changeRole(u._id, r)}
                            className={`px-3 py-1 rounded border ${
                              u.role === r
                                ? "bg-green-600/80 border-green-500 text-white"
                                : "bg-white/10 border-white/15 hover:bg-white/20"
                            } disabled:opacity-60`}
                          >
                            {r}
                          </button>
                        ))}
                        <button
                          disabled={u._id === me?._id}
                          onClick={() => removeUser(u._id)}
                          className="px-3 py-1 rounded border bg-red-600/80 border-red-500 text-white disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
