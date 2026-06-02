const router = require("express").Router();
const mongoose = require("mongoose");
const CoachProfile = require("../models/CoachProfile");
const CoachingPackage = require("../models/CoachingPackage");
const User = require("../models/User");
const { auth, allow } = require("../middleware/auth");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function cleanArray(value) {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function publicCoachPayload(profile, packages = []) {
  const obj = profile.toObject ? profile.toObject() : profile;
  return {
    ...obj,
    packages,
    stripeAccountId: undefined,
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const showAll = req.query.all === "1";
    const filter = showAll ? {} : { approved: true };
    const coaches = await CoachProfile.find(filter).sort({ featured: -1, rating: -1, updatedAt: -1 }).lean();
    const ids = coaches.map((c) => c._id);
    const packages = await CoachingPackage.find({ coachId: { $in: ids }, active: true }).sort({ price: 1 }).lean();
    const byCoach = packages.reduce((acc, pkg) => {
      const key = String(pkg.coachId);
      acc[key] = acc[key] || [];
      acc[key].push(pkg);
      return acc;
    }, {});
    res.json(coaches.map((coach) => publicCoachPayload(coach, byCoach[String(coach._id)] || [])));
  })
);

router.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Coach profile not found" });
    const packages = await CoachingPackage.find({ coachId: profile._id }).sort({ createdAt: -1 });
    res.json({ profile, packages });
  })
);

router.post(
  "/apply",
  auth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const current = await User.findById(req.user._id);
    if (!current) return res.status(401).json({ error: "Unauthorized" });

    const update = {
      displayName: body.displayName || current.fullName || current.email,
      headline: body.headline || "Pickleball Coach",
      bio: body.bio || "",
      city: body.city || "",
      state: body.state || "",
      specialties: cleanArray(body.specialties),
      skillLevels: cleanArray(body.skillLevels),
      yearsExperience: Number(body.yearsExperience || 0),
      videoReviewRate: Number(body.videoReviewRate || 45),
      liveSessionRate: Number(body.liveSessionRate || 75),
      turnaroundHours: Number(body.turnaroundHours || 48),
      avatarUrl: body.avatarUrl || "",
      introVideoUrl: body.introVideoUrl || "",
    };

    const profile = await CoachProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update, $setOnInsert: { userId: req.user._id, approved: false } },
      { upsert: true, new: true }
    );

    const user = await User.findByIdAndUpdate(req.user._id, { $set: { role: "coach" } }, { new: true }).select("-passwordHash");

    const starterPackages = [
      {
        title: "Single Video Review",
        description: "Upload one match or drill clip and receive timestamped notes, strengths, fixes, and drills.",
        price: update.videoReviewRate,
        reviewType: "single_video",
        turnaroundHours: update.turnaroundHours,
        maxVideoMinutes: 10,
      },
      {
        title: "Doubles Strategy Breakdown",
        description: "A deeper review focused on positioning, third-shot choices, resets, and partner movement.",
        price: Math.max(update.videoReviewRate + 20, 65),
        reviewType: "doubles_strategy",
        turnaroundHours: update.turnaroundHours,
        maxVideoMinutes: 20,
      },
    ];

    const existingPackages = await CoachingPackage.countDocuments({ coachId: profile._id });
    if (!existingPackages) {
      await CoachingPackage.insertMany(starterPackages.map((pkg) => ({ ...pkg, coachId: profile._id })));
    }

    const packages = await CoachingPackage.find({ coachId: profile._id }).sort({ price: 1 });
    res.json({ profile, packages, user });
  })
);

router.put(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile && req.user.role !== "admin") return res.status(404).json({ error: "Coach profile not found" });

    const update = {
      displayName: body.displayName,
      headline: body.headline,
      bio: body.bio,
      city: body.city,
      state: body.state,
      specialties: body.specialties !== undefined ? cleanArray(body.specialties) : undefined,
      skillLevels: body.skillLevels !== undefined ? cleanArray(body.skillLevels) : undefined,
      yearsExperience: body.yearsExperience !== undefined ? Number(body.yearsExperience) : undefined,
      videoReviewRate: body.videoReviewRate !== undefined ? Number(body.videoReviewRate) : undefined,
      liveSessionRate: body.liveSessionRate !== undefined ? Number(body.liveSessionRate) : undefined,
      turnaroundHours: body.turnaroundHours !== undefined ? Number(body.turnaroundHours) : undefined,
      avatarUrl: body.avatarUrl,
      introVideoUrl: body.introVideoUrl,
    };
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);

    const saved = await CoachProfile.findOneAndUpdate({ userId: req.user._id }, { $set: update }, { new: true });
    res.json(saved);
  })
);

router.post(
  "/me/packages",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Coach profile not found" });
    const pkg = await CoachingPackage.create({ ...req.body, coachId: profile._id });
    res.json(pkg);
  })
);

router.put(
  "/me/packages/:packageId",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Coach profile not found" });
    const pkg = await CoachingPackage.findOneAndUpdate(
      { _id: req.params.packageId, coachId: profile._id },
      { $set: req.body },
      { new: true }
    );
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: "Coach not found" });
    const profile = await CoachProfile.findById(req.params.id).lean();
    if (!profile || !profile.approved) return res.status(404).json({ error: "Coach not found" });
    const packages = await CoachingPackage.find({ coachId: profile._id, active: true }).sort({ price: 1 }).lean();
    res.json(publicCoachPayload(profile, packages));
  })
);

router.put(
  "/:id/approve",
  auth,
  allow("admin"),
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findByIdAndUpdate(
      req.params.id,
      { $set: { approved: Boolean(req.body?.approved ?? true), featured: Boolean(req.body?.featured ?? false) } },
      { new: true }
    );
    if (!profile) return res.status(404).json({ error: "Coach not found" });
    res.json(profile);
  })
);

module.exports = router;
