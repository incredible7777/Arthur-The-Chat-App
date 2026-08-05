import mongoose from "mongoose";
import ChatRoom from "../models/chatroom.js";
import ChatMessage from "../models/chatmssg.js";

/**
 * Get or create a 1-on-1 Chat Room between two users
 */
export const getOrCreateRoom = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.userId;

    // Find existing room containing both members
    let room = await ChatRoom.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!room) {
      room = await ChatRoom.create({
        members: [senderId, receiverId],
      });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Failed to get/create chat room", error: error.message });
  }
};

/**
 * Send a chat message (text, image, or document file) & save to database
 */
export const createMessage = async (req, res) => {
  try {
    const { chatRoomId, message, image, fileUrl, fileName, fileSize, messageType } = req.body;
    const senderId = req.user.userId;

    const newMessage = await ChatMessage.create({
      chatRoomId,
      sender: senderId,
      message: message || "",
      image: image || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      messageType: messageType || (image ? "image" : fileUrl ? "file" : "text"),
    });

    const populatedMessage = await ChatMessage.findById(newMessage._id).populate(
      "sender",
      "username avatar"
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to create message", error: error.message });
  }
};

/**
 * Get all messages for a specific chat room
 */
export const getMessagesByRoom = async (req, res) => {
  try {
    const { chatRoomId } = req.params;

    const messages = await ChatMessage.find({ chatRoomId })
      .populate("sender", "username avatar")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
};

/**
 * Mark all unread messages in a room as read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatRoomId } = req.body;
    const currentUserId = req.user.userId;

    await ChatMessage.updateMany(
      {
        chatRoomId,
        sender: { $ne: currentUserId },
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark messages as read", error: error.message });
  }
};

/**
 * Get unread message counts for all friends of logged in user
 */
export const getUnreadCounts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const unreadMessages = await ChatMessage.aggregate([
      {
        $match: {
          sender: { $ne: new mongoose.Types.ObjectId(currentUserId) },
          isRead: false,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {};
    unreadMessages.forEach((item) => {
      counts[item._id.toString()] = item.count;
    });

    res.status(200).json(counts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread counts", error: error.message });
  }
};

/**
 * Unsend / Delete a message
 */
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ message: "You can only unsend your own messages" });
    }

    message.isDeleted = true;
    message.message = "This message was unsent";
    message.image = null;
    message.fileUrl = null;
    await message.save();

    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: "Failed to unsend message", error: error.message });
  }
};

/**
 * Toggle Pin / Unpin a message
 */
export const togglePinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    const updated = await ChatMessage.findById(messageId).populate("sender", "username avatar");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle pin message", error: error.message });
  }
};

/**
 * Toggle emoji reaction on a message
 */
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user.userId;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === currentUserId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction if clicked again
      message.reactions.splice(existingIndex, 1);
    } else {
      // Replace existing reaction from this user or add new
      const userReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === currentUserId
      );
      if (userReactionIndex > -1) {
        message.reactions[userReactionIndex].emoji = emoji;
      } else {
        message.reactions.push({ user: currentUserId, emoji });
      }
    }

    await message.save();
    const updated = await ChatMessage.findById(messageId).populate("sender", "username avatar");

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update reaction", error: error.message });
  }
};