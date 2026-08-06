import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create Nodemailer Transporter using Port 465 SSL
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
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
    console.error("SMTP Connection Warning:", error.message);
  } else {
    console.log(" Email SMTP Transporter is ready.");
  }
});

export default transporter;
