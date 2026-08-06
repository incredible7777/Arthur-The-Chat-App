import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "atulyapandey1@gmail.com",
    pass: "dutrvmvwdcaohpph",
  },
});

console.log("Testing Nodemailer Gmail SMTP connection...");

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Verify Failed:", error);
  } else {
    console.log("✅ SMTP Verify Success! Transporter is ready.");

    transporter.sendMail({
      from: '"Arthur Test" <atulyapandey1@gmail.com>',
      to: "atulyapandey1@gmail.com",
      subject: "Arthur SMTP Test Email",
      text: "Testing Gmail App Password delivery for Arthur Chat!",
    }, (sendErr, info) => {
      if (sendErr) {
        console.error("❌ sendMail Failed:", sendErr);
      } else {
        console.log("🎉 sendMail Success! Message ID:", info.messageId);
      }
    });
  }
});
