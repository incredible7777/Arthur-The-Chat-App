import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./sidebar";
import ChatArea from "./chatarea";
import AddFriendModal from "./addfriendmodal";
import ReportModal from "./ReportModal";
import ProfileModal from "./ProfileModal";
import AiChatWidget from "./AiChatWidget";
import { useAuth } from "../../contexts/authcontext";
import { getSocket } from "../../services/socketservice";
import API from "../../services/api";
import { acceptFriendRequestApi, removeFriendApi } from "../../services/authservice";

const ChatDashboard = () => {
  const { user, setUser, logout } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [reportModalUser, setReportModalUser] = useState(null);
  const [profileModalData, setProfileModalData] = useState(null); // { targetUser, isSelf }
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Fetch initial profile, friends, & unread message counts
  const fetchData = useCallback(async () => {
    try {
      const res = await API.get("/user/me");
      setFriends(res.data.friends || []);
      setFriendRequests(res.data.friendRequests?.filter((r) => r.status === "pending") || []);

      const unreadRes = await API.get("/message/unread-counts");
      setUnreadCounts(unreadRes.data || {});
    } catch (err) {
      console.error("Failed to load user data", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen to Socket.IO real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Real-time incoming direct message listener
    socket.on("getMessage", (data) => {
      const senderId = String(
        typeof data.sender === "object" ? data.sender._id || data.sender.id : data.sender
      );

      if (senderId) {
        setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
      }

      if (activeRoom && String(data.chatRoomId) === String(activeRoom._id)) {
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, { ...data, isRead: true }];
        });
        setIsTyping(false); // Reset typing indicator when message arrives
        
        // Auto-mark incoming message as read since chat is currently active
        API.post("/message/read", { chatRoomId: activeRoom._id });
        if (activeChat) {
          socket.emit("markAsRead", { chatRoomId: activeRoom._id, senderId: activeChat._id });
        }
      } else if (senderId) {
        // Increment unread count for friend if chat room is not currently active
        setUnreadCounts((prev) => {
          const current = prev[senderId] || 0;
          return { ...prev, [senderId]: current + 1 };
        });
      }
    });

    // Real-time read receipt listener 👁️
    socket.on("messagesSeen", ({ chatRoomId }) => {
      if (activeRoom && chatRoomId === activeRoom._id) {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true }))
        );
      }
    });

    // Real-time message unsend listener 🗑️
    socket.on("messageDeleted", ({ chatRoomId, messageId }) => {
      if (activeRoom && chatRoomId === activeRoom._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, message: "This message was unsent", image: null, fileUrl: null } : m))
        );
      }
    });

    // Real-time message pin listener 📌
    socket.on("messagePinned", ({ chatRoomId, messageId, isPinned }) => {
      if (activeRoom && chatRoomId === activeRoom._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
        );
      }
    });

    // Real-time message reaction listener 🎭
    socket.on("messageReacted", ({ chatRoomId, messageId, reactions }) => {
      if (activeRoom && chatRoomId === activeRoom._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
        );
      }
    });

    // Real-time typing indicators ✍️
    socket.on("userTyping", ({ chatRoomId, senderId }) => {
      if (senderId) {
        setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
      }
      if (activeRoom && chatRoomId === activeRoom._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", ({ chatRoomId, senderId }) => {
      if (senderId) {
        setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
      }
      if (activeRoom && chatRoomId === activeRoom._id) {
        setIsTyping(false);
      }
    });

    // Real-time friend online status listener 🟢
    socket.on("friendOnline", ({ userId }) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: true } : f))
      );
      if (activeChat && activeChat._id === userId) {
        setActiveChat((prev) => ({ ...prev, isOnline: true }));
      }
    });

    // Real-time friend offline status listener 🔴
    socket.on("friendOffline", ({ userId }) => {
      setFriends((prev) =>
        prev.map((f) => (f._id === userId ? { ...f, isOnline: false } : f))
      );
      if (activeChat && activeChat._id === userId) {
        setActiveChat((prev) => ({ ...prev, isOnline: false }));
      }
    });

    return () => {
      socket.off("getMessage");
      socket.off("messagesSeen");
      socket.off("messageDeleted");
      socket.off("messagePinned");
      socket.off("messageReacted");
      socket.off("userTyping");
      socket.off("userStopTyping");
      socket.off("friendOnline");
      socket.off("friendOffline");
    };
  }, [activeRoom, activeChat]);

  // Select a friend to chat with & mark messages as read
  const handleSelectChat = async (friend) => {
    setActiveChat(friend);
    setIsTyping(false);
    
    // Clear unread count for selected friend in local state
    const friendIdStr = String(friend._id || friend.id);
    setUnreadCounts((prev) => ({ ...prev, [friend._id]: 0, [friendIdStr]: 0 }));

    try {
      // Get or create 1-on-1 chat room
      const roomRes = await API.post("/message/room", { receiverId: friend._id });
      setActiveRoom(roomRes.data);

      // Fetch message history for this room
      const msgsRes = await API.get(`/message/${roomRes.data._id}`);
      setMessages(msgsRes.data);

      // Mark unread messages in this room as read
      await API.post("/message/read", { chatRoomId: roomRes.data._id });

      // Notify friend's socket in real-time & join socket room 👁️
      const socket = getSocket();
      if (socket) {
        socket.emit("joinRoom", { chatRoomId: roomRes.data._id });
        socket.emit("markAsRead", {
          chatRoomId: roomRes.data._id,
          senderId: friend._id,
        });
      }
    } catch (err) {
      console.error("Error creating/fetching chat room:", err);
    }
  };

  // Back to contact list on mobile
  const handleBackToContacts = () => {
    setActiveChat(null);
    setActiveRoom(null);
    setIsTyping(false);
  };

  // Send message (text, image, or document file) handler
  const handleSendMessage = async (text, image = null, fileObj = null) => {
    if (!activeRoom || !activeChat) return;

    try {
      const payload = {
        chatRoomId: activeRoom._id,
        message: text,
        image: image || null,
        fileUrl: fileObj ? fileObj.fileUrl : null,
        fileName: fileObj ? fileObj.fileName : null,
        fileSize: fileObj ? fileObj.fileSize : null,
        messageType: image ? "image" : fileObj ? "file" : "text",
      };

      const res = await API.post("/message/send", payload);

      setMessages((prev) => [...prev, res.data]);

      // Emit real-time message via Socket.IO
      const socket = getSocket();
      if (socket) {
        socket.emit("sendMessage", {
          ...payload,
          sender: res.data.sender || user,
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Unsend message handler 🗑️
  const handleUnsendMessage = async (messageId) => {
    try {
      await API.delete(`/message/delete/${messageId}`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, message: "This message was unsent", image: null, fileUrl: null } : m))
      );

      const socket = getSocket();
      if (socket && activeChat) {
        socket.emit("deleteMessage", {
          chatRoomId: activeRoom._id,
          receiverId: activeChat._id,
          messageId,
        });
      }
    } catch (err) {
      console.error("Failed to unsend message:", err);
    }
  };

  // Toggle Pin / Unpin message handler 📌
  const handleTogglePinMessage = async (messageId) => {
    try {
      const res = await API.post(`/message/pin/${messageId}`);
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned: res.data.isPinned } : m))
      );

      const socket = getSocket();
      if (socket && activeChat) {
        socket.emit("pinMessage", {
          chatRoomId: activeRoom._id,
          receiverId: activeChat._id,
          messageId,
          isPinned: res.data.isPinned,
        });
      }
    } catch (err) {
      console.error("Failed to pin/unpin message:", err);
    }
  };

  // Toggle emoji reaction handler 🎭
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await API.post(`/message/react/${messageId}`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data.reactions } : m))
      );

      const socket = getSocket();
      if (socket && activeChat) {
        socket.emit("reactMessage", {
          chatRoomId: activeRoom._id,
          receiverId: activeChat._id,
          messageId,
          reactions: res.data.reactions,
        });
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  };

  // Accept Friend Request handler
  const handleAcceptRequest = async (senderId) => {
    try {
      await acceptFriendRequestApi(senderId);
      // Refresh profile & friends list
      const res = await API.get("/user/me");
      setFriends(res.data.friends || []);
      setFriendRequests(res.data.friendRequests?.filter((r) => r.status === "pending") || []);
    } catch (err) {
      alert("Failed to accept friend request");
    }
  };

  // Remove Friend handler
  const handleRemoveFriend = async (targetUserId) => {
    try {
      await removeFriendApi(targetUserId);
      setFriends((prev) => prev.filter((f) => f._id !== targetUserId));
      if (activeChat && activeChat._id === targetUserId) {
        setActiveChat(null);
        setActiveRoom(null);
      }
    } catch (err) {
      alert("Failed to remove friend");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex overflow-hidden bg-[#0B0E14]">
      {/* Sidebar */}
      <div className={`w-full md:w-80 h-full ${activeChat ? "hidden md:flex" : "flex"}`}>
        <Sidebar
          user={user}
          friends={friends}
          friendRequests={friendRequests}
          activeChat={activeChat}
          typingUsers={typingUsers}
          unreadCounts={unreadCounts}
          onSelectChat={handleSelectChat}
          onAcceptRequest={handleAcceptRequest}
          onRemoveFriend={handleRemoveFriend}
          onOpenAddFriend={() => setShowAddFriend(true)}
          onOpenProfile={() => setProfileModalData({ targetUser: user, isSelf: true })}
          onLogout={logout}
          onToggleAi={() => setIsAiOpen((prev) => !prev)}
        />
      </div>

      {/* Chat Area */}
      <div className={`w-full md:flex-1 h-full ${activeChat ? "flex" : "hidden md:flex"}`}>
        <ChatArea
          currentUser={user}
          activeChat={activeChat}
          activeRoom={activeRoom}
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onUnsendMessage={handleUnsendMessage}
          onTogglePinMessage={handleTogglePinMessage}
          onToggleReaction={handleToggleReaction}
          onBack={handleBackToContacts}
          onReportUser={(targetUser) => setReportModalUser(targetUser)}
          onOpenFriendProfile={(friendUser) => setProfileModalData({ targetUser: friendUser, isSelf: false })}
          onToggleAi={() => setIsAiOpen((prev) => !prev)}
          isAiOpen={isAiOpen}
        />
      </div>

      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
      {reportModalUser && <ReportModal reportedUser={reportModalUser} onClose={() => setReportModalUser(null)} />}
      {profileModalData && (
        <ProfileModal
          user={profileModalData.targetUser}
          friends={friends}
          isSelf={profileModalData.isSelf}
          onUpdateUser={(updatedUser) => {
            if (profileModalData.isSelf) {
              setUser(updatedUser);
            }
          }}
          onClose={() => setProfileModalData(null)}
        />
      )}

      {/* Floating / Top-Right AI Chatbot Widget 🤖 */}
      <AiChatWidget
        currentUser={user}
        friends={friends}
        activeChatMessages={messages}
        onRefreshFriends={fetchData}
        isOpen={isAiOpen}
        onToggle={() => setIsAiOpen((prev) => !prev)}
        hasActiveChat={Boolean(activeChat)}
      />
    </div>
  );
};

export default ChatDashboard;