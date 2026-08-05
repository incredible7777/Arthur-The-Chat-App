import React, { useState, useRef, useEffect } from "react";
import { KeyRound, ArrowLeft, RotateCw, CheckCircle2 } from "lucide-react";

const OtpVerify = ({ email, onVerify, onResend, onBack, loading, errorMessage }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60); // 60 seconds resend countdown
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus the first box on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Trigger shake animation on error
  useEffect(() => {
    if (errorMessage) {
      setShake(true);
      const timeout = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Handle typing in single OTP boxes
  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Take last character
    setOtp(newOtp);

    // Auto-advance focus to next input box
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullOtp = newOtp.join("");
    if (fullOtp.length === 6) {
      onVerify(fullOtp);
    }
  };

  // Handle Backspace navigation between boxes
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle pasting full 6-digit code (e.g. copied from email)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      onVerify(pastedData);
    }
  };

  // Resend OTP handler
  const handleResendClick = () => {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    onResend();
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <div className={`space-y-6 ${shake ? "animate-shake" : ""}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
          <KeyRound className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Enter Verification Code</h3>
        <p className="text-xs text-slate-400">
          We sent a 6-digit OTP code to <br />
          <span className="font-semibold text-blue-400">{email}</span>
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center font-medium">
          {errorMessage}
        </div>
      )}

      {/* 6-Digit Code Inputs */}
      <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-bold rounded-xl glass-input transition-all ${
              digit ? "border-blue-500 bg-blue-600/10 text-white shadow-sm" : ""
            }`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onVerify(otp.join(""))}
          disabled={loading || otp.join("").length < 6}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          {loading ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Verify & Continue</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend & Back options */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <button
            onClick={onBack}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Change Email
          </button>

          <button
            onClick={handleResendClick}
            disabled={!canResend}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${
              canResend ? "text-blue-400 hover:text-blue-300 font-medium" : "text-slate-500 cursor-not-allowed"
            }`}
          >
            <RotateCw className="w-3 h-3" />
            {canResend ? "Resend Code" : `Resend in ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;