import React, { useState, useEffect } from "react";
import { ShieldAlert, Users, UserCheck, AlertTriangle, MessageSquare, Trash2, Ban, Link, Unlink, LogOut, Key, ArrowRight } from "lucide-react";
import API from "../../services/api";

const AdminDashboard = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    !!localStorage.getItem("adminToken")
  );
  const [adminKey, setAdminKey] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("overview"); // "overview", "users", "friendships", "reports"
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalMessages: 0, pendingReports: 0 });
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Friendship link state
  const [userA, setUserA] = useState("");
  const [userB, setUserB] = useState("");

  // Handle Admin Passkey Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError("");
      const res = await API.post("/admin/login", { key: adminKey });
      localStorage.setItem("adminToken", res.data.token);
      setIsAdminLoggedIn(true);
      fetchAdminData();
    } catch (err) {
      setLoginError(err.response?.data?.message || "Invalid Admin Passkey");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdminLoggedIn(false);
  };

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/reports"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setReports(reportsRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn]);

  // Toggle Ban User
  const handleToggleBan = async (userId) => {
    try {
      const res = await API.post(`/admin/ban/${userId}`);
      alert(res.data.message);
      fetchAdminData();
    } catch (err) {
      alert("Failed to change ban status");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${username}?`)) return;
    try {
      await API.delete(`/admin/user/${userId}`);
      alert(`User ${username} deleted permanently`);
      fetchAdminData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  // Break Friendship
  const handleRemoveFriendship = async (userAId, userBId) => {
    try {
      await API.post("/admin/friendship/remove", { userAId, userBId });
      alert("Friendship broken successfully");
      fetchAdminData();
    } catch (err) {
      alert("Failed to remove friendship");
    }
  };

  // Force Add Friendship
  const handleAddFriendship = async (e) => {
    e.preventDefault();
    if (!userA || !userB || userA === userB) {
      alert("Select two different users to connect");
      return;
    }
    try {
      await API.post("/admin/friendship/add", { userAId: userA, userBId: userB });
      alert("Friendship linked successfully!");
      setUserA("");
      setUserB("");
      fetchAdminData();
    } catch (err) {
      alert("Failed to link friendship");
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 bg-[#121722] rounded-3xl border border-[#1E2638] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Arthur Admin Command Center</h2>
            <p className="text-xs text-slate-400">Enter Admin Secret Passkey to access control portal</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" /> Admin Passkey
              </label>
              <input
                type="password"
                placeholder="Enter admin passkey (e.g. admin123)..."
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full py-3 px-4 rounded-xl glass-input text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Access Admin Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-200 flex flex-col">
      {/* Top Admin Bar */}
      <div className="p-4 bg-[#121722] border-b border-[#1E2638] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
            👑
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Arthur Admin Command Center
            </h2>
            <p className="text-[11px] text-slate-400">Platform Management & Network Supervision</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 bg-[#171E2C] hover:bg-[#1E293B] text-slate-300 rounded-lg text-xs font-medium border border-[#232D42] transition-colors"
          >
            Go to User Chat
          </a>

          <button
            onClick={handleAdminLogout}
            className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="p-3 bg-[#0E131F] border-b border-[#1E2638] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "overview" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          📊 System Overview
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "users" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Users Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("friendships")}
          className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "friendships" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <Link className="w-3.5 h-3.5" /> Friendships Graph
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === "reports" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Abuse Reports ({reports.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#121722] rounded-2xl border border-[#1E2638] flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Registered Users</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalUsers}</h3>
                </div>
              </div>

              <div className="p-5 bg-[#121722] rounded-2xl border border-[#1E2638] flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Currently Online</p>
                  <h3 className="text-2xl font-bold text-emerald-400">{stats.onlineUsers}</h3>
                </div>
              </div>

              <div className="p-5 bg-[#121722] rounded-2xl border border-[#1E2638] flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Messages Sent</p>
                  <h3 className="text-2xl font-bold text-white">{stats.totalMessages}</h3>
                </div>
              </div>

              <div className="p-5 bg-[#121722] rounded-2xl border border-[#1E2638] flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Flagged Reports</p>
                  <h3 className="text-2xl font-bold text-amber-400">{stats.pendingReports}</h3>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-6 bg-[#121722] rounded-2xl border border-[#1E2638] space-y-3">
              <h3 className="text-sm font-bold text-white">Admin Quick Controls</h3>
              <p className="text-xs text-slate-400">Manage who stays on Arthur, ban bad actors, or manage friendships between users.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveTab("users")} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                  Manage Users & Bans
                </button>
                <button onClick={() => setActiveTab("friendships")} className="px-4 py-2 bg-[#171E2C] hover:bg-[#1E293B] text-slate-300 rounded-xl text-xs font-semibold border border-[#232D42]">
                  Link / Unlink Friendships
                </button>
              </div>
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT TAB */}
        {activeTab === "users" && (
          <div className="bg-[#121722] rounded-2xl border border-[#1E2638] overflow-hidden">
            <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">All Registered & Guest Accounts</h3>
              <span className="text-xs text-slate-400">Total: {users.length} Users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0E131F] text-slate-400 border-b border-[#1E2638]">
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Friends Count</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[#171E2C]/50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-slate-700" />
                        <div>
                          <p className="font-semibold text-white truncate">{u.username}</p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email || "Guest Account"}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {u.isGuest ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            Guest
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            Verified User
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {u.isBanned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                            🚫 Banned
                          </span>
                        ) : u.isOnline ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="text-slate-500">Offline</span>
                        )}
                      </td>
                      <td className="p-3.5 font-medium text-slate-300">
                        {u.friends ? u.friends.length : 0} Friends
                      </td>
                      <td className="p-3.5 flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBan(u._id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                            u.isBanned
                              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30"
                              : "bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FRIENDSHIPS GRAPH TAB */}
        {activeTab === "friendships" && (
          <div className="space-y-6">
            {/* Force Link Friendship Box */}
            <div className="p-6 bg-[#121722] rounded-2xl border border-[#1E2638] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-400" /> Connect Two Users as Friends (Force Link)
              </h3>
              <form onSubmit={handleAddFriendship} className="flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={userA}
                  onChange={(e) => setUserA(e.target.value)}
                  className="w-full sm:w-1/3 py-2.5 px-3 rounded-xl glass-input text-xs"
                >
                  <option value="">Select User 1...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email || "Guest"})
                    </option>
                  ))}
                </select>

                <span className="text-slate-500 font-bold">⇄</span>

                <select
                  value={userB}
                  onChange={(e) => setUserB(e.target.value)}
                  className="w-full sm:w-1/3 py-2.5 px-3 rounded-xl glass-input text-xs"
                >
                  <option value="">Select User 2...</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email || "Guest"})
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full sm:w-auto py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                >
                  Link as Friends
                </button>
              </form>
            </div>

            {/* Existing Friendships List */}
            <div className="bg-[#121722] rounded-2xl border border-[#1E2638] p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Active Friendship Connections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.flatMap((u) =>
                  (u.friends || []).map((f) => {
                    if (u._id >= f._id) return null; // Avoid duplicate bidirectional rendering
                    return (
                      <div key={`${u._id}-${f._id}`} className="p-3.5 bg-[#171E2C] rounded-xl border border-[#232D42] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={u.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-xs font-bold text-white">{u.username}</p>
                            <p className="text-[10px] text-slate-400">{u.email || "Guest"}</p>
                          </div>
                          <span className="text-blue-400 font-bold text-xs mx-1">🤝</span>
                          <div>
                            <p className="text-xs font-bold text-white">{f.username}</p>
                            <p className="text-[10px] text-slate-400">{f.email || "Guest"}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFriendship(u._id, f._id)}
                          title="Break Friendship"
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                ).filter(Boolean)}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="bg-[#121722] rounded-2xl border border-[#1E2638] overflow-hidden">
            <div className="p-4 border-b border-[#1E2638] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Flagged User Reports</h3>
              <span className="text-xs text-slate-400">Total: {reports.length} Reports</span>
            </div>

            <div className="p-4 space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">No user reports submitted.</div>
              ) : (
                reports.map((r) => (
                  <div key={r._id} className="p-4 bg-[#171E2C] rounded-xl border border-[#232D42] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                          {r.reason}
                        </span>
                        <span className="text-xs text-slate-400">
                          Reported by <strong className="text-white">{r.reporter?.username}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">
                        Target User: <strong className="text-amber-400">{r.reportedUser?.username}</strong> ({r.reportedUser?.email || "Guest"})
                      </p>
                      {r.details && <p className="text-xs text-slate-400 italic">"{r.details}"</p>}
                    </div>

                    <button
                      onClick={() => handleToggleBan(r.reportedUser?._id)}
                      className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      {r.reportedUser?.isBanned ? "User Banned" : "Ban Reported User"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
