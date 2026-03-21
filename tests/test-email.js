require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER, // Send to yourself
  subject: "Test Email",
  text: "Nodemailer is working! 🎉",
}, (err, info) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("Success! Check your email:", info.response);
  }
});