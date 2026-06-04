const ROLE_ALIASES = {
  customer: "user",
  player: "user",
  member: "user",
  cach: "coach",
  coah: "coach",
  trainer: "coach",
  administrator: "admin",
  staff: "employee",
};

export function normalizeRole(value) {
  const role = String(value || "user").trim().toLowerCase();
  return ["user", "coach", "admin", "employee"].includes(ROLE_ALIASES[role] || role) ? (ROLE_ALIASES[role] || role) : "user";
}

export function roleLabel(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "Admin";
  if (normalized === "employee") return "Staff";
  if (normalized === "coach") return "Coach";
  return "Customer";
}

export function roleBadgeClass(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "bg-[#5b21b6] text-white";
  if (normalized === "employee") return "bg-[#b45309] text-white";
  if (normalized === "coach") return "bg-[#087f73] text-white";
  return "bg-[#12372a] text-white";
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
