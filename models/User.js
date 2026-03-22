const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "US" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    orderUpdates: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    googleId: {
      type: String,
      default: "",
      index: true,
    },
    appleId: {
      type: String,
      default: "",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
      default: null,
    },
    twoFactorTempSecret: {
      type: String,
      select: false,
      default: null,
    },
    twoFactorRecoveryCodes: {
      type: [String],
      select: false,
      default: [],
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({ orderUpdates: true, marketing: false }),
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);