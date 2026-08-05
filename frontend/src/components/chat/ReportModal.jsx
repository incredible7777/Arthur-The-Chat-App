import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert, Check } from "lucide-react";
import { reportUserApi } from "../../services/authservice";

const ReportModal = ({ reportedUser, onClose }) => {
  const [reason, setReason] = useState("Spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await reportUserApi(reportedUser._id, reason, details);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md p-6 bg-[#121722] rounded-2xl border border-[#1E2638] shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Report {reportedUser?.username}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-slate-400">Thank you for keeping Arthur safe. Our team will review this report.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl glass-input text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="Spam">Spam & Unwanted Messages</option>
                <option value="Harassment">Harassment or Bullying</option>
                <option value="Inappropriate Behavior">Inappropriate Content</option>
                <option value="Impersonation">Impersonation</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Additional Details (Optional)</label>
              <textarea
                rows={3}
                placeholder="Provide any context or details..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl glass-input text-xs focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-[#171E2C] hover:bg-[#1E293B] text-slate-300 font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{loading ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ReportModal;
