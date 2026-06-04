// FILE: server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { normalizeRole } = require("../utils/roles");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) throw new Error("JWT_SECRET is required in production.");
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      id: user._id,
      role: normalizeRole(user.role),
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function presentUser(user) {
  return {
    _id: user._id,
    id: user._id,
    email: user.email,
    fullName: user.fullName || user.name || "",
    name: user.fullName || user.name || "",
    phone: user.phone || "",
    role: normalizeRole(user.role),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function startPathForRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/admin";
  if (normalized === "employee") return "/employee";
  if (normalized === "coach") return "/coach/dashboard";
  return "/dashboard/account";
}

function normalizeLoginEmail(value) {
  return String(value || "").trim().toLowerCase();
}


async function comparePassword(inputPassword, user) {
  if (!user?.passwordHash) return false;
  return bcrypt.compare(inputPassword, user.passwordHash);
}


function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      _id: decoded._id || decoded.id,
      id: decoded._id || decoded.id,
      role: decoded.role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function handleSignup(req, res, next) {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || req.body?.pw || "");
    const fullName = req.body?.fullName || req.body?.name || "";
    const phone = req.body?.phone || "";
    const requestedType = req.body?.accountType || req.body?.role || "user";
    const accountType = requestedType === "coach" ? "coach" : "user";

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: "Full name, email, phone number, and password are required." });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters and include uppercase, lowercase, and a number." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      fullName,
      name: fullName,
      phone,
      role: normalizeRole(accountType),
    });

    const token = signToken(user);

    res.json({
      token,
      user: presentUser(user),
      startPath: startPathForRole(user.role),
    });
  } catch (err) {
    next(err);
  }
}

async function handleSignin(req, res, next) {
  try {
    const email = normalizeLoginEmail(req.body?.email || req.body?.username);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email/username and password are required." });
    }

    const user = await User.findOne({ $or: [{ email }, { username: email }] });

    if (!user) {
      return res.status(400).json({
        error: "Invalid credentials.",
        triedEmail: email,
      });
    }

    const ok = await comparePassword(password, user);

    if (!ok) {
      return res.status(400).json({
        error: "Invalid credentials.",
      });
    }

    const normalizedRole = normalizeRole(user.role);
    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    const token = signToken(user);

    res.json({
      token,
      user: presentUser(user),
      startPath: startPathForRole(user.role),
    });
  } catch (err) {
    next(err);
  }
}

router.get("/ping", (_req, res) => {
  res.json({
    ok: true,
    message: "Auth route is mounted.",
    endpoints: ["/signin", "/login", "/signup", "/register", "/me"],
  });
});

router.post("/signup", handleSignup);
router.post("/register", handleSignup);

router.post("/signin", handleSignin);
router.post("/login", handleSignin);

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    res.json({
      user: presentUser(user),
      startPath: startPathForRole(user.role),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/me", auth, async (req, res, next) => {
  try {
    const updates = {};

    if (typeof req.body?.fullName !== "undefined") updates.fullName = req.body.fullName;
    if (typeof req.body?.name !== "undefined") updates.name = req.body.name;
    if (typeof req.body?.phone !== "undefined") updates.phone = req.body.phone;

    const user = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { $set: updates },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ user: presentUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/signout", (_req, res) => {
  res.status(204).end();
});

module.exports = router;
module.exports.auth = auth;