import React, { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [electionOpen, setElectionOpen] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/student");
      return;
    }

    fetchElectionStatus();
    fetchApplicationStatus();
  }, []);

  /* =========================
     FETCH ELECTION STATUS
  ========================= */
  const fetchElectionStatus = async () => {
    try {
      const res = await api.get("/election-status");
      setElectionOpen(res.data.isOpen);
    } catch {
      toast.error("Failed to fetch election status");
    }
  };

  /* =========================
     FETCH APPLICATION STATUS
  ========================= */
  const fetchApplicationStatus = async () => {
    try {
      const res = await api.get("/candidates/my-status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplicationStatus(res.data.status);
    } catch {
      setApplicationStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    navigate("/student");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <p className="text-gray-400 text-lg">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-4">
          <h1 className="text-3xl font-bold tracking-wide">
            Student Dashboard 🎓
          </h1>

          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition"
          >
            Logout
          </button>
        </div>

        {/* STATUS CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">

          {/* Election Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-sm tracking-wider">
              Election Status
            </h3>
            <p className={`stat-number mt-3 ${
              electionOpen ? "text-green-400" : "text-red-400"
            }`}>
              {electionOpen ? "Open" : "Closed"}
            </p>
          </div>

          {/* Application Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-sm tracking-wider">
              Candidate Application
            </h3>
            <p className="stat-number mt-3 text-purple-400">
              {applicationStatus || "Not Applied"}
            </p>
          </div>

          {/* Voting Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-sm tracking-wider">
              Voting
            </h3>
            <p className="stat-number mt-3 text-cyan-400">
              {electionOpen ? "Available" : "Unavailable"}
            </p>
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Apply Button */}
          {!applicationStatus && (
            <button
              onClick={() => navigate("/student/apply")}
              className="modern-btn"
            >
              Apply as Candidate 🗳
            </button>
          )}

          {/* Vote Button */}
          {electionOpen && (
            <button
              onClick={() => navigate("/student/vote")}
              className="modern-btn"
            >
              Vote Now 🗳
            </button>
          )}

        </div>

      </div>
    </div>
  );
}

export default StudentDashboard;