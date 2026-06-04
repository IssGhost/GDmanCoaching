const router = require("express").Router();
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const CoachProfile = require("../models/CoachProfile");
const CoachingPackage = require("../models/CoachingPackage");
const Order = require("../models/Order");
const PaymentSplit = require("../models/PaymentSplit");
const VideoSubmission = require("../models/VideoSubmission");
const Inquiry = require("../models/Inquiry");
const { publicBaseUrl } = require("../utils/runtimeConfig");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const STRIPE_API = "https://api.stripe.com/v1";
const CENTS = (amount) => Math.round(Number(amount || 0) * 100);
const DOLLARS = (cents) => Math.round(Number(cents || 0)) / 100;

async function stripeRequest(path, body) {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const params = new URLSearchParams();
  Object.entries(body || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    params.append(key, String(value));
  });

  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe request failed: ${response.status}`);
  }
  return data;
}

function parseVerifiedStripeEvent(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    const error = new Error("Stripe webhook is not configured.");
    error.statusCode = 503;
    throw error;
  }
  if (!Buffer.isBuffer(req.body)) {
    const error = new Error("Stripe webhook requires the raw request body.");
    error.statusCode = 400;
    throw error;
  }
  const signature = String(req.headers["stripe-signature"] || "");
  const parts = Object.fromEntries(signature.split(",").map((part) => part.split("=", 2)));
  const timestamp = Number(parts.t);
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${req.body.toString("utf8")}`).digest("hex");
  const received = String(parts.v1 || "");
  const recent = Number.isFinite(timestamp) && Math.abs(Date.now() / 1000 - timestamp) <= 300;
  const matches = received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  if (!recent || !matches) {
    const error = new Error("Invalid Stripe webhook signature.");
    error.statusCode = 400;
    throw error;
  }
  return JSON.parse(req.body.toString("utf8"));
}

