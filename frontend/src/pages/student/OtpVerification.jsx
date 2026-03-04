import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { Oval } from "react-loader-spinner";

const API = "http://localhost:5000";

function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();

  const studentId = location.state?.studentId;

  // OTP split into 6 individual boxes
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Countdown timer for resend OTP
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  /* =============================================================
     REDIRECT IF NO STUDENT ID
  ============================================================= */
  useEffect(() => {
    if (!studentId) navigate("/student");
  }, [studentId, navigate]);

  /* =============================================================
     COUNTDOWN TIMER FOR RESEND
  ============================================================= */
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  /* =============================================================
     OTP BOX INPUT HANDLER
     Auto-focus next box on input, go back on delete
  ============================================================= */
  const handleOtpChange = (index, value) => {
    // Only allow single digit
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // take last char only
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Go back on backspace if current box is empty
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Submit on Enter
    if (e.key === "Enter") handleVerifyOtp();
  };

  // Handle paste — fill all boxes at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const getOtpString = () => otpDigits.join("");

  /* =============================================================
     VERIFY OTP — MFA Factor 2
  ============================================================= */
  const handleVerifyOtp = async () => {
    const otp = getOtpString();

    if (otp.length < 6) {
      return toast.error("Please enter the complete 6-digit OTP");
    }

    const toastId = toast.loading("🔐 Verifying OTP...");

    try {
      setLoading(true);

      const res = await axios.post(`${API}/api/auth/verify-otp`, {
        studentId,
        otp,
      });

      // Save JWT token
      if (res.data.token) {
        localStorage.setItem("studentToken", res.data.token);
      }

      // Save student info
      if (res.data.student) {
        localStorage.setItem(
          "studentInfo",
          JSON.stringify(res.data.student)
        );
      }

      toast.success(
        "✅ MFA Complete! Redirecting to dashboard...",
        { id: toastId }
      );

      setTimeout(() => navigate("/student/dashboard"), 800);

    } catch (error) {
      // Clear OTP boxes on failure
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      toast.error(
        error.response?.data?.message || "OTP Verification Failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     RESEND OTP
  ============================================================= */
  const handleResendOtp = async () => {
    if (!canResend) return;

    setResending(true);
    const toastId = toast.loading("📧 Resending OTP...");

    try {
      await axios.post(`${API}/api/auth/send-otp`, { studentId });

      toast.success("📧 New OTP sent to your email!", { id: toastId });

      // Reset countdown
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend OTP",
        { id: toastId }
      );
    } finally {
      setResending(false);
    }
  };

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center fade-page">

      {/* Back Button */}
      <button
        onClick={() => navigate("/student")}
        className="absolute top-6 left-6 text-gray-400
                   hover:text-white transition duration-300"
      >
        ← Back
      </button>

      <div className="glass-card w-[420px] max-w-[90%] text-center">

        {/* Header */}
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          OTP Verification
        </h1>
        <p className="text-gray-400 mb-2">
          Enter the 6-digit code sent to your registered email
        </p>

        {/* MFA Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-cyan-500 text-white
                            text-xs flex items-center justify-center font-bold">
              ✓
            </div>
            <span className="text-xs text-cyan-400">Password</span>
          </div>
          <div className="h-px w-6 bg-cyan-400" />
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border
                            border-cyan-500 text-cyan-400 text-xs
                            flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-xs text-cyan-400">OTP</span>
          </div>
          <div className="h-px w-6 bg-white/20" />
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-white/10 text-gray-500
                            text-xs flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-xs text-gray-500">DID</span>
          </div>
        </div>

        {/* Student ID Display */}
        <div className="bg-white/5 rounded-lg px-4 py-2 mb-6 inline-block">
          <p className="text-xs text-gray-400">
            Verifying for:{" "}
            <span className="text-cyan-400 font-semibold">{studentId}</span>
          </p>
        </div>

        {/* OTP Input Boxes */}
        <div className="flex justify-center gap-3 mb-6">
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-11 h-12 text-center text-xl font-bold rounded-xl
                         border transition-all duration-200 bg-white/5 outline-none
                         ${digit
                           ? "border-cyan-400 text-cyan-400 shadow-lg shadow-cyan-400/20"
                           : "border-white/20 text-white"
                         }
                         focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20`}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerifyOtp}
          disabled={loading || getOtpString().length < 6}
          className="modern-btn w-full disabled:opacity-50
                     flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <Oval height={22} width={22} color="#fff" />
          ) : (
            "Verify OTP ✓"
          )}
        </button>

        {/* Resend OTP */}
        <div className="mt-2">
          {canResend ? (
            <button
              onClick={handleResendOtp}
              disabled={resending}
              className="text-sm text-cyan-400 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "📧 Resend OTP"}
            </button>
          ) : (
            <p className="text-sm text-gray-500">
              Resend OTP in{" "}
              <span className="text-cyan-400 font-semibold">
                {countdown}s
              </span>
            </p>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4">
          OTP is valid for 5 minutes only
        </p>

      </div>
    </div>
  );
}

export default OtpVerification;