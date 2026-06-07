const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { normalizeRole, requireRole } = require("../utils/roles");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) throw new Error("JWT_SECRET is required in production.");

const ROLE_PRIORITY = ["admin", "employee", "coach", "user"];

function normalizeRoles(values, fallbackRole = "user") {
  const rawRoles = Array.isArray(values) ? values : values ? [values] : [];
  const roles = rawRoles.map((role) => normalizeRole(role)).filter(Boolean);

  if (!roles.length) {
    const fallback = normalizeRole(fallbackRole, "user");
    return [fallback];
  }

  return [...new Set(roles)];
}

function primaryRole(userOrRole) {
  if (typeof userOrRole === "string") return requireRole(userOrRole);

  const roles = normalizeRoles(userOrRole?.roles, userOrRole?.role || "user");
  return requireRole(ROLE_PRIORITY.find((role) => roles.includes(role)) || userOrRole?.role || roles[0]);
}

async function syncUserRoleFields(user) {
  if (!user) return user;

  const role = primaryRole(user);
  const roles = normalizeRoles(user.roles, role);
  if (!roles.includes(role)) roles.unshift(role);

  const currentRole = normalizeRole(user.role);
  const currentRoles = normalizeRoles(user.roles, currentRole || role);
  const needsSave =
    currentRole !== role ||
    currentRoles.length !== roles.length ||
    currentRoles.some((value, index) => value !== roles[index]);

  if (needsSave) {
    user.role = role;
    user.roles = roles;
    await user.save();
  }

  return user;
}

const auth = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload._id || payload.id;

    let user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "Invalid token" });

    user = await syncUserRoleFields(user);
    const role = primaryRole(user);

    req.user = user;
    req.user.role = requireRole(user.role);
    next();
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const hasRole = (user, role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  return normalizeRoles(user?.roles, user?.role).includes(normalized) || normalizeRole(user?.role) === normalized;
};

const hasAnyRole = (user, roles) => Array.isArray(roles) && roles.some((role) => hasRole(user, role));

const isAdmin = (req, res, next) => {
  if (normalizeRole(req.user?.role) !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

const isStaff = (req, res, next) => {
  if (!["admin", "employee"].includes(normalizeRole(req.user?.role))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const isEmployee = isStaff;

const isCoach = (req, res, next) => {
  if (!["admin", "coach"].includes(normalizeRole(req.user?.role))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const allow = (...roles) => (req, res, next) => {
  if (!req.user || !roles.map(normalizeRole).includes(normalizeRole(req.user.role))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

module.exports = { auth, isAdmin, isStaff, isEmployee, isCoach, allow, hasRole, hasAnyRole };