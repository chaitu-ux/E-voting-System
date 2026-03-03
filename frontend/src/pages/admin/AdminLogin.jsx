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

      // 🎯 Role-based redirect
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-indigo-900 text-white relative">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-300 hover:text-white transition"
      >
        ← Back
      </button>

      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl w-[400px] shadow-2xl border border-white/20">

        <h1 className="text-2xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded-lg bg-white/20 placeholder-gray-300 focus:outline-none"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;