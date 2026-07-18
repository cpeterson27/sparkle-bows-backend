require("dotenv").config();
const nodemailer = require("nodemailer");

const smtpUser = process.env.GMAIL_USER;
const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

if (!smtpUser || !smtpPass) {
  console.error(
    "Missing email credentials. Set GMAIL_USER and GMAIL_APP_PASSWORD in your environment.",
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

transporter.sendMail(
  {
    from: process.env.EMAIL_FROM || smtpUser,
    to: smtpUser, // Send to yourself
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
