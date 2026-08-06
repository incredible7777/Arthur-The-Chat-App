import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer Transporter using official Gmail service configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Check Warning:", error.message);
  } else {
    console.log(" Email SMTP Transporter is ready.");
  }
});

export default transporter;
