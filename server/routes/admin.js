import express from "express";
import {
  adminLogin,
  getAdminStats,
  getAllUsers,
  toggleBanUser,
  deleteUserAdmin,
  removeFriendshipAdmin,
  addFriendshipAdmin,
  getAllReports,
} from "../controllers/adminController.js";

const router = express.Router();

// Admin Auth Route
router.post("/login", adminLogin);

// Admin Management Routes
router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.post("/ban/:userId", toggleBanUser);
router.delete("/user/:userId", deleteUserAdmin);
router.post("/friendship/remove", removeFriendshipAdmin);
router.post("/friendship/add", addFriendshipAdmin);
router.get("/reports", getAllReports);

export default router;
