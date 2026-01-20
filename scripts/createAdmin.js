// scripts/createAdmin.js
// This script creates or updates a user to be an admin
require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");
const User = require("../models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function createAdmin() {
  try {
    console.log("\n🎀 Sparkle Bows - Create Admin User 🎀\n");

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database\n");

    // Get admin details
    const name = await question("Admin name (default: Cassandra Peterson): ");
    const email = await question("Admin email: ");
    const password = await question("Admin password: ");

    if (!email || !password) {
      console.error("\n❌ Email and password are required");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log("\n⚠️  User already exists. Updating to admin...");
      existingUser.role = "admin";
      await existingUser.save();
      console.log("✅ User updated to admin successfully!");
    } else {
      // Create new admin user
      const admin = new User({
        name: name || "Cassandra Peterson",
        email: email.toLowerCase(),
        password, // Will be hashed by pre-save hook
        role: "admin",
      });

      await admin.save();
      console.log("\n✅ Admin user created successfully!");
    }

    console.log("\n📧 Email:", email);
    console.log("👤 Name:", name || "Cassandra Peterson");
    console.log("🔐 Role: Admin\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();