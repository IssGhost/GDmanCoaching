const bcrypt = require("bcryptjs");
const User = require("../models/User");
const CoachProfile = require("../models/CoachProfile");
const CoachingPackage = require("../models/CoachingPackage");
const Order = require("../models/Order");
const PaymentSplit = require("../models/PaymentSplit");
const VideoSubmission = require("../models/VideoSubmission");
const VideoReview = require("../models/VideoReview");
const Testimonial = require("../models/Testimonial");

async function upsertUser({ email, password, fullName, phone, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash, fullName, phone, role } },
    { upsert: true, new: true }
  );
}

async function upsertPackage(coachId, pkg) {
  return CoachingPackage.findOneAndUpdate(
    { coachId, title: pkg.title },
    { $set: { ...pkg, coachId, active: true } },
    { upsert: true, new: true }
  );
}

async function seedPickleballDemo() {
  const [customer, coachUser, admin] = await Promise.all([
    upsertUser({
      email: "customer@picklepro.demo",
      password: "customer",
      fullName: "Casey Customer",
      phone: "512-555-0101",
      role: "user",
    }),
    upsertUser({
      email: "coach@picklepro.demo",
      password: "coach",
      fullName: "Jordan Coach",
      phone: "512-555-0202",
      role: "coach",
    }),
    upsertUser({
      email: "admin@picklepro.demo",
      password: "admin",
      fullName: "Avery Admin",
      phone: "512-555-0303",
      role: "admin",
    }),
  ]);

  const coach = await CoachProfile.findOneAndUpdate(
    { userId: coachUser._id },
    {
      $set: {
        userId: coachUser._id,
        displayName: "Jordan Coach",
        headline: "Private lessons, doubles clinics, and video breakdowns",
        bio:
          "Jordan helps beginner and intermediate players build cleaner footwork, better kitchen positioning, stronger serves, and smarter doubles decisions. Available for in-person sessions around Round Rock/Austin and online video review.",
        city: "Round Rock",
        state: "TX",
        specialties: ["Private Lessons", "Doubles Strategy", "Footwork", "Third-Shot Drops", "Video Review"],
        skillLevels: ["Beginner", "Intermediate", "Tournament Prep"],
        yearsExperience: 7,
        rating: 5,
        reviewCount: 42,
        approved: true,
        featured: true,
        videoReviewRate: 45,
        liveSessionRate: 85,
        turnaroundHours: 24,
        stripeAccountId: "acct_demo_jordan_coach",
        stripeOnboardingComplete: true,
        payoutsEnabled: true,
        defaultPlatformFeePercent: 15,
      },
    },
    { upsert: true, new: true }
  );

  const packages = await Promise.all([
    upsertPackage(coach._id, {
      title: "1-Hour Private Lesson",
      description: "Meet locally for on-court technique work, drilling, positioning, and a simple improvement plan.",
      price: 85,
      reviewType: "live_session",
      turnaroundHours: 24,
      maxVideoMinutes: 0,
      includesResponseVideo: false,
    }),
    upsertPackage(coach._id, {
      title: "Doubles Clinic Seat",
      description: "A small-group clinic focused on kitchen movement, stacking, partner communication, and point construction.",
      price: 65,
      reviewType: "live_session",
      turnaroundHours: 24,
      maxVideoMinutes: 0,
      includesResponseVideo: false,
    }),
    upsertPackage(coach._id, {
      title: "Single Video Review",
      description: "Upload match footage and receive timestamped notes, strengths, fixes, and recommended drills.",
      price: 45,
      reviewType: "single_video",
      turnaroundHours: 24,
      maxVideoMinutes: 12,
      includesResponseVideo: false,
    }),
    upsertPackage(coach._id, {
      title: "Hybrid Training Package",
      description: "One in-person lesson plus one follow-up video review to track improvement after practice.",
      price: 125,
      reviewType: "monthly",
      turnaroundHours: 24,
      maxVideoMinutes: 15,
      includesResponseVideo: true,
    }),
  ]);

  const videoPkg = packages.find((p) => p.title === "Single Video Review") || packages[2];
  const lessonPkg = packages.find((p) => p.title === "1-Hour Private Lesson") || packages[0];

  const videoOrder = await Order.findOneAndUpdate(
    { userId: customer._id, number: "PBC-DEMO-1001" },
    {
      $set: {
        userId: customer._id,
        coachId: coach._id,
        packageId: videoPkg._id,
        number: "PBC-DEMO-1001",
        orderType: "coaching",
        items: [{ packageId: String(videoPkg._id), name: videoPkg.title, price: videoPkg.price, qty: 1, tag: videoPkg.reviewType }],
        status: "paid",
        subtotal: videoPkg.price,
        tax: 0,
        total: videoPkg.price,
        platformFee: 6.75,
        paymentMode: "demo",
        metadata: { goals: "Improve serve return, third-shot drop, and kitchen resets.", skillLevel: "Intermediate" },
      },
    },
    { upsert: true, new: true }
  );

  const videoSubmission = await VideoSubmission.findOneAndUpdate(
    { orderId: videoOrder._id },
    {
      $set: {
        playerId: customer._id,
        coachId: coach._id,
        packageId: videoPkg._id,
        orderId: videoOrder._id,
        title: "Demo Match Review: Kitchen Resets and Third Shots",
        description: "Customer uploaded a doubles point sequence for remote coach feedback.",
        goals: "Stop popping up resets and improve movement after the serve.",
        skillLevel: "Intermediate",
        provider: "demo",
        videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        thumbnailUrl: "",
        durationSeconds: 95,
        status: "reviewed",
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true, new: true }
  );

  videoOrder.submissionId = videoSubmission._id;
  await videoOrder.save();

  await VideoReview.findOneAndUpdate(
    { submissionId: videoSubmission._id },
    {
      $set: {
        submissionId: videoSubmission._id,
        coachId: coach._id,
        playerId: customer._id,
        summary:
          "You are making solid contact and choosing patient shots, but your recovery after the third shot is late. The biggest improvement will come from moving through the shot and resetting your paddle in front of your body.",
        strengths: "Consistent serve depth, good patience in cross-court dinks, and smart shot selection when the point slows down.",
        improvements: "Recover forward after serving, keep paddle height above the wrist, and avoid drifting backward after a defensive reset.",
        drills: "1) Third-shot drop to kitchen transition: 50 reps.\n2) Cross-court dink target drill: 10 minutes.\n3) Reset from midcourt drill: 5 rounds of 20 balls.",
        finalNotes: "For the next in-person session, start with transition-zone resets and finish with doubles court positioning.",
        responseVideoUrl: "",
        status: "complete",
        completedAt: new Date(),
        comments: [
          { timestampSeconds: 12, category: "Footwork", comment: "You hit the third shot, but your first step forward comes late. Move through the ball." },
          { timestampSeconds: 34, category: "Kitchen", comment: "Good patience here. Keep your paddle out front instead of dropping it near your hip." },
          { timestampSeconds: 61, category: "Strategy", comment: "This is a good spot to reset middle instead of speeding up down the line." },
        ],
      },
    },
    { upsert: true, new: true }
  );

  const lessonOrder = await Order.findOneAndUpdate(
    { userId: customer._id, number: "PBC-DEMO-1002" },
    {
      $set: {
        userId: customer._id,
        coachId: coach._id,
        packageId: lessonPkg._id,
        number: "PBC-DEMO-1002",
        orderType: "coaching",
        items: [{ packageId: String(lessonPkg._id), name: lessonPkg.title, price: lessonPkg.price, qty: 1, tag: lessonPkg.reviewType }],
        status: "paid",
        subtotal: lessonPkg.price,
        tax: 0,
        total: lessonPkg.price,
        platformFee: 12.75,
        paymentMode: "demo",
        metadata: {
          goals: "In-person lesson at local courts focused on footwork and kitchen positioning.",
          skillLevel: "Beginner/Intermediate",
          location: "Round Rock outdoor courts",
        },
      },
    },
    { upsert: true, new: true }
  );

  await VideoSubmission.findOneAndUpdate(
    { orderId: lessonOrder._id },
    {
      $set: {
        playerId: customer._id,
        coachId: coach._id,
        packageId: lessonPkg._id,
        orderId: lessonOrder._id,
        title: "In-Person Lesson: Round Rock Outdoor Courts",
        description: "Demo in-person booking. No upload required unless the coach asks for follow-up footage.",
        goals: "Work on split step, court positioning, and controlled resets.",
        skillLevel: "Beginner/Intermediate",
        provider: "demo",
        videoUrl: "",
        status: "ready_for_review",
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    },
    { upsert: true, new: true }
  );

  await PaymentSplit.findOneAndUpdate(
    { orderId: videoOrder._id },
    {
      $set: {
        orderId: videoOrder._id,
        chargeType: "destination_charge",
        platformFee: 6.75,
        currency: "usd",
        recipients: [
          {
            coachId: coach._id,
            stripeAccountId: coach.stripeAccountId,
            label: "Jordan Coach",
            role: "main_coach",
            amount: 38.25,
            percentage: 100,
            status: "paid",
          },
        ],
        status: "paid",
        notes: "Demo destination-charge payout for online video review.",
      },
    },
    { upsert: true, new: true }
  );

  await PaymentSplit.findOneAndUpdate(
    { orderId: lessonOrder._id },
    {
      $set: {
        orderId: lessonOrder._id,
        chargeType: "separate_charges_and_transfers",
        platformFee: 12.75,
        currency: "usd",
        recipients: [
          {
            coachId: coach._id,
            stripeAccountId: coach.stripeAccountId,
            label: "Main coach payout",
            role: "main_coach",
            amount: 55.25,
            percentage: 65,
            status: "paid",
          },
          {
            coachId: coach._id,
            stripeAccountId: "acct_demo_facility_partner",
            label: "Court facility split",
            role: "facility",
            amount: 17,
            percentage: 20,
            status: "paid",
          },
        ],
        status: "paid",
        notes: "Demo split payout for in-person lesson using coach + facility allocation.",
      },
    },
    { upsert: true, new: true }
  );

  const testimonials = [
    {
      name: "Mia R.",
      location: "Round Rock, TX",
      service: "Private lesson",
      rating: 5,
      text: "The in-person lesson helped me fix my ready position and understand where to stand during doubles points.",
      status: "published",
      featured: true,
    },
    {
      name: "Trevor S.",
      location: "Austin, TX",
      service: "Video review",
      rating: 5,
      text: "The timestamped notes made it obvious why I was losing points at the kitchen. Super easy to follow.",
      status: "published",
      featured: true,
    },
  ];

  for (const testimonial of testimonials) {
    await Testimonial.findOneAndUpdate(
      { name: testimonial.name, service: testimonial.service },
      { $set: testimonial },
      { upsert: true, new: true }
    );
  }

  return {
    ok: true,
    credentials: [
      { role: "Customer / Player", email: "customer@picklepro.demo", username: "customer", password: "customer", startAt: "/dashboard/submissions" },
      { role: "Coach", email: "coach@picklepro.demo", username: "coach", password: "coach", startAt: "/coach/dashboard" },
      { role: "Admin", email: "admin@picklepro.demo", username: "admin", password: "admin", startAt: "/admin/coaching" },
    ],
    ids: {
      customerId: customer._id,
      coachUserId: coachUser._id,
      adminId: admin._id,
      coachProfileId: coach._id,
      videoSubmissionId: videoSubmission._id,
    },
    seeded: ["demo users", "approved coach", "training packages", "paid orders", "payment splits", "video submission", "completed review", "testimonials"],
  };
}

module.exports = { seedPickleballDemo };