const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    fullName: String,
    phone: String,
    roles: {
      type: [String],
      enum: ["admin", "employee", "coach", "player", "user"],
      default: ["user"]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

