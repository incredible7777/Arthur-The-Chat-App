import express from "express";
import { handleAiChat } from "../controllers/aiController.js";
import { VerifyToken } from "../middlewares/verifytoken.js";

const router = express.Router();

// POST /api/ai/chat - Process AI prompts & friend commands
router.post("/chat", VerifyToken, handleAiChat);

export default router;
