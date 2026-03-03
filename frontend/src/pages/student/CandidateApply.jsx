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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">

      <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl w-[500px] shadow-2xl border border-white/20">

        <h1 className="text-2xl font-bold text-center mb-6">
          Apply as Candidate 🗳
        </h1>

        <textarea
          placeholder="Write your manifesto..."
          value={manifesto}
          onChange={(e) => setManifesto(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-white/20 text-white placeholder-gray-300 outline-none resize-none h-32"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
          className="w-full mb-4"
        />

        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-3 p-2 rounded bg-gray-700 hover:bg-gray-800"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}

export default CandidateApply;