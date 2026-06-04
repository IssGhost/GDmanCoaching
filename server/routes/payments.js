const router = require("express").Router();
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const CoachProfile = require("../models/CoachProfile");
const CoachingPackage = require("../models/CoachingPackage");
const Order = require("../models/Order");
const PaymentSplit = require("../models/PaymentSplit");
const VideoSubmission = require("../models/VideoSubmission");

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

    let accountId = profile.stripeAccountId;
    let onboardingUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/coach/dashboard?stripe=demo`;
    let mode = "demo";

    if (process.env.STRIPE_SECRET_KEY) {
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
        refresh_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/coach/dashboard?stripe=refresh`,
        return_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/coach/dashboard?stripe=return`,
        type: "account_onboarding",
      });
      onboardingUrl = link.url;
      mode = "stripe";
    } else if (!accountId) {
      accountId = `acct_demo_${crypto.randomBytes(5).toString("hex")}`;
    }

    profile.stripeAccountId = accountId;
    if (!process.env.STRIPE_SECRET_KEY) {
      profile.stripeOnboardingComplete = true;
      profile.payoutsEnabled = true;
    }
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
      status: process.env.STRIPE_SECRET_KEY && total > 0 ? "pending" : "paid",
      subtotal: total,
      tax: 0,
      total,
      platformFee: split.platformFee,
      paymentMode: process.env.STRIPE_SECRET_KEY && total > 0
        ? split.chargeType === "separate_charges_and_transfers"
          ? "stripe_separate_transfers"
          : "stripe_destination_charge"
        : "direct_coach_pricing",
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
      status: process.env.STRIPE_SECRET_KEY && total > 0 ? "awaiting_payment" : "awaiting_upload",
      dueAt,
    });

    order.submissionId = submission._id;
    await order.save();

    const paymentSplit = await PaymentSplit.create({
      orderId: order._id,
      chargeType: split.chargeType,
      platformFee: split.platformFee,
      recipients: split.recipients,
      status: process.env.STRIPE_SECRET_KEY && total > 0 ? "pending" : "paid",
      notes: split.chargeType === "separate_charges_and_transfers" ? "Multiple recipient split configured." : "Primary coach payout configured.",
    });

    let checkoutUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/submissions/${submission._id}`;
    let stripeSession = null;

    if (process.env.STRIPE_SECRET_KEY && total > 0) {
      const success = `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard/submissions/${submission._id}?paid=1`;
      const cancel = `${process.env.CLIENT_URL || "http://localhost:5173"}/coaches/${coach._id}?canceled=1`;
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
  "/webhook",
  asyncHandler(async (req, res) => {
    const event = req.body || {};
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
