const mongoose = require("mongoose");

const coachingPackageSchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "CoachProfile", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    reviewType: {
      type: String,
      enum: ["single_video", "match_breakdown", "doubles_strategy", "monthly", "live_session"],
      default: "single_video",
    },
    turnaroundHours: { type: Number, default: 48 },
    maxVideoMinutes: { type: Number, default: 10 },
    includesResponseVideo: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoachingPackage", coachingPackageSchema);
