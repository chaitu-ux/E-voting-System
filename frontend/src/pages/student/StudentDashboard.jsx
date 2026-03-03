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
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">
          Student Dashboard 🎓
        </h1>

        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-10">

        {/* Election Status */}
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="mb-2 text-lg">Election Status</h3>
          <p className={`text-2xl font-bold ${electionOpen ? "text-green-400" : "text-red-400"}`}>
            {electionOpen ? "Open" : "Closed"}
          </p>
        </div>

        {/* Application Status */}
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="mb-2 text-lg">Candidate Application</h3>
          <p className="text-2xl font-bold">
            {applicationStatus || "Not Applied"}
          </p>
        </div>

        {/* Voting Status */}
        <div className="bg-white/10 p-6 rounded-xl">
          <h3 className="mb-2 text-lg">Voting</h3>
          <p className="text-2xl font-bold">
            {electionOpen ? "Available" : "Unavailable"}
          </p>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-6">

        {/* Apply Button */}
        {!applicationStatus && (
          <button
            onClick={() => navigate("/student/apply")}
            className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg"
          >
            Apply as Candidate 🗳
          </button>
        )}

        {/* Vote Button */}
        {electionOpen && (
          <button
            onClick={() => navigate("/student/vote")}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg"
          >
            Vote Now 🗳
          </button>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;