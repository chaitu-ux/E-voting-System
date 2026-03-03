import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      return toast.error("Please fill all fields");
    }

    try {
      setLoading(true);

      // 🔐 Clear any old session
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");

      const res = await api.post("/admin/login", {
        email,
        password,
      });

      // ✅ Save new session
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminRole", res.data.role);

      toast.success("Login successful 🔐");

      setTimeout(() => {
        if (res.data.role === "superadmin") {
          navigate("/superadmin/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      }, 600);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative fade-page">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-400 hover:text-white transition"
      >
        ← Back
      </button>

      <div className="glass-card w-[450px] max-w-[95%]">

        <h1 className="text-2xl font-bold text-center mb-3 tracking-wide">
          Admin Login
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Secure access to the election management dashboard
        </p>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modern-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modern-input"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="modern-btn w-full disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default AdminLogin;