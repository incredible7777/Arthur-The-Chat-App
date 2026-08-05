import express from "express";
import { VerifyToken } from "../middlewares/verifytoken.js";
import {
  getOrCreateRoom,
  createMessage,
  getMessagesByRoom,
  markMessagesAsRead,
  getUnreadCounts,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
} from "../controllers/chatmssg.js";

const router = express.Router();

router.use(VerifyToken);

router.post("/room", getOrCreateRoom);
router.post("/send", createMessage);
router.post("/read", markMessagesAsRead);
router.get("/unread-counts", getUnreadCounts);
router.delete("/delete/:messageId", deleteMessage);
router.post("/pin/:messageId", togglePinMessage);
router.post("/react/:messageId", toggleReaction);
router.get("/:chatRoomId", getMessagesByRoom);

export default router;