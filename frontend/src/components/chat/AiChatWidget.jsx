import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, X, Send, Trash2, Minus, Loader2, Users, UserPlus, FileText, HelpCircle } from "lucide-react";
import API from "../../services/api";

const AiChatWidget = ({
  currentUser,
  friends = [],
  activeChatMessages = [],
  onRefreshFriends,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  hasActiveChat = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnToggle || setInternalIsOpen;

  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const username = currentUser?.username || "there";
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: `Hii ${username}! 👋 I'm **Arthur AI**, your assistant! Ask me anything, or command me to **show your friends**, **unfriend someone**, or **summarize your chat**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Update welcome message if username changes
  useEffect(() => {
    if (currentUser?.username) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === "welcome"
            ? {
                ...m,
                text: `Hii ${currentUser.username}! 👋 I'm **Arthur AI**, your assistant! Ask me anything, or command me to **show your friends**, **unfriend someone**, or **summarize your chat**!`,
              }
            : m
        )
      );
    }
  }, [currentUser?.username]);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of AI chat window
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (promptToSend) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!promptToSend) setInputPrompt("");
    setLoading(true);

    try {
      const res = await API.post("/api/ai/chat", {
        prompt: text,
        friends,
        activeChatMessages,
      });

      const aiReply = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: res.data.reply || "Sorry, I couldn't process that.",
        friendsData: res.data.friendsData || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiReply]);

      // If AI performed friend modification, refresh global app friends
      if (res.data.action === "REMOVE_FRIEND" || res.data.action === "ADD_FRIEND") {
        if (onRefreshFriends) onRefreshFriends();
      }
    } catch (err) {
      console.error("AI Request Failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Sorry, I encountered an issue connecting to the AI server.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "ai",
        text: `Chat cleared! How can I help you next, ${username}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Helper to format simple markdown (bold **text**, line breaks, bullet points)
  const formatText = (content) => {
    if (!content) return "";
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Replace **text** with <strong>text</strong>
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-semibold text-blue-300">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={idx}>
          {formattedLine}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className={`fixed z-50 flex flex-col items-end ${
        hasActiveChat ? "top-16 right-4 sm:right-6" : "bottom-6 right-6"
      }`}
    >
      {/* Floating Window Overlay */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[380px] h-[460px] sm:h-[500px] max-h-[75vh] bg-[#121722]/95 backdrop-blur-xl border border-[#232D42] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in ${
            hasActiveChat ? "slide-in-from-top-5 mt-1" : "slide-in-from-bottom-5 mb-3"
          }`}
        >
          
          {/* Header */}
          <div className="p-3.5 bg-[#171E2C] border-b border-[#232D42] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Arthur AI <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize AI Chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-[#1A2232] text-slate-200 border border-[#263248] rounded-bl-none"
                  }`}
                >
                  <div>{formatText(m.text)}</div>

                  {/* Render Friend List Cards if available */}
                  {m.friendsData && m.friendsData.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/50 space-y-1.5">
                      {m.friendsData.map((f) => (
                        <div key={f._id} className="flex items-center justify-between bg-[#121722] p-1.5 rounded-lg border border-slate-800">
                          <div className="flex items-center gap-2">
                            <img src={f.avatar} alt={f.username} className="w-6 h-6 rounded-full" />
                            <span className="text-[11px] font-semibold text-white">{f.username}</span>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${f.isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                            {f.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] opacity-50 mt-1 text-right">{m.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mt-0.5">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#1A2232] border border-[#263248] text-slate-400 text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Arthur AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-1.5 bg-[#0E131F] border-t border-[#1E2638] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend("Show my friends")}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-medium border border-blue-500/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Users className="w-3 h-3" /> Show Friends
            </button>
            <button
              onClick={() => handleSend("Summarize active chat")}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-medium border border-indigo-500/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" /> Summarize Chat
            </button>
            <button
              onClick={() => handleSend("What can you do?")}
              className="flex-shrink-0 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-medium border border-amber-500/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" /> What can you do?
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#171E2C] border-t border-[#232D42] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Arthur AI or command 'Unfriend [name]'..."
              className="flex-1 bg-[#0E131F] border border-[#232D42] focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button (Rendered ONLY on Home Page / No Active Chat) */}
      {!hasActiveChat && (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          title="Chat with Arthur AI"
          className="group relative p-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-blue-500/30 hover:scale-105 transition-all duration-200 cursor-pointer flex items-center justify-center"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-[#0B0E14] animate-pulse" />
            </div>
          )}

          {/* Hover Tooltip */}
          {!isOpen && (
            <span className="absolute right-14 bg-[#171E2C] text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#232D42] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Arthur AI 🤖
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default AiChatWidget;
