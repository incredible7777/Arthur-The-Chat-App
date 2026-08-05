import User from "../models/user.js";
import Report from "../models/Report.js";

/**
 * Get current logged in user's profile details & friend requests
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("friends", "username avatar isOnline lastSeen email")
      .populate("friendRequests.sender", "username avatar email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
};

/**
 * Update current user's profile (username and/or avatar DP)
 */
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const currentUserId = req.user.userId;

    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username.trim()) {
      user.username = username.trim();
    }
    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        isGuest: user.isGuest,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Search users by username or email
 */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }

    const currentUserId = req.user.userId;
    const regex = new RegExp(q, "i"); // Case-insensitive search

    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude self
      $or: [{ username: regex }, { email: regex }],
    }).select("username email avatar isOnline");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error searching users", error: error.message });
  }
};

/**
 * Send a Friend Request to another user
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const senderId = req.user.userId;

    if (senderId === targetUserId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Check if already friends
    if (targetUser.friends.includes(senderId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // Check if request already sent
    const existingRequest = targetUser.friendRequests.find(
      (req) => req.sender.toString() === senderId && req.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already pending" });
    }

    targetUser.friendRequests.push({ sender: senderId, status: "pending" });
    await targetUser.save();

    res.status(200).json({ success: true, message: "Friend request sent!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send friend request", error: error.message });
  }
};

/**
 * Accept a pending Friend Request
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId, senderId } = req.body;
    const currentUserId = req.user.userId;

    const currentUser = await User.findById(currentUserId);
    const senderUser = await User.findById(senderId);

    if (!currentUser || !senderUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the pending request
    const requestIndex = currentUser.friendRequests.findIndex(
      (req) => req.sender.toString() === senderId && req.status === "pending"
    );

    if (requestIndex === -1) {
      return res.status(400).json({ message: "No pending friend request found from this user" });
    }

    // Mark request as accepted & add each other to friends array
    currentUser.friendRequests[requestIndex].status = "accepted";
    if (!currentUser.friends.includes(senderId)) currentUser.friends.push(senderId);
    if (!senderUser.friends.includes(currentUserId)) senderUser.friends.push(currentUserId);

    await currentUser.save();
    await senderUser.save();

    res.status(200).json({ success: true, message: "Friend request accepted!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to accept friend request", error: error.message });
  }
};

/**
 * Get all friends of logged in user
 */
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "friends",
      "username email avatar isOnline lastSeen"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: "Error fetching friends", error: error.message });
  }
};

/**
 * Remove a friend (Unfriend / Unfollow)
 */
export const removeFriend = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { friends: currentUserId } });

    res.status(200).json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove friend", error: error.message });
  }
};

/**
 * Report a user for spam or harassment
 */
export const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    const reporterId = req.user.userId;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: "Reported user ID and reason are required" });
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId,
      reason,
      details: details || "",
    });

    res.status(201).json({ success: true, message: "Report submitted successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
};