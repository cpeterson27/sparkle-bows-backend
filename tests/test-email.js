require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

transporter.sendMail(
  {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER, // Send to yourself
    subject: "Test Email",
    text: "Nodemailer is working! 🎉",
  },
  (err, info) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log("Success! Check your email:", info.response);
    }
  },
);
