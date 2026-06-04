const router = require("express").Router();
const { auth } = require("../middleware/auth");
const Inquiry = require("../models/Inquiry");
const CoachProfile = require("../models/CoachProfile");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const populate = (query) =>
  query
    .populate("playerId", "fullName email phone")
    .populate({
      path: "coachId",
      select: "displayName avatarUrl contactEmail userId presenceStatus acceptingInquiries",
      populate: {
        path: "userId",
        select: "email fullName role roles",
      },
    });

function currentUserId(req) {
  return String(req.user?._id || req.user?.id || "");
}

function sameId(a, b) {
  return Boolean(a && b && String(a) === String(b));
}

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function cleanRequestedServices(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function cleanDiscount(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), 100);
}

async function access(req, id) {
  const row = await populate(Inquiry.findById(id));
  if (!row) return null;

  const userId = currentUserId(req);
  const isPlayer = sameId(row.playerId?._id || row.playerId, userId);
  const isCoach = sameId(row.coachId?.userId?._id || row.coachId?.userId, userId);
  const isAdmin = req.user.role === "admin";

  return isPlayer || isCoach || isAdmin ? row : false;
}

function assertCustomer(req, row) {
  const userId = currentUserId(req);
  const playerId = String(row.playerId?._id || row.playerId || "");

  if (playerId !== userId) {
    const error = new Error("Only the customer can complete this action.");
    error.statusCode = 403;
    throw error;
  }
}

function assertCoach(req, row) {
  const userId = currentUserId(req);
  const coachUserId = String(row.coachId?.userId?._id || row.coachId?.userId || "");

  if (coachUserId !== userId && req.user.role !== "admin") {
    const error = new Error("Only the coach can complete this action.");
    error.statusCode = 403;
    throw error;
  }
}

router.get(
  "/my",
  auth,
  asyncHandler(async (req, res) => {
    let filter;

    if (req.user.role === "admin") {
      filter = {};
    } else {
      const coach = await CoachProfile.findOne({ userId: currentUserId(req) });

      filter = coach
        ? {
            $or: [{ playerId: currentUserId(req) }, { coachId: coach._id }],
          }
        : {
            playerId: currentUserId(req),
          };
    }

    const rows = await populate(Inquiry.find(filter).sort({ updatedAt: -1 }));
    res.json(rows);
  })
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const coach = await CoachProfile.findById(req.body?.coachId);

    if (!coach || !coach.approved) {
      return res.status(404).json({ error: "Coach not found" });
    }

    if (!coach.acceptingInquiries) {
      return res.status(400).json({ error: "This coach is not accepting new inquiries right now." });
    }

    const subject = cleanText(req.body?.subject, "Custom quote request");
    const body = cleanText(req.body?.message);
    const requestedServices = cleanRequestedServices(req.body?.requestedServices);

    if (!body) {
      return res.status(400).json({
        error: "Please include your goals, skill level, or notes for the coach before sending this request.",
      });
    }

    const row = await Inquiry.create({
      coachId: coach._id,
      playerId: currentUserId(req),
      subject,
      requestedServices,
      messages: [
        {
          senderId: currentUserId(req),
          body,
        },
      ],
    });

    res.json(await populate(Inquiry.findById(row._id)));
  })
);

router.get(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const row = await access(req, req.params.id);

    if (row === false) return res.status(403).json({ error: "Forbidden" });
    if (!row) return res.status(404).json({ error: "Inquiry not found" });

    res.json(row);
  })
);

router.post(
  "/:id/messages",
  auth,
  asyncHandler(async (req, res) => {
    const row = await access(req, req.params.id);

    if (row === false) return res.status(403).json({ error: "Forbidden" });
    if (!row) return res.status(404).json({ error: "Inquiry not found" });

    const body = cleanText(req.body?.message);

    if (!body) {
      return res.status(400).json({ error: "Message is required" });
    }

    row.messages.push({
      senderId: currentUserId(req),
      body,
    });

    await row.save();

    res.json(await populate(Inquiry.findById(row._id)));
  })
);

router.post(
  "/:id/quote",
  auth,
  asyncHandler(async (req, res) => {
    const row = await access(req, req.params.id);

    if (row === false) return res.status(403).json({ error: "Forbidden" });
    if (!row) return res.status(404).json({ error: "Inquiry not found" });

    assertCoach(req, row);

    const amount = Number(req.body?.amount);
    const scope = cleanText(req.body?.scope);
    const discountPercent = cleanDiscount(req.body?.discountPercent);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Enter a final quote amount greater than $0 before sending.",
      });
    }

    if (!scope) {
      return res.status(400).json({
        error: "Add the scope of work, deliverables, turnaround, or upload instructions before sending the quote.",
      });
    }

    row.quote = {
      amount,
      scope,
      discountPercent,
      status: "sent",
      sentAt: new Date(),
      approvedAt: undefined,
    };

    row.status = "quoted";

    row.messages.push({
      senderId: currentUserId(req),
      body: [
        `I sent a custom quote for $${amount.toFixed(2)}.`,
        discountPercent > 0 ? `Discount included: ${discountPercent}%.` : "",
        "Please review the quote details, then approve or decline it.",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    await row.save();

    res.json(await populate(Inquiry.findById(row._id)));
  })
);

router.post(
  "/:id/quote/approve",
  auth,
  asyncHandler(async (req, res) => {
    const row = await access(req, req.params.id);

    if (row === false) return res.status(403).json({ error: "Forbidden" });
    if (!row) return res.status(404).json({ error: "Inquiry not found" });

    assertCustomer(req, row);

    if (row.quote?.status !== "sent") {
      return res.status(400).json({
        error: "There is no quote waiting for approval.",
      });
    }

    row.quote.status = "approved";
    row.quote.approvedAt = new Date();
    row.status = "approved";

    row.messages.push({
      senderId: currentUserId(req),
      body: "I approved this quote. I can now continue to secure checkout.",
    });

    await row.save();

    res.json({
      inquiry: await populate(Inquiry.findById(row._id)),
      paymentNextStep: "Quote approved. You can now continue to secure checkout.",
    });
  })
);

router.post(
  "/:id/quote/decline",
  auth,
  asyncHandler(async (req, res) => {
    const row = await access(req, req.params.id);

    if (row === false) return res.status(403).json({ error: "Forbidden" });
    if (!row) return res.status(404).json({ error: "Inquiry not found" });

    assertCustomer(req, row);

    if (row.quote?.status !== "sent") {
      return res.status(400).json({
        error: "There is no quote waiting for a response.",
      });
    }

    const message = cleanText(
      req.body?.message,
      "I declined this quote. Please revise the amount, scope, or deliverables so we can discuss it further."
    );

    row.quote.status = "declined";
    row.status = "open";

    row.messages.push({
      senderId: currentUserId(req),
      body: message,
    });

    await row.save();

    res.json(await populate(Inquiry.findById(row._id)));
  })
);

module.exports = router;