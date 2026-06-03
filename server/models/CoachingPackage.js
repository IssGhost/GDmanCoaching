const mongoose = require("mongoose");

const coachingPackageSchema = new mongoose.Schema(
  {
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: "CoachProfile", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    reviewType: {
      type: String,
      enum: ["single_video", "match_breakdown", "doubles_strategy", "monthly", "strategy_consultation", "training_plan"],
      default: "single_video",
    },
    turnaroundHours: { type: Number, default: 48 },
    maxVideoMinutes: { type: Number, default: 15, max: 15 },
    includesResponseVideo: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CoachingPackage", coachingPackageSchema);
