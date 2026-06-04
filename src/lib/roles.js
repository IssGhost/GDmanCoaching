export function normalizeRole(role) {
  if (role === "customer" || role === "player") return "user";
  return role || "user";
}

export function roleLabel(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "Admin";
  if (normalized === "employee") return "Staff";
  if (normalized === "coach") return "Coach";
  return "Customer";
}

export function portalPathForRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/admin";
  if (normalized === "employee") return "/employee";
  if (normalized === "coach") return "/coach/dashboard";
  return "/dashboard/account";
}

export function portalLabelForRole(role) {
  return `${roleLabel(role)} Dashboard`;
}