function createOrderNumber(prefix = "PBC") {
  return `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function buildSplit({ total, platformFeePercent, coach, manualSplits = [] }) {
  const platformFee = Number(((total * platformFeePercent) / 100).toFixed(2));
  const available = Number((total - platformFee).toFixed(2));

  if (manualSplits.length) {
    const recipients = manualSplits.map((item) => ({
      coachId: item.coachId || coach._id,
      stripeAccountId: item.stripeAccountId || item.connectedAccountId || coach.stripeAccountId || "",
      label: item.label || "Split recipient",
      role: item.role || "coach",
      percentage: Number(item.percentage || 0),
      amount: Number(((available * Number(item.percentage || 0)) / 100).toFixed(2)),
      status: "pending",
    }));
    const allocated = recipients.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const remainder = Number((available - allocated).toFixed(2));
    if (remainder > 0) {
      recipients.unshift({
        coachId: coach._id,
        stripeAccountId: coach.stripeAccountId || "",
        label: "Primary coach",
        role: "main_coach",
        percentage: null,
        amount: remainder,
        status: "pending",
      });
    }
    return { platformFee, recipients, chargeType: recipients.length > 1 ? "separate_charges_and_transfers" : "destination_charge" };
  }

  return {
    platformFee,
    chargeType: "destination_charge",
    recipients: [
      {
        coachId: coach._id,
        stripeAccountId: coach.stripeAccountId || "",
        label: "Primary coach",
        role: "main_coach",
        percentage: 100,
        amount: available,
        status: "pending",
      },
    ],
  };
}

router.post(
  "/connect/account",
  auth,
  asyncHandler(async (req, res) => {
    const profile = await CoachProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: "Create a coach profile before onboarding payments." });

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Payments are not configured yet. Please contact support." });
    const clientUrl = publicBaseUrl(req);
    if (!clientUrl) return res.status(503).json({ error: "The public website URL is not configured yet. Please contact support." });
    let accountId = profile.stripeAccountId;
    let onboardingUrl = "";
    let mode = "stripe";

    {
      if (!accountId) {
        const account = await stripeRequest("/accounts", {
          type: "express",
          country: "US",
          email: req.user.email,
          "capabilities[card_payments][requested]": true,
          "capabilities[transfers][requested]": true,
          "business_type": "individual",
        });
        accountId = account.id;
      }

      const link = await stripeRequest("/account_links", {
        account: accountId,
        refresh_url: `${clientUrl}/coach/dashboard?stripe=refresh`,
        return_url: `${clientUrl}/coach/dashboard?stripe=return`,
        type: "account_onboarding",
      });
      onboardingUrl = link.url;
    }

    profile.stripeAccountId = accountId;
    await profile.save();

    res.json({ accountId, onboardingUrl, mode, profile });
  })
);

router.post(
  "/checkout/session",
  auth,
  asyncHandler(async (req, res) => {
    const { coachId, packageId, goals, title, description, skillLevel, splitRecipients = [] } = req.body || {};
    const coach = await CoachProfile.findById(coachId);
    if (!coach || !coach.approved) return res.status(404).json({ error: "Coach is not available for booking." });

    const pkg = await CoachingPackage.findOne({ _id: packageId, coachId: coach._id, active: true });
    if (!pkg) return res.status(404).json({ error: "Coaching package not found." });

    const total = Number(pkg.price || 0);
    if (!Number.isFinite(total) || total <= 0) return res.status(400).json({ error: "This plan does not have a valid price yet. Message the coach for a quote." });
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Online payments are temporarily unavailable. Please contact support." });
    if (!coach.stripeAccountId) return res.status(400).json({ error: "This coach has not finished payment setup yet." });
    const clientUrl = publicBaseUrl(req);
    if (!clientUrl) return res.status(503).json({ error: "The public website URL is not configured yet. Please contact support." });
    const split = buildSplit({
      total,
      platformFeePercent: coach.defaultPlatformFeePercent || 15,
      coach,
      manualSplits: splitRecipients,
    });

    const order = await Order.create({
      userId: req.user._id,
      coachId: coach._id,
      packageId: pkg._id,
      number: createOrderNumber(),
      orderType: "coaching",
      items: [{ packageId: String(pkg._id), name: pkg.title, price: total, qty: 1, tag: pkg.reviewType }],
      status: "pending",
      subtotal: total,
      tax: 0,
      total,
      platformFee: split.platformFee,
      paymentMode: split.chargeType === "separate_charges_and_transfers" ? "stripe_separate_transfers" : "stripe_destination_charge",
      metadata: { goals, skillLevel },
    });

    const dueAt = new Date(Date.now() + Number(pkg.turnaroundHours || coach.turnaroundHours || 48) * 60 * 60 * 1000);
    const submission = await VideoSubmission.create({
      playerId: req.user._id,
      coachId: coach._id,
      packageId: pkg._id,
      orderId: order._id,
      title: title || `${pkg.title} with ${coach.displayName}`,
      description: description || "",
      goals: goals || "",
      skillLevel: skillLevel || "",
      status: "awaiting_payment",
      dueAt,
    });

    order.submissionId = submission._id;
    await order.save();

    const paymentSplit = await PaymentSplit.create({
      orderId: order._id,
      chargeType: split.chargeType,
      platformFee: split.platformFee,
      recipients: split.recipients,
      status: "pending",
      notes: split.chargeType === "separate_charges_and_transfers" ? "Multiple recipient split configured." : "Primary coach payout configured.",
    });

    let checkoutUrl = `${clientUrl}/dashboard/submissions/${submission._id}`;
    let stripeSession = null;

    {
      const success = `${clientUrl}/dashboard/submissions/${submission._id}?paid=1`;
      const cancel = `${clientUrl}/coaches/${coach._id}?canceled=1`;
      const sessionBody = {
        mode: "payment",
        success_url: success,
        cancel_url: cancel,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": pkg.title,
        "line_items[0][price_data][product_data][description]": pkg.description || "Pickleball video coaching review",
        "line_items[0][price_data][unit_amount]": CENTS(total),
        "line_items[0][quantity]": 1,
        "metadata[orderId]": String(order._id),
        "metadata[submissionId]": String(submission._id),
        payment_intent_data_application_fee_amount: CENTS(split.platformFee),
      };

      if (split.chargeType === "destination_charge" && coach.stripeAccountId) {
        sessionBody["payment_intent_data[transfer_data][destination]"] = coach.stripeAccountId;
      }

      stripeSession = await stripeRequest("/checkout/sessions", sessionBody);
      checkoutUrl = stripeSession.url;
      order.stripeCheckoutSessionId = stripeSession.id;
      order.stripeCheckoutUrl = checkoutUrl;
      paymentSplit.stripeCheckoutSessionId = stripeSession.id;
      await order.save();
      await paymentSplit.save();
    }

    res.json({ checkoutUrl, order, submission, paymentSplit, stripeSession });
  })
);

router.post(
  "/quotes/:inquiryId/checkout",
  auth,
  asyncHandler(async (req, res) => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: "Online payments are temporarily unavailable. Please contact support." });
    const inquiry = await Inquiry.findById(req.params.inquiryId).populate("coachId");
    if (!inquiry || String(inquiry.playerId) !== String(req.user._id)) return res.status(404).json({ error: "Approved quote not found." });
    if (inquiry.quote?.status !== "approved") return res.status(400).json({ error: "Approve the quote before checkout." });
    const coach = inquiry.coachId;
    if (!coach?.stripeAccountId) return res.status(400).json({ error: "This coach has not finished payment setup yet." });
    const clientUrl = publicBaseUrl(req);
    if (!clientUrl) return res.status(503).json({ error: "The public website URL is not configured yet. Please contact support." });
    const total = Number(inquiry.quote.amount || 0);
    if (!Number.isFinite(total) || total <= 0) return res.status(400).json({ error: "This quote does not have a valid amount." });
    const existing = await Order.findOne({ userId: req.user._id, "metadata.inquiryId": String(inquiry._id), status: { $in: ["pending", "paid"] } });
    if (existing?.stripeCheckoutUrl && existing.status === "pending") return res.json({ checkoutUrl: existing.stripeCheckoutUrl, order: existing });
    if (existing?.status === "paid") return res.status(400).json({ error: "This quote has already been paid." });

    const split = buildSplit({ total, platformFeePercent: coach.defaultPlatformFeePercent || 15, coach });
    const order = await Order.create({ userId: req.user._id, coachId: coach._id, number: createOrderNumber(), orderType: "coaching", items: [{ name: inquiry.subject, price: total, qty: 1, tag: "custom_quote" }], status: "pending", subtotal: total, tax: 0, total, platformFee: split.platformFee, paymentMode: "stripe_destination_charge", metadata: { inquiryId: String(inquiry._id) } });
    const submission = await VideoSubmission.create({ playerId: req.user._id, coachId: coach._id, orderId: order._id, title: inquiry.subject, description: inquiry.quote.scope || "", status: "awaiting_payment", dueAt: new Date(Date.now() + Number(coach.turnaroundHours || 72) * 60 * 60 * 1000) });
    order.submissionId = submission._id;
    const paymentSplit = await PaymentSplit.create({ orderId: order._id, chargeType: split.chargeType, platformFee: split.platformFee, recipients: split.recipients, status: "pending", notes: "Custom quote payment." });
    const success = `${clientUrl}/dashboard/submissions/${submission._id}?paid=1`;
    const cancel = `${clientUrl}/messages`;
    const session = await stripeRequest("/checkout/sessions", { mode: "payment", success_url: success, cancel_url: cancel, "line_items[0][price_data][currency]": "usd", "line_items[0][price_data][product_data][name]": inquiry.subject, "line_items[0][price_data][product_data][description]": inquiry.quote.scope || "Custom coaching quote", "line_items[0][price_data][unit_amount]": CENTS(total), "line_items[0][quantity]": 1, "metadata[orderId]": String(order._id), "metadata[submissionId]": String(submission._id), payment_intent_data_application_fee_amount: CENTS(split.platformFee), "payment_intent_data[transfer_data][destination]": coach.stripeAccountId });
    order.stripeCheckoutSessionId = session.id; order.stripeCheckoutUrl = session.url; paymentSplit.stripeCheckoutSessionId = session.id;
    await Promise.all([order.save(), paymentSplit.save()]);
    res.json({ checkoutUrl: session.url, order, submission });
  })
);

router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const event = parseVerifiedStripeEvent(req);
    const session = event.data?.object;
    if (event.type === "checkout.session.completed" && session?.metadata?.orderId) {
      const order = await Order.findByIdAndUpdate(
        session.metadata.orderId,
        { $set: { status: "paid", stripePaymentIntentId: session.payment_intent } },
        { new: true }
      );
      if (order?.submissionId) {
        await VideoSubmission.findByIdAndUpdate(order.submissionId, { $set: { status: "awaiting_upload" } });
      }
      await PaymentSplit.findOneAndUpdate({ orderId: session.metadata.orderId }, { $set: { status: "paid", stripePaymentIntentId: session.payment_intent } });
    }
    res.json({ received: true });
  })
);

router.get(
  "/splits/my",
  auth,
  asyncHandler(async (req, res) => {
    const coach = await CoachProfile.findOne({ userId: req.user._id });
    if (!coach) return res.json([]);
    const splits = await PaymentSplit.find({ "recipients.coachId": coach._id }).sort({ createdAt: -1 });
    res.json(splits);
  })
);

module.exports = router;
