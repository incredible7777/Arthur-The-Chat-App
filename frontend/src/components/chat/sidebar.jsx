import React, { useState } from "react";
import { LogOut, UserPlus, Users, Bell, Check, UserCheck, UserMinus, ShieldAlert, Settings, Bot, Sparkles } from "lucide-react";

const Sidebar = ({
  user,
  friends,
  friendRequests,
  activeChat,
  typingUsers = {},
  unreadCounts = {},
  onSelectChat,
  onAcceptRequest,
  onRemoveFriend,
  onOpenAddFriend,
  onOpenProfile,
  onLogout,
  onToggleAi,
}) => {
  const [tab, setTab] = useState("friends"); // "friends" or "requests"

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-[#121722] border-r border-[#1E2638]">
      
      {/* Top Profile Header */}
      <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
        <div
          onClick={onOpenProfile}
          title="Click to view & edit My Profile"
          className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-[#1A2232] transition-colors"
        >
          <div className="relative flex-shrink-0">
            <img src={user?.avatar} alt={user?.username} className="w-10 h-10 rounded-full border border-slate-700 group-hover:border-blue-500 transition-colors object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#121722] rounded-full" />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold text-white truncate flex items-center gap-1.5 group-hover:text-blue-400 transition-colors">
              {user?.username}
              {user?.isGuest && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                  Guest
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 truncate">{user?.email || "Guest Account"}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Arthur AI Shortcut Button */}
          {onToggleAi && (
            <button
              onClick={onToggleAi}
              title="Arthur AI Assistant"
              className="p-2 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4" />
            </button>
          )}

          {/* Settings / Profile Button */}
          <button
            onClick={onOpenProfile}
            title="My Profile & Settings"
            className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Admin Portal Shortcut Button */}
          <a
            href="/admin"
            title="Admin Command Center"
            className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" />
          </a>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between p-2 border-b border-[#1E2638] gap-1 bg-[#0E131F]">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            tab === "friends" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Friends ({friends.length})
        </button>

        <button
          onClick={() => setTab("requests")}
          className={`relative flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            tab === "requests" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Requests
          {friendRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              {friendRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenAddFriend}
          title="Add Friend"
          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {tab === "friends" ? (
          friends.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500 space-y-2">
              <UserCheck className="w-7 h-7 mx-auto text-slate-600" />
              <p className="text-xs">No friends added yet.<br />Click the + button to search users!</p>
            </div>
          ) : (
            friends.map((f) => {
              const isSelected = activeChat?._id === f._id;
              const isFriendTyping = typingUsers[f._id] || typingUsers[String(f._id)];
              const unreadCount = unreadCounts[f._id] || unreadCounts[String(f._id)] || 0;

              return (
                <div
                  key={f._id}
                  onClick={() => onSelectChat(f)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group ${
                    isSelected ? "bg-blue-600/20 border border-blue-500/30 text-white" : "hover:bg-[#1A2232] text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <img src={f.avatar} alt={f.username} className="w-9 h-9 rounded-full border border-slate-700" />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#121722] ${
                          isFriendTyping
                            ? "bg-blue-500 animate-ping"
                            : f.isOnline
                            ? "bg-emerald-500"
                            : "bg-slate-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{f.username}</h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {isFriendTyping ? (
                          <span className="text-blue-400 font-medium animate-pulse">typing...</span>
                        ) : f.isOnline ? (
                          <span className="text-emerald-400 font-medium">Online</span>
                        ) : (
                          "Offline"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Unread Message Badge Pill */}
                  {!isSelected && unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-sm ml-2 flex-shrink-0">
                      {unreadCount >= 6 ? "5+ new msgs" : `${unreadCount} new msg${unreadCount > 1 ? "s" : ""}`}
                    </span>
                  )}

                  {/* Remove Friend Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Unfriend ${f.username}?`)) {
                        onRemoveFriend(f._id);
                      }
                    }}
                    title="Remove Friend"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer ml-1"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )
        ) : (
          friendRequests.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">No pending friend requests.</div>
          ) : (
            friendRequests.map((req) => (
              <div key={req._id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#171E2C] border border-[#232D42]">
                <div className="flex items-center gap-2.5">
                  <img src={req.sender.avatar} alt={req.sender.username} className="w-8 h-8 rounded-full" />
                  <span className="text-xs font-medium text-white truncate">{req.sender.username}</span>
                </div>
                <button
                  onClick={() => onAcceptRequest(req.sender._id)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            ))
          )
        )}
      </div>

    </div>
  );
};

export default Sidebar;