import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

const API = "http://localhost:5000";

function StudentLogin() {
  const navigate = useNavigate();

  // Step 1 — Password
  // Step 2 — OTP sent, navigate to OTP page
  const [step, setStep] = useState(1);

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /* =============================================================
     STEP 1 — VERIFY PASSWORD (MFA Factor 1)
     On success → backend sends OTP → navigate to OTP page
  ============================================================= */
  const handleLogin = async () => {
    if (!studentId.trim()) {
      return toast.error("Please enter your Student ID");
    }
    if (!password) {
      return toast.error("Please enter your password");
    }

    const toastId = toast.loading("🔐 Verifying credentials...");

    try {
      setLoading(true);

      const res = await axios.post(`${API}/api/auth/login`, {
        studentId: studentId.trim(),
        password,
      });

      toast.success(
        "✅ Password verified! OTP sent to your email.",
        { id: toastId }
      );

      // Move to step 2 visually
      setStep(2);

      // Navigate to OTP verification page
      setTimeout(() => {
        navigate("/student/otp", {
          state: {
            studentId: res.data.studentId,
            // Pass mfaStep so OTP page knows this is MFA flow
            mfaStep: res.data.mfaStep,
          },
        });
      }, 1000);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center relative fade-page">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-400
                   hover:text-white transition duration-300"
      >
        ← Back
      </button>

      <div className="glass-card w-[420px] max-w-[90%]">

        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
          Student Login
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Secure login with Multi-Factor Authentication
        </p>

        {/* MFA Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">

          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            text-sm font-bold transition-all
              ${step >= 1
                ? "bg-cyan-500 text-white"
                : "bg-white/10 text-gray-500"}`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span className={`text-xs ${step >= 1 ? "text-cyan-400" : "text-gray-500"}`}>
              Password
            </span>
          </div>

          {/* Connector */}
          <div className={`h-px w-8 transition-all
            ${step >= 2 ? "bg-cyan-400" : "bg-white/20"}`}
          />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            text-sm font-bold transition-all
              ${step >= 2
                ? "bg-cyan-500 text-white"
                : "bg-white/10 text-gray-500"}`}>
              2
            </div>
            <span className={`text-xs ${step >= 2 ? "text-cyan-400" : "text-gray-500"}`}>
              OTP
            </span>
          </div>

          {/* Connector */}
          <div className="h-px w-8 bg-white/20" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center
                            text-sm font-bold bg-white/10 text-gray-500">
              3
            </div>
            <span className="text-xs text-gray-500">DID</span>
          </div>

        </div>

        {/* Step 1 Form */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Student ID */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Student ID
              </label>
              <input
                type="text"
                placeholder="e.g. CS2024001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="modern-input"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Password{" "}
                <span className="text-cyan-400">(MFA Factor 1)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="modern-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-white text-xs transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="modern-btn w-full disabled:opacity-50
                         flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Oval height={22} width={22} color="#fff" />
              ) : (
                "Verify Password & Send OTP →"
              )}
            </button>

          </div>
        )}

        {/* Step 2 — Transitioning to OTP page */}
        {step === 2 && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">📧</div>
            <p className="text-green-400 font-semibold mb-2">
              Password Verified!
            </p>
            <p className="text-gray-400 text-sm">
              OTP has been sent to your registered email.
              Redirecting to verification...
            </p>
            <div className="flex justify-center mt-4">
              <Oval height={30} width={30} color="#22d3ee" />
            </div>
          </div>
        )}

        {/* MFA Info */}
        {step === 1 && (
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 mt-5">
            <p className="text-xs text-gray-500 text-center">
              🔐 This system uses 3-factor authentication:
              Password → OTP → Blockchain DID
            </p>
          </div>
        )}

        {/* Register Link */}
        {step === 1 && (
          <p className="text-center mt-6 text-gray-400 text-sm">
            New student?{" "}
            <span
              onClick={() => navigate("/student/register")}
              className="text-cyan-400 cursor-pointer hover:underline"
            >
              Register here
            </span>
          </p>
        )}

      </div>
    </div>
  );
}

export default StudentLogin;