require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function migrateAddress() {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({});
  if (!user) {
    console.log("No user found!");
    return;
  }

  user.address = {
    line1: user.address || "",
    line2: "",
    city: user.city || "",
    state: user.state || "",
    postalCode: user.zipCode || "",
    country: "US",
  };

  await user.save();
  console.log("✅ User address migrated to nested format:", user.address);

  mongoose.disconnect();
}

migrateAddress().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.disconnect();
});
