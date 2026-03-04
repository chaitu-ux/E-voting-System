import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  /* =============================================================
     ADMIN LOGIN
  ============================================================= */
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return toast.error("Please fill all fields");
    }

    const toastId = toast.loading("🔐 Authenticating...");

    try {
      setLoading(true);

      // Clear any old session
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");

      const res = await api.post("/admin/login", {
        email: email.trim(),
        password,
      });

      // Save new session
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminRole", res.data.role);

      toast.success(
        `Welcome back! Logged in as ${res.data.role === "superadmin"
          ? "Super Admin 👑"
          : "Admin 🔐"}`,
        { id: toastId }
      );

      setTimeout(() => {
        if (res.data.role === "superadmin") {
          navigate("/superadmin/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      }, 600);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center
                    relative fade-page">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-400
                   hover:text-white transition"
      >
        ← Back
      </button>

      <div className="glass-card w-[450px] max-w-[95%]">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold tracking-wide">
            Admin Login
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Secure access to election management dashboard
          </p>
        </div>

        {/* Security badge */}
        <div className="bg-cyan-500/10 border border-cyan-500/20
                        rounded-xl p-3 mb-6 text-center">
          <p className="text-xs text-cyan-400">
            🛡️ JWT Secured — Role-based access control (Admin / SuperAdmin)
          </p>
        </div>

        <div className="space-y-4">

          {/* Email */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="modern-input"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              Password
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

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="modern-btn w-full disabled:opacity-50
                       flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Oval height={22} width={22} color="#fff" />
            ) : (
              "Login →"
            )}
          </button>

        </div>

        {/* Role info */}
        <div className="bg-white/5 border border-white/10 rounded-xl
                        p-4 mt-6">
          <p className="text-xs text-gray-500 text-center mb-2">
            Access levels
          </p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-cyan-400 font-semibold">Admin</p>
              <p className="text-xs text-gray-500 mt-1">
                Manage students
              </p>
              <p className="text-xs text-gray-500">& candidates</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-yellow-400 font-semibold">
                Super Admin 👑
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Full control
              </p>
              <p className="text-xs text-gray-500">+ election toggle</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminLogin;