import { processAiRequest } from "../services/aiService.js";
import User from "../models/user.js";

/**
 * Controller to handle AI Chatbot prompts and execute actions
 */
export const handleAiChat = async (req, res) => {
  try {
    const { prompt, friends, activeChatMessages } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    let currentUser = null;
    if (userId && userId !== "guest_user") {
      try {
        currentUser = await User.findById(userId).populate("friends", "username avatar isOnline");
      } catch (e) {
        console.warn("User lookup warning:", e.message);
      }
    }

    const result = await processAiRequest({
      prompt,
      user: currentUser,
      friends: friends || currentUser?.friends || [],
      activeChatMessages: activeChatMessages || [],
    });

    // Handle automated backend action: REMOVE_FRIEND
    if (result.action === "REMOVE_FRIEND" && result.targetUserId) {
      await User.findByIdAndUpdate(userId, { $pull: { friends: result.targetUserId } });
      await User.findByIdAndUpdate(result.targetUserId, { $pull: { friends: userId } });
      result.reply = `✅ Successfully removed **${result.targetUsername}** from your friends list!`;
      result.updatedFriends = (friends || []).filter(
        (f) => String(f._id) !== String(result.targetUserId)
      );
    }

    // Handle automated backend action: ADD_FRIEND
    if (result.action === "ADD_FRIEND" && result.targetUsername) {
      const targetUser = await User.findOne({
        username: new RegExp(`^${result.targetUsername}$`, "i"),
      });

      if (!targetUser) {
        result.reply = `❌ User **${result.targetUsername}** was not found. Please check the exact username.`;
        result.action = "NONE";
      } else if (String(targetUser._id) === String(userId)) {
        result.reply = `⚠️ You cannot send a friend request to yourself!`;
        result.action = "NONE";
      } else {
        // Check if already friends
        const isAlreadyFriend = currentUser.friends.some(
          (f) => String(f._id) === String(targetUser._id)
        );

        if (isAlreadyFriend) {
          result.reply = `🤝 **${targetUser.username}** is already in your friends list!`;
          result.action = "NONE";
        } else {
          // Add to pending friend request of target user
          const existingReq = targetUser.friendRequests.find(
            (r) => String(r.sender) === String(userId) && r.status === "pending"
          );

          if (!existingReq) {
            targetUser.friendRequests.push({ sender: userId, status: "pending" });
            await targetUser.save();
          }

          result.reply = `📩 Friend request sent to **${targetUser.username}**! They will see it in their Requests tab.`;
        }
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("AI Controller Error:", error);
    return res.status(500).json({
      reply: "Sorry, I encountered an internal error processing your request.",
      error: error.message,
    });
  }
};
