import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer Transporter using Port 465 SSL for Render Cloud Hosting
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Port 465 SSL (Required by Render Cloud Firewall)
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
    console.log(" Email SMTP Transporter is ready to send messages on Port 465 SSL");
  }
});

export default transporter;