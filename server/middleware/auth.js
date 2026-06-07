const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { normalizeRole, requireRole } = require("../utils/roles");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) throw new Error("JWT_SECRET is required in production.");

const auth = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload._id || payload.id;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid token" });

    req.user = user;
    req.user.role = requireRole(user.role);
    next();
  } catch (error) {
    if (error?.statusCode) return res.status(error.statusCode).json({ error: error.message });
    return res.status(401).json({ error: "Unauthorized" });
  }
};

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

module.exports = { auth, isAdmin, isStaff, isEmployee, isCoach, allow };
