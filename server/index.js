import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import "./config/mongo.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import chatMessageRoutes from "./routes/chatmssg.js";
import adminRoutes from "./routes/admin.js";
import { VerifySocketToken } from "./middlewares/verifytoken.js";
import User from "./models/user.js";

// Load environment variables
dotenv.config();

// Initialize Express App & HTTP Server
const app = express();
const server = http.createServer(app);

// Increase JSON & URL-encoded payload size limit to 50MB to support base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS for frontend connection
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// API Routes mounting
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", chatMessageRoutes);
app.use("/api/admin", adminRoutes);

// Root Health Check Endpoint
app.get("/", (req, res) => {
  res.send("Arthur Real-Time Chat API Server is Running Cleanly 🚀");
});

// Configure Socket.IO Server with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
});

// Verify JWT token for incoming socket connections
io.use(VerifySocketToken);

// Map to track connected online users: Key = userId (string), Value = Set of socket IDs
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.user?.userId ? String(socket.user.userId) : null;
  console.log(`🔌 User connected to socket: ${userId} (Socket ID: ${socket.id})`);

  if (userId) {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Update isOnline: true in MongoDB
    User.findByIdAndUpdate(userId, { isOnline: true }, { new: true }).then(async (user) => {
      if (user && user.friends) {
        user.friends.forEach((friendId) => {
          const friendSockets = onlineUsers.get(String(friendId));
          if (friendSockets) {
            friendSockets.forEach((sockId) => {
              io.to(sockId).emit("friendOnline", {
                userId: user._id,
                username: user.username,
              });
            });
          }
        });
      }
    });
  }

  // Join Room for 1-on-1 / Group Chat Sync
  socket.on("joinRoom", ({ chatRoomId }) => {
    if (chatRoomId) {
      socket.join(String(chatRoomId));
    }
  });

  // Event: Send real-time private message
  socket.on("sendMessage", (data) => {
    const { receiverId, message, image, fileUrl, fileName, fileSize, messageType, chatRoomId, sender } = data;
    const roomStr = String(chatRoomId);

    // Broadcast to room
    if (chatRoomId) {
      socket.to(roomStr).emit("getMessage", {
        chatRoomId,
        sender,
        message,
        image,
        fileUrl,
        fileName,
        fileSize,
        messageType,
        createdAt: new Date().toISOString(),
      });
    }

    // Broadcast to all sockets registered for receiverId
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("getMessage", {
          chatRoomId,
          sender,
          message,
          image,
          fileUrl,
          fileName,
          fileSize,
          messageType,
          createdAt: new Date().toISOString(),
        });
      });
    }
  });

  // Event: Handle real-time read receipt (markAsRead)
  socket.on("markAsRead", ({ chatRoomId, senderId }) => {
    const senderSockets = onlineUsers.get(String(senderId));
    if (senderSockets) {
      senderSockets.forEach((sockId) => {
        io.to(sockId).emit("messagesSeen", { chatRoomId });
      });
    }
  });

  // Event: User started typing ✍️
  socket.on("typing", ({ receiverId, chatRoomId, username }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("userTyping", {
          chatRoomId,
          senderId: userId,
          username,
        });
      });
    }
  });

  // Event: User stopped typing
  socket.on("stopTyping", ({ receiverId, chatRoomId }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("userStopTyping", {
          chatRoomId,
          senderId: userId,
        });
      });
    }
  });

  // Event: Unsend / Delete Message 🗑️
  socket.on("deleteMessage", ({ receiverId, messageId, chatRoomId }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("messageDeleted", { chatRoomId, messageId });
      });
    }
  });

  // Event: Pin / Unpin Message 📌
  socket.on("pinMessage", ({ receiverId, messageId, isPinned, chatRoomId }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("messagePinned", { chatRoomId, messageId, isPinned });
      });
    }
  });

  // Event: Emoji Reaction 🎭
  socket.on("reactMessage", ({ receiverId, messageId, reactions, chatRoomId }) => {
    const receiverSockets = onlineUsers.get(String(receiverId));
    if (receiverSockets) {
      receiverSockets.forEach((sockId) => {
        io.to(sockId).emit("messageReacted", { chatRoomId, messageId, reactions });
      });
    }
  });

  // Event: Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${userId} (Socket ID: ${socket.id})`);

    if (userId && onlineUsers.has(userId)) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);

        // Update isOnline: false in MongoDB
        User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }).then((user) => {
          if (user && user.friends) {
            user.friends.forEach((friendId) => {
              const friendSockets = onlineUsers.get(String(friendId));
              if (friendSockets) {
                friendSockets.forEach((sockId) => {
                  io.to(sockId).emit("friendOffline", { userId: user._id });
                });
              }
            });
          }
        });
      }
    }
  });
});

// Start HTTP Server on PORT
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Arthur Server running on port ${PORT}`);
});