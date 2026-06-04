const router = require("express").Router();
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Quote = require("../models/Quote");
const CoachProfile = require("../models/CoachProfile");
const VideoSubmission = require("../models/VideoSubmission");
const PaymentSplit = require("../models/PaymentSplit");
const BlogPost = require("../models/BlogPost");
const CoachingPackage = require("../models/CoachingPackage");
const Post = require("../models/Post");
const Testimonial = require("../models/Testimonial");
const VideoReview = require("../models/VideoReview");
const { auth, allow } = require("../middleware/auth");

router.use(auth, allow("admin"));

const databaseCollections = [
  { key: "users", label: "Users", model: User, select: "-passwordHash" },
  { key: "coachProfiles", label: "Coach Profiles", model: CoachProfile },
  { key: "coachingPackages", label: "Coaching Packages", model: CoachingPackage },
  { key: "orders", label: "Orders", model: Order },
  { key: "paymentSplits", label: "Payment Splits", model: PaymentSplit },
  { key: "videoSubmissions", label: "Video Submissions", model: VideoSubmission },
  { key: "videoReviews", label: "Video Reviews", model: VideoReview },
  { key: "quotes", label: "Quotes", model: Quote },
  { key: "tickets", label: "Support Tickets", model: Ticket },
  { key: "products", label: "Products", model: Product },
  { key: "blogPosts", label: "Blog Posts", model: BlogPost },
  { key: "posts", label: "Posts", model: Post },
  { key: "testimonials", label: "Testimonials", model: Testimonial },
];

const serializeDoc = (doc) => {
  const obj = doc?.toObject ? doc.toObject({ getters: true, virtuals: false }) : doc;
  if (obj?.passwordHash) delete obj.passwordHash;
  return obj;
};

router.get("/database", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);

  const collections = await Promise.all(
    databaseCollections.map(async ({ key, label, model, select }) => {
      let query = model.find({}).sort({ createdAt: -1, _id: -1 }).limit(limit);
      if (select) query = query.select(select);

      const [count, rows] = await Promise.all([model.countDocuments(), query]);

      return {
        key,
        label,
        count,
        rows: rows.map(serializeDoc),
      };
    })
  );

  res.json({ limit, collections });
});

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
