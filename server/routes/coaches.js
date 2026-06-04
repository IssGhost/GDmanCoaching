const router = require("express").Router();
const mongoose = require("mongoose");
const CoachProfile = require("../models/CoachProfile");
const CoachingPackage = require("../models/CoachingPackage");
const User = require("../models/User");
const VideoSubmission = require("../models/VideoSubmission");
const PaymentSplit = require("../models/PaymentSplit");
const { auth, allow } = require("../middleware/auth");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function cleanArray(value) {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function cleanSocialLinks(body = {}) {
  const social = body.socialLinks || {};
  return {
    instagram: body.instagram ?? social.instagram ?? "",
    youtube: body.youtube ?? social.youtube ?? "",
    facebook: body.facebook ?? social.facebook ?? "",
    tiktok: body.tiktok ?? social.tiktok ?? "",
    website: body.website ?? social.website ?? "",
  };
}

<<<<<<< HEAD
=======
function packageInput(body = {}) {
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    const error = new Error("Enter a plan price greater than $0 before publishing.");
    error.statusCode = 400;
    throw error;
  }
  return { ...body, price, discountPercent: Math.min(Math.max(Number(body.discountPercent || 0), 0), 100), maxVideoMinutes: Math.min(Number(body.maxVideoMinutes || 15), 15) };
}

>>>>>>> origin/codex/display-mongodb-data-on-webpage-7sumqq
function duprProfileUrl(duprId) {
  return duprId ? `https://dashboard.dupr.com/dashboard/player/${encodeURIComponent(duprId)}` : "";
}

function publicCoachPayload(profile, packages = []) {
  const obj = profile.toObject ? profile.toObject() : profile;
  return {
    ...obj,
    packages,
    duprProfileUrl: duprProfileUrl(obj.duprId),
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
      country: body.country || "",
      phone: body.phone || current.phone || "",
      contactEmail: body.contactEmail || current.email,
      presenceStatus: body.presenceStatus || "offline",
      acceptingInquiries: body.acceptingInquiries !== false,
      organization: body.organization || "",
      specialties: cleanArray(body.specialties),
      skillLevels: cleanArray(body.skillLevels),
      yearsExperience: Number(body.yearsExperience || body.playingExperienceYears || 0),
      playingExperienceYears: Number(body.playingExperienceYears || body.yearsExperience || 0),
      coachingExperienceYears: Number(body.coachingExperienceYears || 0),
      duprId: String(body.duprId || "").trim(),
      duprSingles: body.duprSingles === "" || body.duprSingles === undefined ? null : Number(body.duprSingles),
      duprDoubles: body.duprDoubles === "" || body.duprDoubles === undefined ? null : Number(body.duprDoubles),
      socialLinks: cleanSocialLinks(body),
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

<<<<<<< HEAD
    const starterPackages = [
      {
        title: "Single Video Analysis",
        description: "Upload one match or drill clip and receive timestamped notes, strengths, fixes, and drills. Includes coach-entered pricing and can be adjusted through a custom quote after discussion.",
        price: 0,
        reviewType: "single_video",
        turnaroundHours: update.turnaroundHours,
        maxVideoMinutes: 15,
      },
      {
        title: "Strategy Consultation",
        description: "A remote review focused on positioning, third-shot choices, resets, and partner movement. Includes coach-entered pricing and can be adjusted through a custom quote after discussion.",
        price: 0,
        reviewType: "strategy_consultation",
        turnaroundHours: update.turnaroundHours,
        maxVideoMinutes: 15,
      },
    ];

    const existingPackages = await CoachingPackage.countDocuments({ coachId: profile._id });
    if (!existingPackages) {
      await CoachingPackage.insertMany(starterPackages.map((pkg) => ({ ...pkg, coachId: profile._id })));
    }

=======
>>>>>>> origin/codex/display-mongodb-data-on-webpage-7sumqq
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
      country: body.country,
      phone: body.phone,
      contactEmail: body.contactEmail,
      presenceStatus: body.presenceStatus,
      acceptingInquiries: body.acceptingInquiries,
      organization: body.organization,
      specialties: body.specialties !== undefined ? cleanArray(body.specialties) : undefined,
      skillLevels: body.skillLevels !== undefined ? cleanArray(body.skillLevels) : undefined,
      yearsExperience: body.yearsExperience !== undefined ? Number(body.yearsExperience) : undefined,
      playingExperienceYears: body.playingExperienceYears !== undefined ? Number(body.playingExperienceYears) : undefined,
      coachingExperienceYears: body.coachingExperienceYears !== undefined ? Number(body.coachingExperienceYears) : undefined,
      duprId: body.duprId !== undefined ? String(body.duprId || "").trim() : undefined,
      duprSingles: body.duprSingles !== undefined && body.duprSingles !== "" ? Number(body.duprSingles) : body.duprSingles === "" ? null : undefined,
      duprDoubles: body.duprDoubles !== undefined && body.duprDoubles !== "" ? Number(body.duprDoubles) : body.duprDoubles === "" ? null : undefined,
      socialLinks: ["socialLinks", "instagram", "youtube", "facebook", "tiktok", "website"].some((key) => Object.prototype.hasOwnProperty.call(body, key)) ? cleanSocialLinks(body) : undefined,
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
<<<<<<< HEAD
    const pkg = await CoachingPackage.create({ ...req.body, price: Math.max(Number(req.body?.price || 0), 0), discountPercent: Math.min(Math.max(Number(req.body?.discountPercent || 0), 0), 100), maxVideoMinutes: Math.min(Number(req.body?.maxVideoMinutes || 15), 15), coachId: profile._id });
=======
    const pkg = await CoachingPackage.create({ ...packageInput(req.body), coachId: profile._id });
>>>>>>> origin/codex/display-mongodb-data-on-webpage-7sumqq
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
      { $set: packageInput(req.body) },
      { new: true, runValidators: true }
    );
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  })
);

router.get(
  "/dashboard",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile && req.user.role !== "admin") {
      return res.status(404).json({ error: "Coach profile not found" });
    }

    const filter = req.user.role === "admin" && !profile ? {} : { coachId: profile._id };
    const [packages, submissions, splits] = await Promise.all([
      profile ? CoachingPackage.find({ coachId: profile._id }).sort({ createdAt: -1 }) : [],
      VideoSubmission.find(filter).sort({ status: 1, dueAt: 1, createdAt: -1 }).populate("playerId", "fullName email").populate("packageId", "title reviewType turnaroundHours maxVideoMinutes"),
      PaymentSplit.find({}).sort({ createdAt: -1 }).limit(25),
    ]);

    res.json({ profile, packages, submissions, splits });
  })
);

router.post(
  "/packages",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Coach profile not found" });
<<<<<<< HEAD
    const pkg = await CoachingPackage.create({ ...req.body, price: Math.max(Number(req.body?.price || 0), 0), discountPercent: Math.min(Math.max(Number(req.body?.discountPercent || 0), 0), 100), maxVideoMinutes: Math.min(Number(req.body?.maxVideoMinutes || 15), 15), coachId: profile._id });
=======
    const pkg = await CoachingPackage.create({ ...packageInput(req.body), coachId: profile._id });
>>>>>>> origin/codex/display-mongodb-data-on-webpage-7sumqq
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
