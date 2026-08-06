import https from "https";
import transporter from "../config/mailconfig.js";

/**
 * Sends a clean HTML email containing the 6-digit OTP code to the specified user email.
 * Supports:
 * 1. Brevo API (BREVO_API_KEY) -> 100% Free, sends to ALL public users worldwide without domain!
 * 2. Resend API (RESEND_API_KEY) -> 100% Free HTTPS API.
 * 3. Nodemailer Gmail SMTP fallback.
 * 
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit numerical OTP code
 */
export const sendOtpEmail = async (toEmail, otpCode) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. If BREVO_API_KEY is present, send via Brevo HTTPS API (Sends to ALL PUBLIC USERS worldwide, 0 domain required!)
  if (brevoApiKey) {
    console.log(`📩 Sending OTP email to ${toEmail} via Brevo Public Cloud API...`);
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        sender: { name: "Arthur Verification", email: "atulyapandey1@gmail.com" },
        to: [{ email: toEmail }],
        subject: `Your Arthur Verification Code: ${otpCode}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #060707; text-align: center; margin-bottom: 10px;">Arthur Verification</h2>
            <p style="font-size: 14px; color: #334155;">Hello,</p>
            <p style="font-size: 14px; color: #334155;">Your 6-digit Verification Code (OTP) to log in to Arthur is:</p>
            
            <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 12px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0b0b0b;">${otpCode}</span>
            </div>

            <p style="font-size: 13px; color: #64748b;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });

      const req = https.request(
        {
          hostname: "api.brevo.com",
          port: 443,
          path: "/v3/smtp/email",
          method: "POST",
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            console.log(`🎉 Brevo API response (${res.statusCode}):`, body);
            resolve({ success: res.statusCode >= 200 && res.statusCode < 300, messageId: "brevo-success" });
          });
        }
      );

      req.on("error", (err) => {
        console.error("⚠️ Brevo HTTPS Request Warning:", err.message);
        resolve({ success: false, warning: err.message });
      });

      req.write(payload);
      req.end();
    });
  }

  // 2. If RESEND_API_KEY is present, send via Resend HTTPS API
  if (resendApiKey) {
    console.log(`📩 Sending OTP email to ${toEmail} via Resend Cloud API...`);
    return new Promise((resolve) => {
      const payload = JSON.stringify({
        from: "Arthur Verification <onboarding@resend.dev>",
        to: [toEmail],
        subject: `Your Arthur Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #060707; text-align: center; margin-bottom: 10px;">Arthur Verification</h2>
            <p style="font-size: 14px; color: #334155;">Hello,</p>
            <p style="font-size: 14px; color: #334155;">Your 6-digit Verification Code (OTP) to log in to Arthur is:</p>
            
            <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 12px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0b0b0b;">${otpCode}</span>
            </div>

            <p style="font-size: 13px; color: #64748b;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });

      const req = https.request(
        {
          hostname: "api.resend.com",
          port: 443,
          path: "/emails",
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            console.log(`🎉 Resend API response (${res.statusCode}):`, body);
            resolve({ success: res.statusCode >= 200 && res.statusCode < 300, messageId: "resend-success" });
          });
        }
      );

      req.on("error", (err) => {
        console.error("⚠️ Resend HTTPS Request Warning:", err.message);
        resolve({ success: false, warning: err.message });
      });

      req.write(payload);
      req.end();
    });
  }

  // 3. Fallback to standard Nodemailer Gmail SMTP
  console.log(`📩 Sending OTP email to ${toEmail} via Nodemailer Gmail SMTP...`);
  const mailOptions = {
    from: process.env.SMTP_USER || "atulyapandey1@gmail.com",
    to: toEmail,
    subject: `Your Arthur Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #060707; text-align: center; margin-bottom: 10px;">Arthur Verification</h2>
        <p style="font-size: 14px; color: #334155;">Hello,</p>
        <p style="font-size: 14px; color: #334155;">Your 6-digit Verification Code (OTP) to log in to Arthur is:</p>
        
        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 12px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0b0b0b;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📩 OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`⚠️ Nodemailer delivery warning for ${toEmail}:`, error.message);
    return { success: false, warning: error.message };
  }
};
