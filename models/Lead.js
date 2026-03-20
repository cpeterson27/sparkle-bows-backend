const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    source: {
      type: String,
      trim: true,
      default: "website",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
