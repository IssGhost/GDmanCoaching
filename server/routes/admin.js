const router = require("express").Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Quote = require("../models/Quote");
const CoachProfile = require("../models/CoachProfile");
const VideoSubmission = require("../models/VideoSubmission");
const PaymentSplit = require("../models/PaymentSplit");
const { auth, allow } = require("../middleware/auth");

router.use(auth, allow("admin"));

router.get("/users", async (_req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

router.get("/stats", async (_req, res) => {
  const [users, products, orders, tickets, quotes, coaches, pendingCoaches, submissions, pendingReviews, splits] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ active: true }),
    Order.countDocuments(),
    Ticket.countDocuments({ status: { $ne: "closed" } }),
    Quote.countDocuments(),
    CoachProfile.countDocuments(),
    CoachProfile.countDocuments({ approved: false }),
    VideoSubmission.countDocuments(),
    VideoSubmission.countDocuments({ status: { $in: ["ready_for_review", "in_review"] } }),
    PaymentSplit.countDocuments(),
  ]);
  res.json({ users, products, orders, openTickets: tickets, quotes, coaches, pendingCoaches, submissions, pendingReviews, splits });
});

router.put("/users/:id/role", async (req, res) => {
  const { role } = req.body || {};
  if (!["admin", "employee", "coach", "player", "user"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { new: true }
  ).select("-passwordHash");

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const ok = await User.findByIdAndDelete(req.params.id);
  if (!ok) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true });
});


router.get("/coaches", async (_req, res) => {
  const rows = await CoachProfile.find({})
    .sort({ approved: 1, updatedAt: -1 })
    .populate("userId", "email fullName role");
  res.json(rows);
});

router.put("/coaches/:id", async (req, res) => {
  const { approved, featured, defaultPlatformFeePercent } = req.body || {};
  const set = {};
  if (typeof approved !== "undefined") set.approved = Boolean(approved);
  if (typeof featured !== "undefined") set.featured = Boolean(featured);
  if (typeof defaultPlatformFeePercent !== "undefined") set.defaultPlatformFeePercent = Number(defaultPlatformFeePercent);
  const row = await CoachProfile.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
  if (!row) return res.status(404).json({ error: "Coach not found" });
  res.json(row);
});

router.get("/submissions", async (_req, res) => {
  const rows = await VideoSubmission.find({})
    .sort({ createdAt: -1 })
    .populate("coachId", "displayName")
    .populate("playerId", "fullName email")
    .populate("packageId", "title price");
  res.json(rows);
});

router.get("/payment-splits", async (_req, res) => {
  const rows = await PaymentSplit.find({}).sort({ createdAt: -1 });
  res.json(rows);
});

module.exports = router;
