const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: String,
    phone: String,
    role: { type: String, enum: ["admin", "employee", "coach", "player", "user"], default: "user" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
