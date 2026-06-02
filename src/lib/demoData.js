export const DEMO_SUBMISSIONS = [
  {
    _id: "demo-submission-awaiting-upload",
    title: "Hybrid Package: Awaiting Player Upload",
    description:
      "The player booked a hybrid coaching package. Their in-person lesson is complete, and they still need to upload follow-up footage for review.",
    goals:
      "Upload post-lesson footage so the coach can confirm whether kitchen recovery and third-shot movement improved.",
    skillLevel: "Intermediate",
    status: "awaiting_upload",
    phase: "awaiting_upload",
    provider: "demo",
    videoUrl: "",
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    coachId: {
      _id: "demo-coach-001",
      displayName: "Jordan Coach",
      headline: "Private lessons, doubles clinics, and video breakdowns",
    },
    playerId: {
      _id: "demo-customer-001",
      fullName: "Casey Customer",
      email: "customer@picklepro.demo",
    },
    packageId: {
      _id: "demo-package-hybrid",
      title: "Hybrid Training Package",
      price: 125,
      reviewType: "monthly",
      turnaroundHours: 24,
      maxVideoMinutes: 15,
    },
    orderId: {
      number: "PBC-DEMO-1003",
      status: "paid",
      total: 125,
    },
    demoChecklist: [
      "Record 8–12 minutes of doubles play.",
      "Include at least 5 third-shot attempts.",
      "Make sure the camera shows the kitchen and transition zone.",
      "Upload the video or paste a private video link.",
    ],
  },
  {
    _id: "demo-submission-ready-review",
    title: "Ready For Review: Third-Shot Drop and Transition Zone",
    description:
      "The player uploaded a match clip after their in-person lesson. The coach now needs to review the footage and create feedback.",
    goals:
      "Coach should evaluate third-shot drop height, recovery steps, paddle position, and transition-zone resets.",
    skillLevel: "Intermediate",
    status: "ready_for_review",
    phase: "ready_for_review",
    provider: "demo",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    coachId: {
      _id: "demo-coach-001",
      displayName: "Jordan Coach",
      headline: "Private lessons, doubles clinics, and video breakdowns",
    },
    playerId: {
      _id: "demo-customer-001",
      fullName: "Casey Customer",
      email: "customer@picklepro.demo",
    },
    packageId: {
      _id: "demo-package-video",
      title: "Single Video Review",
      price: 45,
      reviewType: "single_video",
      turnaroundHours: 24,
      maxVideoMinutes: 12,
    },
    orderId: {
      number: "PBC-DEMO-1001",
      status: "paid",
      total: 45,
    },
    demoCoachTasks: [
      "Watch the submitted footage.",
      "Add at least 3 timestamped notes.",
      "Fill out strengths, improvements, and drills.",
      "Complete the review so the player can view it.",
    ],
  },
  {
    _id: "demo-submission-reviewed",
    title: "Completed Review: Kitchen Resets and Doubles Positioning",
    description:
      "The coach completed this video review. The player can now read the full breakdown, timestamped notes, and recommended drills.",
    goals:
      "Improve recovery after the third shot, keep the paddle higher at the kitchen, and reset middle instead of speeding up too early.",
    skillLevel: "Intermediate",
    status: "reviewed",
    phase: "reviewed",
    provider: "demo",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    dueAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    coachId: {
      _id: "demo-coach-001",
      displayName: "Jordan Coach",
      headline: "Private lessons, doubles clinics, and video breakdowns",
    },
    playerId: {
      _id: "demo-customer-001",
      fullName: "Casey Customer",
      email: "customer@picklepro.demo",
    },
    packageId: {
      _id: "demo-package-video-reviewed",
      title: "Tournament Match Breakdown",
      price: 75,
      reviewType: "match_breakdown",
      turnaroundHours: 24,
      maxVideoMinutes: 20,
    },
    orderId: {
      number: "PBC-DEMO-1004",
      status: "paid",
      total: 75,
    },
  },
];

