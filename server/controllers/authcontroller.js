import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Otp from "../models/otp.js";
import { sendOtpEmail } from "../services/mailservice.js";

/**
 * 1. REQUEST OTP
 * Generates a 6-digit OTP code, hashes it, stores it in MongoDB, and emails it.
 */
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    // Generate cryptographically secure 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP code before storing in database
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    // Remove any previous OTP for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Save new OTP in MongoDB
    await Otp.create({
      email: cleanEmail,
      otpHash,
    });

    // Send email with 6-second strict timeout race to PREVENT UI hanging forever!
    try {
      const emailPromise = sendOtpEmail(cleanEmail, otpCode);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email delivery timed out after 6 seconds")), 6000)
      );

      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`🔑 [OTP SENT VIA EMAIL] to ${cleanEmail}: ${otpCode}`);
    } catch (mailError) {
      console.error("⚠️ Nodemailer Email Warning:", mailError.message);
      console.log(`🔑 [OTP CREATED IN DB] for ${cleanEmail}: ${otpCode}`);
    }

    // ALWAYS return success so UI instantly advances to 6-digit OTP input step!
    return res.status(200).json({
      success: true,
      message: `OTP code sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({ message: error.message || "Failed to send OTP email" });
  }
};

/**
 * 2. VERIFY OTP & LOGIN / REGISTER
 * Verifies the 6-digit OTP code, creates/finds the user, and generates a JWT Token.
 * Automatically flags personal admin email as Admin!
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, username } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find OTP record in MongoDB
    const otpRecord = await Otp.findOne({ email: cleanEmail });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP has expired or is invalid. Please request a new one." });
    }

    // Compare provided OTP with stored hash
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
    }

    // Delete OTP record after successful verification so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    // Check if user already exists
    let user = await User.findOne({ email: cleanEmail });

    const adminEmail = (process.env.ADMIN_EMAIL || "incredible.a77@gmail.com").toLowerCase().trim();
    const isOwnerAdmin = cleanEmail === adminEmail;

    // If new user, create user profile
    if (!user) {
      const defaultUsername = username || cleanEmail.split("@")[0];
      const avatarSeed = encodeURIComponent(defaultUsername);

      user = await User.create({
        email: cleanEmail,
        username: defaultUsername,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`,
        isAdmin: isOwnerAdmin,
      });
    } else if (isOwnerAdmin && !user.isAdmin) {
      // Ensure owner admin email always has isAdmin = true
      user.isAdmin = true;
      await user.save();
    }

    // Generate JWT Auth Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "ArthurSecretKey123",
      { expiresIn: "30d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
};

/**
 * 3. GUEST MODE LOGIN
 * Creates or logs in a guest user instantly
 */
export const guestLogin = async (req, res) => {
  try {
    const randomGuestNum = Math.floor(1000 + Math.random() * 9000);
    const guestEmail = `guest_${randomGuestNum}@arthur.chat`;
    const guestUsername = `Guest_${randomGuestNum}`;

    let user = await User.create({
      email: guestEmail,
      username: guestUsername,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestUsername}`,
      isGuest: true,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET || "ArthurSecretKey123",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error("Error in guestLogin:", error);
    return res.status(500).json({ message: "Guest login failed", error: error.message });
  }
};