import express from "express";
import { handleAiChat } from "../controllers/aiController.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Soft token verification middleware (never blocks request, sets req.user if valid token)
const OptionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "my_super_secret_jwt_key_123456789_change_me");
      req.user = decoded;
    } catch (err) {
      req.user = { userId: "guest_user" };
    }
  } else {
    req.user = { userId: "guest_user" };
  }
  next();
};

// POST /api/ai/chat - Process AI prompts & friend commands
router.post("/chat", OptionalVerifyToken, handleAiChat);

export default router;
