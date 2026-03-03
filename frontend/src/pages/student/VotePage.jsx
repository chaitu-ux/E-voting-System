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

  /* 🔐 BLOCKCHAIN TRANSACTION STYLE VOTE */
  const handleVote = async () => {
    if (!electionOpen) return toast.error("Election closed");
    if (!selectedCandidate) return toast.error("Select a candidate");

    // 🔄 Show loading blockchain toast
    const toastId = toast.loading(
      "⏳ Transaction Pending...\nWaiting for blockchain confirmation"
    );

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

      // ✅ Update loading toast to success
      toast.success(
        "✅ Transaction Confirmed!\nVote recorded securely.",
        { id: toastId }
      );

      navigate("/student/success", {
        state: {
          transactionHash: response.data.transactionHash,
          blockNumber: response.data.blockNumber,
        },
      });

    } catch (error) {
      // ❌ Update loading toast to error
      toast.error(
        error.response?.data?.message || "Transaction failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-page">
      <div className="container-modern flex justify-center">

        <div className="glass-card w-[700px] max-w-[95%]">

          <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
            Select Your Candidate
          </h1>

          <p className="text-center text-gray-400 mb-8">
            Choose carefully. Your vote will be securely recorded on the blockchain.
          </p>

          <div className="space-y-5">
            {candidates.map((candidate) => (
              <div
                key={candidate._id}
                onClick={() => setSelectedCandidate(candidate._id)}
                className={`p-5 rounded-xl cursor-pointer border transition-all duration-300 flex items-center gap-5 ${
                  selectedCandidate === candidate._id
                    ? "border-cyan-400 shadow-lg shadow-cyan-400/30 scale-[1.02]"
                    : "border-transparent hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <img
                  src={`http://localhost:5000${candidate.photo}`}
                  alt={candidate.name}
                  className="w-20 h-20 rounded-full object-cover border border-white/20"
                />

                <div>
                  <h2 className="text-lg font-semibold">
                    {candidate.name}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {candidate.manifesto}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleVote}
            disabled={loading}
            className="modern-btn w-full mt-10 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Oval height={25} width={25} color="#fff" />
            ) : (
              "Cast Vote"
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

export default VotePage;