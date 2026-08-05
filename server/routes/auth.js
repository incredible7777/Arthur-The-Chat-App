import express from "express";
import { sendOtp, verifyOtp, guestLogin } from "../controllers/authcontroller.js";
import { otpRequestLimiter, otpVerifyLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Route to request OTP email with rate limiting
router.post("/send-otp", otpRequestLimiter, sendOtp);

// Route to verify OTP code & get JWT token with rate limiting
router.post("/verify-otp", otpVerifyLimiter, verifyOtp);

// Route for Guest Mode login
router.post("/guest-login", guestLogin);

export default router;