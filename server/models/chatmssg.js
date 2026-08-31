import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    image: {
      type: String, // Base64 or Image URL
    },
    fileUrl: {
      type: String, // Base64 or File URL
    },
    fileName: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    reactions: [reactionSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatMessage",
      },
      senderName: {
        type: String,
      },
      text: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;