import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer Transporter with pooled socket connections for instant cloud delivery
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10,
});

// Verify connection configuration on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Check Warning:", error.message);
  } else {
    console.log(" Email SMTP Pooled Transporter is ready.");
  }
});

export default transporter;
