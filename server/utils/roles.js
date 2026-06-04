const ROLE_ALIASES = new Map([
  ["customer", "user"],
  ["player", "user"],
  ["member", "user"],
  ["cach", "coach"],
  ["coah", "coach"],
  ["trainer", "coach"],
  ["administrator", "admin"],
  ["staff", "employee"],
]);

const VALID_ROLES = new Set(["user", "coach", "admin", "employee"]);

function normalizeRole(value) {
  const role = String(value || "user").trim().toLowerCase();
  const normalized = ROLE_ALIASES.get(role) || role;
  return VALID_ROLES.has(normalized) ? normalized : "user";
}

module.exports = { normalizeRole, VALID_ROLES };
