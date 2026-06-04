const mongoose = require("mongoose");
const { normalizeRole } = require("../utils/roles");

const ROLE_PRIORITY = ["admin", "employee", "coach", "user"];
const VALID_ROLE_VALUES = ["admin", "employee", "coach", "user"];

function cleanRole(value, fallback = null) {
  return normalizeRole(value, fallback);
}

function cleanRoles(values, fallbackRole = "user") {
  const rawRoles = Array.isArray(values) ? values : values ? [values] : [];
  const normalized = rawRoles.map((role) => cleanRole(role)).filter(Boolean);

  if (!normalized.length) {
    const fallback = cleanRole(fallbackRole, "user");
    return [fallback];
  }

  return [...new Set(normalized)];
}

function primaryRoleFromRoles(roles, fallbackRole = "user") {
  const normalized = cleanRoles(roles, fallbackRole);
  return ROLE_PRIORITY.find((role) => normalized.includes(role)) || normalized[0] || "user";
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    // Keep BOTH fields so older code and newer code keep working.
    // role is the primary role used by route guards and JWTs.
    role: {
      type: String,
      enum: VALID_ROLE_VALUES,
      default: "user",
      set: (value) => cleanRole(value, "user"),
    },

    // roles supports admin screens / future multi-role support.
    roles: {
      type: [String],
      enum: VALID_ROLE_VALUES,
      default: ["user"],
      set: (values) => cleanRoles(values),
    },
  },
  { timestamps: true }
);

userSchema.pre("validate", function syncRoleFields(next) {
  const primary = cleanRole(this.role) || primaryRoleFromRoles(this.roles, "user");
  const roles = cleanRoles(this.roles, primary);

  if (!roles.includes(primary)) roles.unshift(primary);

  this.role = primaryRoleFromRoles(roles, primary);
  this.roles = cleanRoles(roles, this.role);

  if (!this.name && this.fullName) this.name = this.fullName;
  if (!this.fullName && this.name) this.fullName = this.name;

  next();
});

userSchema.methods.getPrimaryRole = function getPrimaryRole() {
  return primaryRoleFromRoles(this.roles, this.role || "user");
};

userSchema.statics.primaryRoleFromRoles = primaryRoleFromRoles;
userSchema.statics.cleanRoles = cleanRoles;

module.exports = mongoose.model("User", userSchema);