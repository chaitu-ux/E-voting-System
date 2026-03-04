import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

function StudentRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    studentId: "",
    name: "",
    email: "",
    department: "",
    year: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =============================================================
     HANDLE INPUT CHANGE
  ============================================================= */
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* =============================================================
     PASSWORD STRENGTH INDICATOR
  ============================================================= */
  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 6) return { label: "Weak", color: "text-red-400", width: "w-1/4" };
    if (password.length < 8) return { label: "Fair", color: "text-yellow-400", width: "w-2/4" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Good", color: "text-blue-400", width: "w-3/4" };
    return { label: "Strong", color: "text-green-400", width: "w-full" };
  };

  const strength = getPasswordStrength(form.password);

  /* =============================================================
     VALIDATION
  ============================================================= */
  const validateForm = () => {
    const { studentId, name, email, department, year, password, confirmPassword } = form;

    if (!studentId.trim() || !name.trim() || !email.trim() ||
        !department.trim() || !year.trim() || !password || !confirmPassword) {
      toast.error("All fields are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (!["1", "2", "3", "4"].includes(year)) {
      toast.error("Year must be 1, 2, 3 or 4");
      return false;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  /* =============================================================
     REGISTER STUDENT
  ============================================================= */
  const handleRegister = async () => {
    if (loading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        studentId: form.studentId.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        year: form.year.trim(),
        password: form.password,
      };

      // Updated endpoint to match new authRoutes
      const res = await api.post("/auth/register-student", payload);

      toast.success(res.data.message || "Registration successful!");

      setForm({
        studentId: "",
        name: "",
        email: "",
        department: "",
        year: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => navigate("/student"), 1500);

    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center fade-page py-10">
      <div className="container-modern flex justify-center">
        <div className="glass-card w-[500px] max-w-[95%]">

          {/* Header */}
          <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
            Student Registration 🎓
          </h1>
          <p className="text-center text-gray-400 mb-3">
            Register to participate in secure blockchain voting.
          </p>

          {/* MFA Notice */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl
                          p-3 mb-6 text-center">
            <p className="text-xs text-cyan-400">
              🔐 MFA Protected — Password + OTP + Blockchain DID verification
            </p>
          </div>

          <div className="space-y-4">

            {/* Student ID */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Student ID</label>
              <input
                name="studentId"
                placeholder="e.g. CS2024001"
                value={form.studentId}
                onChange={handleChange}
                className="modern-input"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
              <input
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                className="modern-input"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                className="modern-input"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Department</label>
              <input
                name="department"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
                className="modern-input"
              />
            </div>

            {/* Year */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Year</label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                className="modern-input"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Password — MFA Factor 1 */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Password{" "}
                <span className="text-cyan-400">(MFA Factor 1)</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={handleChange}
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

              {/* Password Strength Bar */}
              {form.password && strength && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300
                      ${strength.width}
                      ${strength.label === "Weak" ? "bg-red-400" :
                        strength.label === "Fair" ? "bg-yellow-400" :
                        strength.label === "Good" ? "bg-blue-400" : "bg-green-400"}`}
                    />
                  </div>
                  <p className={`text-xs mt-1 ${strength.color}`}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="modern-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-white text-xs transition"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>

              {/* Match indicator */}
              {form.confirmPassword && (
                <p className={`text-xs mt-1 ${
                  form.password === form.confirmPassword
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {form.password === form.confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* MFA Steps Info */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs text-gray-400 mb-2 font-semibold">
                After registration you will go through:
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">
                  ✅ <span className="text-white">Factor 1</span> — Password (set above)
                </p>
                <p className="text-xs text-gray-400">
                  📧 <span className="text-white">Factor 2</span> — OTP sent to your email
                </p>
                <p className="text-xs text-gray-400">
                  🔗 <span className="text-white">Factor 3</span> — DID registered on blockchain by admin
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="modern-btn w-full disabled:opacity-50
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <Oval height={22} width={22} color="#fff" />
              ) : (
                "Register 🎓"
              )}
            </button>

          </div>

          {/* Login Link */}
          <p className="text-center mt-6 text-gray-400 text-sm">
            Already registered?{" "}
            <span
              onClick={() => navigate("/student")}
              className="text-cyan-400 cursor-pointer hover:underline"
            >
              Login here
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

export default StudentRegister;