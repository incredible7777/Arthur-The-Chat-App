import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer SMTP Transporter with 5-second strict timeouts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  connectionTimeout: 5000, // 5s connection timeout
  greetingTimeout: 5000,   // 5s greeting timeout
  socketTimeout: 5000,     // 5s socket timeout
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Transporter Connection Error:", error.message);
  } else {
    console.log(" Email SMTP Transporter is ready to send messages");
  }
});

export default transporter;