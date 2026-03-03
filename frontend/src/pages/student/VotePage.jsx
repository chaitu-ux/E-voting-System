import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [electionOpen, setElectionOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  useEffect(() => {
    if (!token) {
      navigate("/student");
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchElectionStatus();
    fetchCandidates();
  }, []);

  const fetchElectionStatus = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/election-status"
      );
      setElectionOpen(res.data.isOpen);
    } catch {
      setElectionOpen(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/candidates/approved"
      );
      setCandidates(res.data);
    } catch {
      toast.error("Failed to load candidates");
    }
  };

  const handleVote = async () => {
    if (!electionOpen) return toast.error("Election closed");
    if (!selectedCandidate) return toast.error("Select a candidate");

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/vote",
        { candidate: selectedCandidate },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Vote submitted successfully!");

      navigate("/student/success", {
        state: {
          transactionHash: response.data.transactionHash,
          blockNumber: response.data.blockNumber,
        },
      });

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Voting failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <div className="bg-white/10 p-10 rounded-2xl w-[600px]">

        <h1 className="text-3xl font-bold text-center mb-6">
          Select Your Candidate
        </h1>

        <div className="space-y-4">
          {candidates.map((candidate) => (
            <div
              key={candidate._id}
              onClick={() => setSelectedCandidate(candidate._id)}
              className={`p-4 rounded-xl cursor-pointer border transition flex items-center gap-4 ${
                selectedCandidate === candidate._id
                  ? "bg-indigo-600 border-indigo-400"
                  : "bg-white/10 border-transparent"
              }`}
            >
              {/* ✅ Candidate Image */}
              <img
                src={`http://localhost:5000${candidate.photo}`}
                alt={candidate.name}
                className="w-16 h-16 rounded-full object-cover border"
              />

              <div>
                <h2 className="text-lg font-semibold">
                  {candidate.name}
                </h2>
                <p className="text-sm opacity-70">
                  {candidate.manifesto}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleVote}
          disabled={loading}
          className="w-full mt-8 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition"
        >
          {loading ? (
            <Oval height={25} width={25} color="#fff" />
          ) : (
            "Cast Vote"
          )}
        </button>

      </div>
    </div>
  );
}

export default VotePage;