import React, { useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function CandidateApply() {
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [manifesto, setManifesto] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!manifesto || !photo) {
      return toast.error("All fields are required");
    }

    if (!token) {
      toast.error("Please login again");
      navigate("/student");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("manifesto", manifesto);
      formData.append("photo", photo);

      await api.post("/candidates/apply", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Application submitted successfully 🎉");

      setManifesto("");
      setPhoto(null);

      setTimeout(() => {
        navigate("/student/dashboard");
      }, 1200);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Application failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-page">
      <div className="container-modern flex justify-center">

        <div className="glass-card w-[550px] max-w-[95%]">

          <h1 className="text-2xl font-bold text-center mb-3 tracking-wide">
            Apply as Candidate 🗳
          </h1>

          <p className="text-center text-gray-400 mb-8">
            Submit your manifesto and profile photo for approval.
          </p>

          <div className="space-y-6">

            {/* Manifesto */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
                Manifesto
              </label>
              <textarea
                placeholder="Write your manifesto..."
                value={manifesto}
                onChange={(e) => setManifesto(e.target.value)}
                className="modern-input h-36 resize-none"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 
                           file:rounded-lg file:border-0 
                           file:bg-white/10 file:text-white 
                           hover:file:bg-white/20 transition"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleApply}
              disabled={loading}
              className="modern-btn w-full disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition"
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