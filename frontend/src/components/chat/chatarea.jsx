import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  CheckCheck,
  Check,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Trash2,
  Paperclip,
  FileText,
  Download,
  Pin,
  Search,
  ChevronDown,
  ChevronUp,
  Bot,
  CornerUpLeft,
} from "lucide-react";
import { getSocket } from "../../services/socketservice";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "🔥", "😮"];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const ChatArea = ({
  currentUser,
  activeChat,
  activeRoom,
  messages,
  isTyping,
  onSendMessage,
  onUnsendMessage,
  onTogglePinMessage,
  onToggleReaction,
  onBack,
  onReportUser,
  onOpenFriendProfile,
  onToggleAi,
  isAiOpen,
}) => {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // { fileUrl, fileName, fileSize }
  const [replyingTo, setReplyingTo] = useState(null); // { messageId, senderName, text }
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedDropdown, setShowPinnedDropdown] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [activeMobileActionMsgId, setActiveMobileActionMsgId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Gesture refs for swipe & long-press
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const longPressTimerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Smooth scroll & trace directly to target pinned message
  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId(null), 2500);
    }
  };

  // Emit typing indicator socket events
  const handleInputChange = (e) => {
    setText(e.target.value);
    const socket = getSocket();

    if (socket && activeChat && activeRoom) {
      socket.emit("typing", {
        chatRoomId: activeRoom._id,
        receiverId: activeChat._id,
        username: currentUser?.username,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          chatRoomId: activeRoom._id,
          receiverId: activeChat._id,
        });
      }, 2000);
    }
  };

  // Handle Photo attachment selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle File / Document attachment selection
  const handleDocSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be smaller than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        fileUrl: reader.result,
        fileName: file.name,
        fileSize: file.size,
      });
      setSelectedImage(null);
    };
    reader.readAsDataURL(file);
  };

  // Send message submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !selectedImage && !selectedFile) return;

    onSendMessage(text.trim(), selectedImage, selectedFile, replyingTo);
    setText("");
    setSelectedImage(null);
    setSelectedFile(null);
    setReplyingTo(null);

    const socket = getSocket();
    if (socket && activeChat && activeRoom) {
      socket.emit("stopTyping", {
        chatRoomId: activeRoom._id,
        receiverId: activeChat._id,
      });
    }
  };

  // Long press timer start
  const handleTouchStart = (m, senderName, e) => {
    touchStartXRef.current = e.touches ? e.touches[0].clientX : e.clientX;
    touchStartYRef.current = e.touches ? e.touches[0].clientY : e.clientY;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setActiveMobileActionMsgId(m._id);
    }, 450);
  };

  // Touch end / Swipe detection
  const handleTouchEnd = (m, senderName, e) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = endX - touchStartXRef.current;
    const diffY = endY - touchStartYRef.current;

    // Trigger swipe to reply if horizontal drag > 50px
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
      if (navigator.vibrate) navigator.vibrate(25);
      setReplyingTo({
        messageId: m._id,
        senderName: senderName,
        text: m.message || m.fileName || (m.image ? "Photo attachment" : "Attachment"),
      });
      setActiveMobileActionMsgId(null);
    }
  };

  if (!activeChat) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0B0E14] text-slate-500 p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#141A28] border border-[#1E2638] flex items-center justify-center text-slate-400">
          <MessageSquare className="w-8 h-8 text-blue-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">Your Workspace Chat</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Select a friend from the sidebar list or click the + button to start messaging!
          </p>
        </div>
      </div>
    );
  }

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.message?.toLowerCase().includes(searchQuery.toLowerCase()) || m.fileName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0E14] relative overflow-hidden">
      
      {/* ----------------- TOP ACTIVE CHAT HEADER ----------------- */}
      <div className="p-3.5 px-4 sm:px-6 bg-[#121722] border-b border-[#1E2638] flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-[#171E2C] border border-[#232D42] cursor-pointer touch-manipulation"
              title="Back to contacts"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onOpenFriendProfile && onOpenFriendProfile(activeChat)}
            title="Click to view Friend Profile"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <img src={activeChat.avatar} alt={activeChat.username} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-700 group-hover:border-blue-500 transition-colors object-cover" />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121722] ${
                  activeChat.isOnline ? "bg-emerald-500" : "bg-slate-600"
                }`}
              />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{activeChat.username}</h3>
              <p className="text-[11px] text-slate-400">
                {isTyping ? (
                  <span className="text-blue-400 font-medium flex items-center gap-1 animate-pulse">
                    typing...
                  </span>
                ) : activeChat.isOnline ? (
                  <span className="text-emerald-400 font-medium">Online</span>
                ) : (
                  "Offline"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Arthur AI Header Button 🤖 */}
          {onToggleAi && (
            <button
              onClick={onToggleAi}
              title="Arthur AI Assistant"
              className={`p-2 rounded-xl border transition-all cursor-pointer touch-manipulation flex items-center gap-1.5 ${
                isAiOpen
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/50 shadow-md shadow-blue-500/30 scale-105"
                  : "bg-[#171E2C] border-[#232D42] text-slate-300 hover:text-white hover:border-blue-500/40"
              }`}
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </button>
          )}

          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Search Messages"
            className={`p-2 rounded-xl border transition-colors cursor-pointer touch-manipulation ${
              showSearch ? "bg-blue-600/20 text-blue-400 border-blue-500/40" : "text-slate-400 hover:text-white bg-[#171E2C] border-[#232D42]"
            }`}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Report User Button */}
          {onReportUser && (
            <button
              onClick={() => onReportUser(activeChat)}
              title="Report User"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl bg-[#171E2C] border border-[#232D42] transition-colors cursor-pointer touch-manipulation"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ----------------- SEARCH BAR (WHEN TOGGLED) ----------------- */}
      {showSearch && (
        <div className="bg-[#141A28] border-b border-[#1E2638] p-2.5 px-4 sm:px-6 flex items-center gap-3 animate-fadeIn flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages in this chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-slate-500"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ----------------- PINNED MESSAGES HEADER & DROPDOWN ----------------- */}
      {pinnedMessages.length > 0 && (
        <div className="bg-[#151D2C] border-b border-[#222E44] transition-all flex-shrink-0">
          <div className="px-4 sm:px-6 py-2 flex items-center justify-between text-xs">
            <div
              onClick={() => scrollToMessage(pinnedMessages[pinnedMessages.length - 1]._id)}
              className="flex items-center gap-2 text-slate-300 truncate flex-1 cursor-pointer hover:text-amber-300 transition-colors"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="font-semibold text-amber-400 flex-shrink-0">Pinned ({pinnedMessages.length}):</span>
              <span className="truncate italic">"{pinnedMessages[pinnedMessages.length - 1].message || pinnedMessages[pinnedMessages.length - 1].fileName || "Attachment"}"</span>
            </div>
            
            <button
              onClick={() => setShowPinnedDropdown(!showPinnedDropdown)}
              title="Expand all pinned messages"
              className="text-slate-400 hover:text-white p-1.5 ml-2 cursor-pointer flex items-center gap-1 font-medium touch-manipulation"
            >
              {showPinnedDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Full List of Pinned Messages */}
          {showPinnedDropdown && (
            <div className="px-4 sm:px-6 pb-3 pt-1 space-y-2 border-t border-[#222E44]/60 max-h-48 overflow-y-auto">
              {pinnedMessages.map((pm) => (
                <div
                  key={pm._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#111724] border border-[#232F46] text-xs hover:border-amber-500/40 transition-all group"
                >
                  <div
                    onClick={() => {
                      scrollToMessage(pm._id);
                      setShowPinnedDropdown(false);
                    }}
                    className="flex items-center gap-2 flex-1 truncate cursor-pointer"
                  >
                    <Pin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-white font-medium truncate">{pm.message || pm.fileName || "Attachment"}</span>
                  </div>

                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => {
                        scrollToMessage(pm._id);
                        setShowPinnedDropdown(false);
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-medium transition-colors cursor-pointer touch-manipulation"
                    >
                      Jump
                    </button>
                    <button
                      onClick={() => onTogglePinMessage(pm._id)}
                      title="Unpin"
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- MESSAGES CONTAINER ----------------- */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {searchQuery ? "No messages found matching your search." : "No messages yet. Send a wave to say hello!"}
          </div>
        ) : (
          filteredMessages.map((m) => {
            const senderId = typeof m.sender === "object" ? m.sender?._id || m.sender?.id : m.sender;
            const currentUserId = typeof currentUser === "object" ? currentUser?._id || currentUser?.id : currentUser;
            const isMe = String(senderId) === String(currentUserId);
            const senderName = isMe ? "You" : (typeof m.sender === "object" ? m.sender?.username : activeChat.username);
            const isHighlighted = highlightedMsgId === m._id;
            const isMobileActionOpen = activeMobileActionMsgId === m._id;

            return (
              <div
                key={m._id || m.createdAt}
                id={`msg-${m._id}`}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1 relative group pt-6 -mt-6`}
              >
                {/* Message Bubble Container with Swipe & Long Press Handlers */}
                <div
                  onTouchStart={(e) => handleTouchStart(m, senderName, e)}
                  onTouchEnd={(e) => handleTouchEnd(m, senderName, e)}
                  onMouseDown={(e) => handleTouchStart(m, senderName, e)}
                  onMouseUp={(e) => handleTouchEnd(m, senderName, e)}
                  onClick={() => setActiveMobileActionMsgId(isMobileActionOpen ? null : m._id)}
                  className={`relative max-w-[88%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm transition-all cursor-pointer touch-pan-y ${
                    isHighlighted ? "ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-[1.02]" : ""
                  } ${
                    m.isDeleted
                      ? "bg-[#161D2B]/60 text-slate-500 border border-slate-800 italic"
                      : isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#171E2C] text-slate-200 border border-[#232D42] rounded-bl-none"
                  }`}
                >
                  {/* Pinned Indicator Icon */}
                  {m.isPinned && (
                    <div className="absolute -top-2 -left-2 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                      <Pin className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Quoted Reply Preview Inside Message Bubble */}
                  {m.replyTo && !m.isDeleted && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToMessage(m.replyTo.messageId);
                      }}
                      className="mb-2 p-2 rounded-lg bg-black/25 border-l-4 border-amber-400 text-xs cursor-pointer hover:bg-black/35 transition-colors"
                    >
                      <p className="font-semibold text-amber-300 text-[11px] flex items-center gap-1">
                        <CornerUpLeft className="w-3 h-3" /> Replying to {m.replyTo.senderName}
                      </p>
                      <p className="truncate text-slate-200 text-[11px] italic">{m.replyTo.text}</p>
                    </div>
                  )}

                  {/* Action Bar (Reply, React, Pin, Delete) - Visible on Hover OR Tap OR Long Press */}
                  {!m.isDeleted && (
                    <div
                      className={`absolute top-0 -translate-y-full mb-1 flex items-center gap-1 bg-[#121722] border border-[#232D42] p-1 rounded-xl shadow-xl z-20 transition-opacity ${
                        isMobileActionOpen ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                      } ${isMe ? "right-0" : "left-0"}`}
                    >
                      {/* Quick Emoji Reaction Buttons */}
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleReaction(m._id, emoji);
                            setActiveMobileActionMsgId(null);
                          }}
                          className="hover:scale-125 transition-transform p-1.5 cursor-pointer text-xs sm:text-sm touch-manipulation"
                        >
                          {emoji}
                        </button>
                      ))}

                      {/* Reply Action Button ↩️ */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyingTo({
                            messageId: m._id,
                            senderName: senderName,
                            text: m.message || m.fileName || (m.image ? "Photo attachment" : "Attachment"),
                          });
                          setActiveMobileActionMsgId(null);
                        }}
                        title="Reply to Message"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer touch-manipulation"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Pin Toggle Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinMessage(m._id);
                          setActiveMobileActionMsgId(null);
                        }}
                        title={m.isPinned ? "Unpin Message" : "Pin Message"}
                        className={`p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation ${
                          m.isPinned ? "text-amber-400" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      {/* Unsend Action (If Sender) */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Unsend this message for everyone?")) {
                              onUnsendMessage(m._id);
                              setActiveMobileActionMsgId(null);
                            }
                          }}
                          title="Unsend Message"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer touch-manipulation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Image Attachment Rendering */}
                  {m.image && !m.isDeleted && (
                    <div className="mb-2.5 rounded-xl overflow-hidden cursor-pointer">
                      <img
                        src={m.image}
                        alt="Attachment"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalImage(m.image);
                        }}
                        className="max-h-60 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                      />
                    </div>
                  )}

                  {/* Document / File Attachment Rendering */}
                  {m.fileUrl && !m.isDeleted && (
                    <div className="mb-2.5 p-3 rounded-xl bg-[#0F1420] border border-[#232F46] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{m.fileName || "Attachment File"}</p>
                          <p className="text-[10px] text-slate-400">{formatBytes(m.fileSize)}</p>
                        </div>
                      </div>

                      <a
                        href={m.fileUrl}
                        download={m.fileName || "attachment"}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                        title="Download File"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>

                  {/* Reactions List */}
                  {m.reactions && m.reactions.length > 0 && !m.isDeleted && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-white/10">
                      {m.reactions.map((r, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#121722]/80 border border-[#232D42] text-[11px] font-medium"
                        >
                          {r.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Timestamp & Read Receipt */}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                  <span>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Just now"}
                  </span>

                  {isMe && !m.isDeleted && (
                    <span className="ml-1">
                      {m.isRead ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" title="Seen" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400 inline" title="Sent" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ----------------- REPLY PREVIEW BAR BEFORE SENDING ----------------- */}
      {replyingTo && (
        <div className="px-4 sm:px-6 py-2 bg-[#121722] border-t border-[#1E2638] flex items-center justify-between border-l-4 border-blue-500 animate-in slide-in-from-bottom-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-blue-400">Replying to {replyingTo.senderName}</p>
              <p className="text-slate-300 truncate max-w-sm italic">{replyingTo.text}</p>
            </div>
          </div>

          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ----------------- PREVIEW ATTACHMENT BAR BEFORE SENDING ----------------- */}
      {(selectedImage || selectedFile) && (
        <div className="px-4 sm:px-6 py-2 bg-[#121722] border-t border-[#1E2638] flex items-center justify-between flex-shrink-0">
          {selectedImage ? (
            <div className="flex items-center gap-3">
              <img src={selectedImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
              <span className="text-xs text-slate-300">Photo attached</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <div className="text-xs">
                <p className="font-semibold text-white truncate max-w-xs">{selectedFile.fileName}</p>
                <p className="text-[10px] text-slate-400">{formatBytes(selectedFile.fileSize)}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setSelectedImage(null);
              setSelectedFile(null);
            }}
            className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ----------------- CHAT INPUT FORM ----------------- */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-[#121722] border-t border-[#1E2638] flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Photo Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach Image"
          className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer touch-manipulation"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

        {/* File / Document Upload Button */}
        <button
          type="button"
          onClick={() => docInputRef.current?.click()}
          title="Attach Document / File"
          className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer touch-manipulation"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input ref={docInputRef} type="file" accept="*" className="hidden" onChange={handleDocSelect} />

        {/* Message Input Box */}
        <input
          type="text"
          placeholder={`Message ${activeChat.username}...`}
          value={text}
          onChange={handleInputChange}
          className="flex-1 py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl bg-[#171E2C] border border-[#232D42] text-white text-base sm:text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-500"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !selectedImage && !selectedFile}
          className="p-2.5 sm:p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer touch-manipulation"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>

      {/* Full Screen Image Lightbox View */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <button
            onClick={() => setPreviewModalImage(null)}
            className="absolute top-4 right-4 p-2 bg-black/40 text-slate-300 hover:text-white rounded-full touch-manipulation"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={previewModalImage} alt="Full View" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default ChatArea;