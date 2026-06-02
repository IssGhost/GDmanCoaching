const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const auth = async (req, res, next) => {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.demoAdmin) {
      req.user = {
        _id: "temp_admin",
        id: "temp_admin",
        email: "admin@bpj.local",
        fullName: "Temporary Admin",
        role: "admin",
        demoAdmin: true,
      };
      return next();
    }
    const userId = payload._id || payload.id;
    const user = await User.findById(userId).select("-passwordHash");
    if (!user) return res.status(401).json({ error: "Invalid token" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
};

const isStaff = (req, res, next) => {
  if (!["admin", "employee"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const isEmployee = isStaff;

const isCoach = (req, res, next) => {
  if (!["admin", "coach"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const allow = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

module.exports = { auth, isAdmin, isStaff, isEmployee, isCoach, allow };
