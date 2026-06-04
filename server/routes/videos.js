const router = require("express").Router();
const { auth, allow } = require("../middleware/auth");
const CoachProfile = require("../models/CoachProfile");
const VideoSubmission = require("../models/VideoSubmission");
const VideoReview = require("../models/VideoReview");
const { configuredClientOrigins } = require("../utils/runtimeConfig");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function createCloudflareUpload(maxDurationSeconds = 3600) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_TOKEN;
  if (!accountId || !token) return null;

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maxDurationSeconds,
      requireSignedURLs: false,
      allowedOrigins: configuredClientOrigins().map((origin) => new URL(origin).hostname),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.errors?.[0]?.message || "Cloudflare upload URL failed");
  return data.result;
}

async function canAccessSubmission(req, submission) {
  if (!submission) return false;
  if (req.user.role === "admin") return true;
  if (String(submission.playerId) === String(req.user._id)) return true;
  const coach = await CoachProfile.findOne({ userId: req.user._id });
  return coach && String(submission.coachId) === String(coach._id);
}

router.get(
  "/submissions/my",
  auth,
  asyncHandler(async (req, res) => {
    const rows = await VideoSubmission.find({ playerId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("coachId", "displayName headline avatarUrl rating")
      .populate("packageId", "title price reviewType turnaroundHours");
    res.json(rows);
  })
);

router.get(
  "/submissions/coach",
  auth,
  asyncHandler(async (req, res) => {
    const coach = await CoachProfile.findOne({ userId: req.user._id });
    if (!coach && req.user.role !== "admin") return res.json([]);
    const filter = req.user.role === "admin" ? {} : { coachId: coach._id };
    const rows = await VideoSubmission.find(filter)
      .sort({ status: 1, dueAt: 1, createdAt: -1 })
      .populate("playerId", "fullName email")
      .populate("packageId", "title price reviewType turnaroundHours");
    res.json(rows);
  })
);

router.get(
  "/submissions/:id",
  auth,
  asyncHandler(async (req, res) => {
    const row = await VideoSubmission.findById(req.params.id)
      .populate("coachId", "displayName headline avatarUrl rating")
      .populate("packageId", "title price reviewType turnaroundHours maxVideoMinutes")
      .populate("playerId", "fullName email");
    if (!row) return res.status(404).json({ error: "Submission not found" });
    if (!(await canAccessSubmission(req, row))) return res.status(403).json({ error: "Forbidden" });
    const review = await VideoReview.findOne({ submissionId: row._id });
    res.json({ submission: row, review });
  })
);

router.post(
  "/submissions/:id/upload-url",
  auth,
  asyncHandler(async (req, res) => {
    const row = await VideoSubmission.findById(req.params.id).populate("packageId", "maxVideoMinutes");
    if (!row) return res.status(404).json({ error: "Submission not found" });
    if (String(row.playerId) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    if (!["awaiting_upload", "uploading", "needs_revision"].includes(row.status)) {
      return res.status(400).json({ error: `Cannot upload while submission is ${row.status}` });
    }

    const maxMinutes = Math.min(Number(row.packageId?.maxVideoMinutes || 15), 15);
    const upload = await createCloudflareUpload(maxMinutes * 60);

    if (upload) {
      row.provider = "cloudflare";
      row.uploadUrl = upload.uploadURL;
      row.uploadId = upload.uid;
      row.status = "uploading";
      await row.save();
      return res.json({ provider: "cloudflare", uploadUrl: upload.uploadURL, uploadId: upload.uid, submission: row });
    }

    return res.status(503).json({ error: "Video uploads are not configured. Please contact support." });
  })
);

router.put(
  "/submissions/:id/video",
  auth,
  asyncHandler(async (req, res) => {
    const row = await VideoSubmission.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Submission not found" });
    if (String(row.playerId) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    const { videoUrl, assetId, playbackId, thumbnailUrl, durationSeconds, status } = req.body || {};
    if (videoUrl !== undefined) row.videoUrl = videoUrl;
    if (assetId !== undefined) row.assetId = assetId;
    if (playbackId !== undefined) row.playbackId = playbackId;
    if (thumbnailUrl !== undefined) row.thumbnailUrl = thumbnailUrl;
    if (durationSeconds !== undefined) {
      const duration = Number(durationSeconds);
      if (duration > 15 * 60) {
        return res.status(400).json({ error: "Videos must be 15 minutes or shorter. Please trim your clip and upload again." });
      }
      row.durationSeconds = duration;
    }
    row.status = status || "ready_for_review";
    await row.save();
    res.json(row);
  })
);

router.put(
  "/submissions/:id/status",
  auth,
  asyncHandler(async (req, res) => {
    const row = await VideoSubmission.findById(req.params.id);
    if (!row) return res.status(404).json({ error: "Submission not found" });
    if (!(await canAccessSubmission(req, row))) return res.status(403).json({ error: "Forbidden" });
    row.status = req.body?.status || row.status;
    await row.save();
    res.json(row);
  })
);

router.post(
  "/webhook/cloudflare",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const uid = body.uid || body.video?.uid || body.data?.uid;
    if (uid) {
      const set = {
        status: "ready_for_review",
        assetId: uid,
        playbackId: uid,
        thumbnailUrl: body.thumbnail || body.video?.thumbnail || "",
      };
      await VideoSubmission.findOneAndUpdate({ uploadId: uid }, { $set: set });
    }
    res.json({ received: true });
  })
);

router.get(
  "/admin/submissions",
  auth,
  allow("admin"),
  asyncHandler(async (_req, res) => {
    const rows = await VideoSubmission.find({})
      .sort({ createdAt: -1 })
      .populate("coachId", "displayName")
      .populate("playerId", "fullName email")
      .populate("packageId", "title price");
    res.json(rows);
  })
);

module.exports = router;
