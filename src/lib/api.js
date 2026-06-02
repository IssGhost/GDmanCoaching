const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5001/api");

const handle = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
};

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

export const api = {
  get: (p, token) =>
    fetch(`${API}${p}`, {
      headers: authHeaders(token),
    }).then(handle),

  post: (p, body, token) =>
    fetch(`${API}${p}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    }).then(handle),

  put: (p, body, token) =>
    fetch(`${API}${p}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    }).then(handle),

  del: (p, token) =>
    fetch(`${API}${p}`, {
      method: "DELETE",
      headers: authHeaders(token),
    }).then(handle),
};

export const API_BASE = API;
