const router = require("express").Router();
const { auth } = require("../middleware/auth");
const CoachProfile = require("../models/CoachProfile");
const VideoSubmission = require("../models/VideoSubmission");
const VideoReview = require("../models/VideoReview");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function getCoachForUser(userId) {
  return CoachProfile.findOne({ userId });
}

async function assertCoachOwns(req, submission) {
  if (req.user.role === "admin") return true;
  const coach = await getCoachForUser(req.user._id);
  return coach && String(coach._id) === String(submission.coachId);
}

router.get(
  "/submission/:submissionId",
  auth,
  asyncHandler(async (req, res) => {
    const submission = await VideoSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    const isPlayer = String(submission.playerId) === String(req.user._id);
    const isCoach = await assertCoachOwns(req, submission);
    if (!isPlayer && !isCoach) return res.status(403).json({ error: "Forbidden" });
    const review = await VideoReview.findOne({ submissionId: submission._id });
    res.json(review || null);
  })
);

router.post(
  "/:submissionId/comments",
  auth,
  asyncHandler(async (req, res) => {
    const submission = await VideoSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    if (!(await assertCoachOwns(req, submission))) return res.status(403).json({ error: "Forbidden" });

    const coach = req.user.role === "admin" ? await CoachProfile.findById(submission.coachId) : await getCoachForUser(req.user._id);
    const review = await VideoReview.findOneAndUpdate(
      { submissionId: submission._id },
      {
        $setOnInsert: { submissionId: submission._id, coachId: submission.coachId, playerId: submission.playerId },
        $push: {
          comments: {
            timestampSeconds: Number(req.body?.timestampSeconds || 0),
            category: req.body?.category || "General",
            comment: req.body?.comment || "",
          },
        },
      },
      { upsert: true, new: true }
    );

    submission.status = "in_review";
    await submission.save();
    res.json(review);
  })
);

router.put(
  "/:submissionId/draft",
  auth,
  asyncHandler(async (req, res) => {
    const submission = await VideoSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    if (!(await assertCoachOwns(req, submission))) return res.status(403).json({ error: "Forbidden" });

    const set = {
      summary: req.body?.summary || "",
      strengths: req.body?.strengths || "",
      improvements: req.body?.improvements || "",
      drills: req.body?.drills || "",
      finalNotes: req.body?.finalNotes || "",
      responseVideoUrl: req.body?.responseVideoUrl || "",
      voiceRecordingUrl: req.body?.voiceRecordingUrl || "",
      transcriptPdfUrl: req.body?.transcriptPdfUrl || "",
      drillPlanPdfUrl: req.body?.drillPlanPdfUrl || "",
    };

    const review = await VideoReview.findOneAndUpdate(
      { submissionId: submission._id },
      { $setOnInsert: { submissionId: submission._id, coachId: submission.coachId, playerId: submission.playerId }, $set: set },
      { upsert: true, new: true }
    );
    res.json(review);
  })
);

router.post(
  "/:submissionId/complete",
  auth,
  asyncHandler(async (req, res) => {
    const submission = await VideoSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    if (!(await assertCoachOwns(req, submission))) return res.status(403).json({ error: "Forbidden" });

    const review = await VideoReview.findOneAndUpdate(
      { submissionId: submission._id },
      {
        $setOnInsert: { submissionId: submission._id, coachId: submission.coachId, playerId: submission.playerId },
        $set: {
          summary: req.body?.summary || "",
          strengths: req.body?.strengths || "",
          improvements: req.body?.improvements || "",
          drills: req.body?.drills || "",
          finalNotes: req.body?.finalNotes || "",
          responseVideoUrl: req.body?.responseVideoUrl || "",
          voiceRecordingUrl: req.body?.voiceRecordingUrl || "",
          transcriptPdfUrl: req.body?.transcriptPdfUrl || "",
          drillPlanPdfUrl: req.body?.drillPlanPdfUrl || "",
          status: "complete",
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    submission.status = "reviewed";
    await submission.save();
    res.json(review);
  })
);

router.get(
  "/player",
  auth,
  asyncHandler(async (req, res) => {
    const rows = await VideoReview.find({ playerId: req.user._id }).sort({ updatedAt: -1 });
    res.json(rows);
  })
);

router.get(
  "/coach",
  auth,
  asyncHandler(async (req, res) => {
    const coach = await getCoachForUser(req.user._id);
    if (!coach) return res.json([]);
    const rows = await VideoReview.find({ coachId: coach._id }).sort({ updatedAt: -1 });
    res.json(rows);
  })
);

module.exports = router;
