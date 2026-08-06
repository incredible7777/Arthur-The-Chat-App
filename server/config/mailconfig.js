import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer Transporter forcing IPv4 to eliminate Render cloud IPv6 timeouts
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, // Force IPv4 addressing to bypass Render cloud IPv6 timeout drops
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration on startup
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Check Warning:", error.message);
  } else {
    console.log(" Email SMTP Transporter is ready on Port 465 IPv4.");
  }
});

export default transporter;