export const DEMO_REVIEWS_BY_PHASE = {
  awaiting_upload: null,

  ready_for_review: {
    _id: "demo-review-draft",
    submissionId: "demo-submission-ready-review",
    status: "draft",
    summary: "",
    strengths: "",
    improvements: "",
    drills: "",
    finalNotes: "",
    responseVideoUrl: "",
    comments: [
      {
        _id: "ready-note-1",
        timestampSeconds: 0,
        category: "Coach task",
        comment: "This submission is ready for coach review. Add timestamped notes and complete the review.",
      },
    ],
  },

  reviewed: {
    _id: "demo-review-complete",
    submissionId: "demo-submission-reviewed",
    status: "complete",
    completedAt: new Date().toISOString(),
    summary:
      "You are making solid contact and choosing patient shots, but your recovery after the third shot is late. The biggest improvement will come from moving through the ball and resetting your paddle in front of your body.",
    strengths:
      "Consistent serve depth, good patience in cross-court dinks, and smart shot selection when the point slows down.",
    improvements:
      "Recover forward after serving, keep paddle height above the wrist, and avoid drifting backward after a defensive reset.",
    drills:
      "1) Third-shot drop to kitchen transition: 50 reps.\n2) Cross-court dink target drill: 10 minutes.\n3) Reset from midcourt drill: 5 rounds of 20 balls.\n4) Doubles middle-reset drill: 10 controlled resets before speeding up.",
    finalNotes:
      "For the next in-person session, start with transition-zone resets and finish with doubles court positioning. The video review should lead directly into the player's next lesson plan.",
    responseVideoUrl: "",
    comments: [
      {
        _id: "c1",
        timestampSeconds: 12,
        category: "Footwork",
        comment: "You hit the third shot, but your first step forward comes late. Move through the ball.",
      },
      {
        _id: "c2",
        timestampSeconds: 34,
        category: "Kitchen",
        comment: "Good patience here. Keep your paddle out front instead of dropping it near your hip.",
      },
      {
        _id: "c3",
        timestampSeconds: 61,
        category: "Strategy",
        comment: "This is a good spot to reset middle instead of speeding up down the line.",
      },
    ],
  },
};

export const DEMO_REVIEW = DEMO_REVIEWS_BY_PHASE.reviewed;

export function normalizePhase(value) {
  const raw = String(value || "").toLowerCase();

  if (raw.includes("await")) return "awaiting_upload";
  if (raw.includes("upload")) return "awaiting_upload";
  if (raw.includes("ready")) return "ready_for_review";
  if (raw.includes("reviewed")) return "reviewed";
  if (raw.includes("complete")) return "reviewed";

  return raw || "reviewed";
}

export function getDemoSubmission(id, requestedPhase = "") {
  const normalized = normalizePhase(requestedPhase);

  let submission =
    DEMO_SUBMISSIONS.find((row) => row._id === id) ||
    DEMO_SUBMISSIONS.find((row) => row.phase === normalized || row.status === normalized);

  if (!submission) {
    if (String(id || "").includes("await")) submission = DEMO_SUBMISSIONS[0];
    else if (String(id || "").includes("ready")) submission = DEMO_SUBMISSIONS[1];
    else if (String(id || "").includes("review")) submission = DEMO_SUBMISSIONS[2];
    else submission = DEMO_SUBMISSIONS[2];
  }

  const phase = normalizePhase(submission.phase || submission.status);
  const review = DEMO_REVIEWS_BY_PHASE[phase] || null;

  return { submission, review };
}

export function phasePathForSubmission(row, base = "/dashboard/submissions") {
  const phase = normalizePhase(row.phase || row.status);
  return `${base}/${row._id}?phase=${phase}`;
}

export const DEMO_ORDERS = [
  {
    _id: "order-demo-1001",
    number: "PBC-DEMO-1001",
    status: "paid",
    orderType: "Video Review",
    total: 45,
    createdAt: new Date().toISOString(),
    items: [{ name: "Single Video Review", tag: "online review", price: 45, qty: 1 }],
  },
  {
    _id: "order-demo-1002",
    number: "PBC-DEMO-1002",
    status: "paid",
    orderType: "In-Person Training",
    total: 85,
    createdAt: new Date().toISOString(),
    items: [{ name: "1-Hour Private Lesson", tag: "local court", price: 85, qty: 1 }],
  },
  {
    _id: "order-demo-1003",
    number: "PBC-DEMO-1003",
    status: "scheduled",
    orderType: "Hybrid Coaching",
    total: 125,
    createdAt: new Date().toISOString(),
    items: [{ name: "Hybrid Training Package", tag: "lesson + review", price: 125, qty: 1 }],
  },
];

export const DEMO_REQUESTS = [
  {
    _id: "request-demo-1",
    subject: "Private lesson at Round Rock courts",
    details: "Need one-hour session focused on footwork and court positioning.",
    status: "approved",
    estimate: 85,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "request-demo-2",
    subject: "Small doubles clinic for 4 players",
    details: "Saturday morning clinic, intermediate group, focus on partner movement.",
    status: "pending",
    estimate: 260,
    createdAt: new Date().toISOString(),
  },
];