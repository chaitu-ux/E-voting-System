import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

function CandidateApply() {
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [form, setForm] = useState({
    manifesto: "",
    department: "",
    tagline: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =============================================================
     PHOTO HANDLER — with preview
  ============================================================= */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be less than 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setPhoto(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  /* =============================================================
     VALIDATION
  ============================================================= */
  const validate = () => {
    if (!form.manifesto.trim()) {
      toast.error("Please write your manifesto");
      return false;
    }
    if (form.manifesto.trim().length < 50) {
      toast.error("Manifesto must be at least 50 characters");
      return false;
    }
    if (!photo) {
      toast.error("Please upload your photo");
      return false;
    }
    if (!token) {
      toast.error("Please login again");
      navigate("/student");
      return false;
    }
    return true;
  };

  /* =============================================================
     SUBMIT APPLICATION
  ============================================================= */
  const handleApply = async () => {
    if (loading) return;
    if (!validate()) return;

    const toastId = toast.loading("📤 Submitting your application...");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("manifesto", form.manifesto.trim());
      formData.append("photo", photo);

      if (form.department.trim()) {
        formData.append("department", form.department.trim());
      }
      if (form.tagline.trim()) {
        formData.append("tagline", form.tagline.trim());
      }

      await api.post("/candidates/apply", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "🎉 Application submitted! Waiting for admin approval.",
        { id: toastId }
      );

      setTimeout(() => navigate("/student/dashboard"), 1200);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Application failed",
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
    <div className="min-h-screen flex items-center justify-center fade-page py-10">
      <div className="container-modern flex justify-center">
        <div className="glass-card w-[580px] max-w-[95%]">

          {/* Header */}
          <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
            Apply as Candidate 🎤
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Submit your profile for admin approval to stand in the election.
          </p>

          <div className="space-y-5">

            {/* Photo Upload with Preview */}
            <div>
              <label className="block text-xs text-gray-400 mb-2
                                uppercase tracking-wider">
                Profile Photo *
              </label>

              {/* Preview */}
              {photoPreview && (
                <div className="flex justify-center mb-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover
                               border-2 border-cyan-400 shadow-lg
                               shadow-cyan-400/20"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-sm text-gray-300
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:bg-white/10 file:text-white
                           hover:file:bg-white/20 transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max 2MB. JPG, PNG, WEBP accepted.
              </p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs text-gray-400 mb-2
                                uppercase tracking-wider">
                Department (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                className="modern-input"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs text-gray-400 mb-2
                                uppercase tracking-wider">
                Campaign Tagline (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. A voice for every student"
                value={form.tagline}
                maxLength={80}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tagline: e.target.value }))
                }
                className="modern-input"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {form.tagline.length}/80
              </p>
            </div>

            {/* Manifesto */}
            <div>
              <label className="block text-xs text-gray-400 mb-2
                                uppercase tracking-wider">
                Manifesto * (min 50 characters)
              </label>
              <textarea
                placeholder="Write your election manifesto — what will you do for students?"
                value={form.manifesto}
                onChange={(e) =>
                  setForm((p) => ({ ...p, manifesto: e.target.value }))
                }
                className="modern-input h-40 resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className={`text-xs ${
                  form.manifesto.length < 50
                    ? "text-red-400"
                    : "text-green-400"
                }`}>
                  {form.manifesto.length < 50
                    ? `${50 - form.manifesto.length} more characters needed`
                    : "✓ Minimum length met"}
                </p>
                <p className="text-xs text-gray-500">
                  {form.manifesto.length} chars
                </p>
              </div>
            </div>

            {/* What happens next info box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 font-semibold mb-2">
                📋 What happens after submission?
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  1. Admin reviews your application
                </p>
                <p className="text-xs text-gray-500">
                  2. If approved, you appear on the voting ballot
                </p>
                <p className="text-xs text-gray-500">
                  3. Your blockchain candidate ID will be assigned
                </p>
                <p className="text-xs text-gray-500">
                  4. Students can vote for you during the election
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleApply}
              disabled={loading}
              className="modern-btn w-full disabled:opacity-50
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <Oval height={22} width={22} color="#fff" />
              ) : (
                "Submit Application 🎤"
              )}
            </button>

            {/* Cancel */}
            <button
              onClick={() => navigate(-1)}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10
                         border border-white/10 transition text-sm
                         text-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateApply;