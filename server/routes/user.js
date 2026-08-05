import express from "express";
import { VerifyToken } from "../middlewares/verifytoken.js";
import {
  getCurrentUser,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  removeFriend,
  reportUser,
} from "../controllers/user.js";

const router = express.Router();

// All user routes require JWT Token verification
router.use(VerifyToken);

router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.get("/search", searchUsers);
router.get("/friends", getFriends);
router.post("/friend-request", sendFriendRequest);
router.post("/accept-friend", acceptFriendRequest);
router.post("/remove-friend", removeFriend);
router.post("/report", reportUser);

export default router;