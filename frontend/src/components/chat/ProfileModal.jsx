import React, { useState } from "react";
import { X, Camera, User, Mail, Check, Save, RotateCw, Users } from "lucide-react";
import API from "../../services/api";

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CyberTech",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=CoolEmoji",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelMaster",
];

const ProfileModal = ({ user, friends = [], isSelf = true, onUpdateUser, onClose }) => {
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [customAvatarInput, setCustomAvatarInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "friends"

  // Handle uploading base64 photo for DP
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size must be smaller than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg("Username cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const targetAvatar = customAvatarInput.trim() || avatar;
      const res = await API.put("/user/profile", {
        username: username.trim(),
        avatar: targetAvatar,
      });

      if (onUpdateUser) {
        onUpdateUser(res.data.user);
      }

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#111622] border border-[#20293A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Natural Slate Header Banner */}
        <div className="relative h-28 bg-gradient-to-r from-[#172033] via-[#1C273D] to-[#141C2D] border-b border-[#232F46] p-4 flex justify-between items-start">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F1626]/80 backdrop-blur-md border border-[#232F46] text-slate-300 text-xs font-medium">
            {isSelf ? "My Account" : "Friend Profile"}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#0F1626]/80 text-slate-400 hover:text-white border border-[#232F46] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Avatar Overlay */}
        <div className="relative px-6 -mt-12 flex justify-between items-end mb-4">
          <div className="relative group">
            <img
              src={avatar || user?.avatar}
              alt={username}
              className="w-24 h-24 rounded-full border-4 border-[#111622] bg-[#172033] object-cover shadow-xl"
            />
            {isSelf && (
              <label className="absolute bottom-0 right-0 p-2 bg-[#1E293B] hover:bg-blue-600 text-white rounded-full border border-[#334155] cursor-pointer shadow-lg transition-colors">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          {/* Quick Stats Badges */}
          <div className="flex gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#172033] border border-[#232F46] text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Friends</span>
              <span className="text-xs font-semibold text-slate-100">{friends.length}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#172033] border border-[#232F46] text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Status</span>
              <span className="text-xs font-semibold text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#20293A] px-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "profile" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "friends" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Friends List ({friends.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
              {errorMsg}
            </div>
          )}

          {activeTab === "profile" ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Username Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Name / Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    disabled={!isSelf}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#172033] border border-[#232F46] text-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    disabled
                    value={user?.email || "Guest Account"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#172033]/50 border border-[#232F46] text-slate-400 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Avatar Preset Selector (If Self) */}
              {isSelf && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-slate-300">Choose Preset Avatar DP</label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAvatar(url);
                          setCustomAvatarInput("");
                        }}
                        className={`p-1 rounded-xl border transition-all cursor-pointer ${
                          avatar === url ? "border-blue-500 bg-blue-600/20 scale-105" : "border-[#232F46] hover:border-slate-500 bg-[#172033]"
                        }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-10 h-10 rounded-lg object-contain mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              {isSelf && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Profile Changes</span>
                </button>
              )}

            </form>
          ) : (
            /* Friends List View */
            <div className="space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No friends connected yet.</div>
              ) : (
                friends.map((f) => (
                  <div key={f._id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#172033] border border-[#232F46]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={f.avatar} alt={f.username} className="w-8 h-8 rounded-full border border-slate-700" />
                        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${f.isOnline ? "bg-emerald-500" : "bg-slate-500"}`} />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-white">{f.username}</h5>
                        <p className="text-[10px] text-slate-400">{f.email || "Guest User"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      {f.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
