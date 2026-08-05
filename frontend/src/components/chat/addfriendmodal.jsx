import React, { useState } from "react";
import { Search, UserPlus, X, Check, Loader2 } from "lucide-react";
import { searchUsersApi, sendFriendRequestApi } from "../../services/authservice";

const AddFriendModal = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState([]);
  const [message, setMessage] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setMessage("");
      const data = await searchUsersApi(query);
      setResults(data);
      if (data.length === 0) setMessage("No users found matching your search.");
    } catch (err) {
      setMessage("Failed to search users.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequestApi(userId);
      setRequestedIds((prev) => [...prev, userId]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 bg-[#121722] rounded-2xl border border-[#1E2638] shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-400" /> Add New Friends
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2 rounded-xl glass-input text-xs focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
          </button>
        </form>

        {/* Status Message */}
        {message && <p className="text-xs text-slate-400 text-center py-2">{message}</p>}

        {/* Results List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {results.map((u) => {
            const isSent = requestedIds.includes(u._id);
            return (
              <div key={u._id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#171E2C] border border-[#232D42]">
                <div className="flex items-center gap-2.5">
                  <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full border border-slate-700" />
                  <div>
                    <h4 className="text-xs font-medium text-white">{u.username}</h4>
                    {u.email && <p className="text-[11px] text-slate-400">{u.email}</p>}
                  </div>
                </div>

                <button
                  onClick={() => handleSendRequest(u._id)}
                  disabled={isSent}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    isSent
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                  }`}
                >
                  {isSent ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Sent
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Add Friend
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AddFriendModal;