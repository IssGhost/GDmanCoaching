const mongoose = require("mongoose");
const ticket = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String, email: String, phone: String, city: String, source: String,
    subject: String, message: String,
    status: { type: String, enum: ["open","in_progress","resolved","closed"], default: "open" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Ticket", ticket);
