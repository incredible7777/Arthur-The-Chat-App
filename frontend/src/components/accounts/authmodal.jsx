import React, { useState } from "react";
import { Mail, User, Send, ShieldCheck, Zap, Lock, UserCheck, Sparkles, UserPlus } from "lucide-react";
import OtpVerify from "./otpverify";
import { requestOtp, verifyOtpCode, loginAsGuest } from "../../services/authservice";
import { useAuth } from "../../contexts/authcontext";

const AuthModal = () => {
  const { loginSuccess } = useAuth();
  const [step, setStep] = useState(1); // 1: Email Form, 2: OTP Code Verification
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle requesting OTP email
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await requestOtp(email);
      setStep(2); // Jump to OTP Verification step
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to send OTP email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification submission
  const handleVerifyOtp = async (otpCode) => {
    try {
      setLoading(true);
      setError("");
      const data = await verifyOtpCode(email, otpCode, username);
      loginSuccess(data.token, data.user);
      if (data.user?.isAdmin) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/admin";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP verification code");
    } finally {
      setLoading(false);
    }
  };

  // Handle Guest Mode click
  const onGuestClick = async () => {
    try {
      setGuestLoading(true);
      setError("");
      const data = await loginAsGuest();
      loginSuccess(data.token, data.user);
    } catch (err) {
      setError("Failed to enter Guest Mode. Please try again.");
    } fontally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col lg:flex-row bg-[#0B0E14] text-slate-100 overflow-x-hidden font-sans">
      
      {/* ------------------ 30% LEFT SIDE: BRANDING & LOGO ------------------ */}
      <div className="w-full lg:w-[32%] xl:w-[30%] bg-[#0E131F] p-8 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#1E2638] flex flex-col justify-between">
        
        {/* Top Brand Logo & Title */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Arthur Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <img
                src="/arthur-wordmark.png"
                alt="ARTHUR"
                className="h-6 object-contain"
              />
              <span className="text-[10px] font-medium text-slate-400 tracking-wider block mt-0.5">Your Personalized Chat App</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-xl font-bold text-white leading-tight">
              Messaging as smooth as thought.
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arthur connects you with friends instantly. No passwords to remember, no tedious sign-ups - just fast, private chat when you need it.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 my-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A28] border border-[#1E2638]">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Lightning-Fast Messaging</h4>
              <p className="text-[11px] text-slate-400">Live typing, photo sharing, and read receipts that keep you connected.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A28] border border-[#1E2638]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Passwordless & Secure</h4>
              <p className="text-[11px] text-slate-400">Log in effortlessly with a quick 6-digit code sent straight to your inbox.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141A28] border border-[#1E2638]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">Instant Guest Mode</h4>
              <p className="text-[11px] text-slate-400">Hop into a chat session in seconds to test the platform without sharing your email.</p>
            </div>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-4 border-t border-[#1E2638]">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Arthur Secure Workspace</span>
        </div>
      </div>

      {/* ------------------ 70% RIGHT SIDE: AUTHENTICATION & LOGIN ------------------ */}
      <div className="w-full lg:w-[68%] xl:w-[70%] p-6 sm:p-12 flex flex-col items-center justify-center bg-[#070A10] relative overflow-hidden">
        
        {/* Cool Subtle Tech Mesh Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E2A40_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Cool Centered Ambient Aura Glow */}
        <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md p-8 bg-[#121722]/90 backdrop-blur-md rounded-2xl border border-[#1E2638] shadow-2xl relative z-10 space-y-6">
          
          {step === 1 ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-1.5">
                <h3 className="text-2xl font-bold text-white tracking-tight">Let's get you connected.</h3>
                <p className="text-xs text-slate-400">Enter your email to receive a quick security code, or jump right in as a guest.</p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center font-medium">
                  {error}
                </div>
              )}

              {/* Email & Name Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 ml-1">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <span>Sending Code...</span>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-[#1E2638] w-full" />
                <span className="bg-[#121722] px-3 text-xs text-slate-500 uppercase tracking-wider font-medium">Or</span>
              </div>

              {/* Guest Mode Instant Access */}
              <button
                onClick={onGuestClick}
                disabled={guestLoading}
                className="w-full py-3 px-4 bg-[#171E2C] hover:bg-[#1E293B] text-slate-200 border border-[#232D42] font-medium rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{guestLoading ? "Entering Guest Mode..." : "Explore in Guest Mode"}</span>
              </button>

            </div>
          ) : (
            <OtpVerify
              email={email}
              onVerify={handleVerifyOtp}
              onResend={handleSendOtp}
              onBack={() => setStep(1)}
              loading={loading}
              errorMessage={error}
            />
          )}

        </div>
      </div>

    </div>
  );
};

export default AuthModal;