import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ChatMessage from "../models/chatmssg.js";
import Report from "../models/Report.js";

/**
 * Admin Login
 * Validates admin key and returns Admin JWT token
 */
export const adminLogin = async (req, res) => {
  try {
    const { key, email } = req.body;
    const adminKey = (process.env.ADMIN_SECRET || "Arthur#123").trim();
    const providedKey = (key || "").trim();

    // Accept ADMIN_SECRET from .env, Arthur#123, or admin123
    const isValidKey =
      providedKey === adminKey ||
      providedKey === "Arthur#123" ;

    if (!isValidKey) {
      return res.status(401).json({ message: "Invalid Admin Passkey credentials" });
    }

    // Sign Admin JWT Token
    const token = jwt.sign(
      { isAdmin: true, role: "super_admin", email: email || process.env.ADMIN_EMAIL || "admin@arthur.com" },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Admin authentication successful!",
      token,
      admin: {
        username: "Arthur Master Admin",
        email: email || process.env.ADMIN_EMAIL || "admin@arthur.com",
        isAdmin: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Admin login failed", error: error.message });
  }
};

/**
 * Get Overall Admin System Stats
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsersCount = await User.countDocuments({ isOnline: true });
    const totalMessages = await ChatMessage.countDocuments();
    const pendingReports = await Report.countDocuments({ status: "pending" });

    res.status(200).json({
      totalUsers,
      onlineUsers: onlineUsersCount,
      totalMessages,
      pendingReports,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats", error: error.message });
  }
};

/**
 * Get All Users with populated friends
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("friends", "username email avatar isOnline")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

/**
 * Toggle Ban / Delete User
 */
export const toggleBanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBanned = !user.isBanned;
    if (user.isBanned) user.isOnline = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBanned ? "User banned successfully" : "User unbanned successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle ban status", error: error.message });
  }
};

/**
 * Permanently Delete User
 */
export const deleteUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    // Remove user from all friends arrays
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

    res.status(200).json({ success: true, message: "User deleted permanently" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

/**
 * Remove Friendship between User A & User B
 */
export const removeFriendshipAdmin = async (req, res) => {
  try {
    const { userAId, userBId } = req.body;

    await User.findByIdAndUpdate(userAId, { $pull: { friends: userBId } });
    await User.findByIdAndUpdate(userBId, { $pull: { friends: userAId } });

    res.status(200).json({ success: true, message: "Friendship broken successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove friendship", error: error.message });
  }
};

/**
 * Forcefully Add Friendship between User A & User B
 */
export const addFriendshipAdmin = async (req, res) => {
  try {
    const { userAId, userBId } = req.body;

    await User.findByIdAndUpdate(userAId, { $addToSet: { friends: userBId } });
    await User.findByIdAndUpdate(userBId, { $addToSet: { friends: userAId } });

    res.status(200).json({ success: true, message: "Friendship linked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to link friendship", error: error.message });
  }
};

/**
 * Get All Reports
 */
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "username email avatar")
      .populate("reportedUser", "username email avatar isBanned")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reports", error: error.message });
  }
};
