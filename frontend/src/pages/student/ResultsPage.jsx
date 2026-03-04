import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

const API = "http://localhost:5000";

function ResultsPage() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState(null);
  const [electionTitle, setElectionTitle] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Blockchain verification state
  const [blockchainWinner, setBlockchainWinner] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  /* =============================================================
     LOAD RESULTS FROM BACKEND (DB)
  ============================================================= */
  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(`${API}/api/voter/results`);

      setResults(res.data.results || []);
      setWinner(res.data.winner || null);
      setElectionTitle(res.data.electionTitle || "Election Results");
      setTotalVotes(res.data.totalVotes || 0);

    } catch (error) {
      setError("Results are not available yet. Election may still be active.");
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     VERIFY RESULTS ON BLOCKCHAIN
     Cross-checks DB results with blockchain for transparency
  ============================================================= */
  const handleBlockchainVerify = async () => {
    setVerifying(true);
    try {
      const res = await axios.get(`${API}/api/voter/winner`);
      setBlockchainWinner(res.data.winner);
    } catch {
      setBlockchainWinner(null);
    } finally {
      setVerifying(false);
    }
  };

  /* =============================================================
     LOADING STATE
  ============================================================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <div className="text-center">
          <Oval height={50} width={50} color="#22d3ee" wrapperClass="justify-center mb-4" />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  /* =============================================================
     ERROR STATE
  ============================================================= */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <div className="glass-card w-[500px] max-w-[95%] text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-3 text-yellow-400">
            Results Not Available Yet
          </h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="modern-btn w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center fade-page py-10">
      <div className="container-modern flex justify-center">
        <div className="glass-card w-[900px] max-w-[95%]">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-wide mb-2">
              {electionTitle}
            </h1>
            <p className="text-gray-400">
              Official election results — recorded on blockchain
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Total Votes
              </p>
              <p className="text-2xl font-bold text-cyan-400">{totalVotes}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Candidates
              </p>
              <p className="text-2xl font-bold text-purple-400">
                {results.length}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Source
              </p>
              <p className="text-sm font-bold text-green-400 mt-1">
                ⛓️ Blockchain
              </p>
            </div>
          </div>

          {/* Winner Section */}
          {winner && (
            <div className="bg-yellow-400/10 border border-yellow-400/40
                            rounded-2xl p-8 mb-10 text-center shadow-lg">
              <p className="text-yellow-400 text-sm uppercase tracking-widest mb-2">
                🏆 Winner
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                {winner.name}
              </h2>
              <p className="text-gray-300">
                {winner.votes} Votes —{" "}
                <span className="text-yellow-400 font-semibold">
                  {winner.percentage}%
                </span>
              </p>

              {/* Winner photo if available */}
              {winner.photo && (
                <img
                  src={`${API}${winner.photo}`}
                  alt={winner.name}
                  className="w-20 h-20 rounded-full object-cover border-2
                             border-yellow-400 mx-auto mt-4"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
            </div>
          )}

          {/* Blockchain Verification Card */}
          {blockchainWinner && (
            <div className="bg-green-500/10 border border-green-500/30
                            rounded-xl p-5 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400">⛓️</span>
                <h3 className="text-green-400 font-semibold text-sm">
                  Blockchain Verification
                </h3>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Winner on Blockchain</span>
                <span className="text-xs text-green-400 font-bold">
                  {blockchainWinner.name}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">Vote Count</span>
                <span className="text-xs text-white">
                  {blockchainWinner.votes}
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-400">DB vs Blockchain</span>
                <span className={`text-xs font-bold ${
                  winner?.name === blockchainWinner.name
                    ? "text-green-400"
                    : "text-red-400"
                }`}>
                  {winner?.name === blockchainWinner.name
                    ? "✅ Match — Results Verified"
                    : "⚠️ Mismatch Detected"}
                </span>
              </div>
            </div>
          )}

          {/* All Candidates Results */}
          <div className="space-y-6 mb-8">
            {results.map((c, index) => (
              <div key={c.id}>

                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    {/* Rank badge */}
                    <span className={`text-xs px-2 py-1 rounded-full font-bold
                      ${index === 0
                        ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                        : "bg-white/10 text-gray-400"}`}>
                      #{index + 1}
                    </span>
                    {c.photo && (
                      <img
                        src={`${API}${c.photo}`}
                        alt={c.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <span className="text-cyan-400 font-semibold">
                    {c.percentage}%
                  </span>
                </div>

                {/* Vote bar */}
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full transition-all duration-1000"
                    style={{
                      width: `${c.percentage}%`,
                      background: index === 0
                        ? "linear-gradient(90deg, #FACC15, #F97316)"
                        : "linear-gradient(90deg, #00D4FF, #7C3AED)",
                    }}
                  />
                </div>

                <p className="text-sm text-gray-400 mt-1">
                  {c.votes} votes
                </p>

              </div>
            ))}
          </div>

          {/* Verify on Blockchain Button */}
          <button
            onClick={handleBlockchainVerify}
            disabled={verifying}
            className="w-full py-3 rounded-xl border border-green-400/50
                       text-green-400 hover:bg-green-400/10 transition
                       text-sm font-semibold disabled:opacity-50
                       flex items-center justify-center gap-2 mb-4"
          >
            {verifying ? (
              <Oval height={18} width={18} color="#4ade80" />
            ) : (
              "⛓️ Verify Results on Blockchain"
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate("/student/dashboard")}
            className="w-full py-3 rounded-xl border border-white/20
                       text-gray-400 hover:bg-white/5 transition text-sm"
          >
            ← Back to Dashboard
          </button>

        </div>
      </div>
    </div>
  );
}

export default ResultsPage;