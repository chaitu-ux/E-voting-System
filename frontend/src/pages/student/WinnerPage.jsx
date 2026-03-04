import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";

const API = "http://localhost:5000";

function WinnerPage() {
  const navigate = useNavigate();
  const [width, height] = useWindowSize();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blockchainWinner, setBlockchainWinner] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    fetchResults();
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  /* =============================================================
     FETCH RESULTS FROM BACKEND
  ============================================================= */
  const fetchResults = async () => {
    try {
      const res = await axios.get(`${API}/api/voter/results`);
      setData(res.data);
    } catch (error) {
      console.error("Results error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     VERIFY WINNER ON BLOCKCHAIN
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
          <Oval
            height={50}
            width={50}
            color="#22d3ee"
            wrapperClass="justify-center mb-4"
          />
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  /* =============================================================
     NO DATA STATE
  ============================================================= */
  if (!data || !data.winner) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <div className="glass-card w-[500px] max-w-[95%] text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-3">
            Results Not Available Yet
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            The election may still be active or no votes have been cast yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="modern-btn w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { winner, results, electionTitle, totalVotes } = data;

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen fade-page py-10">

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={250}
          recycle={false}
        />
      )}

      <div className="container-modern">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between
                        md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">
              🏆 Election Results
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {electionTitle} — Blockchain verified
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20
                       border border-white/10 transition text-sm"
          >
            Back to Home
          </button>
        </div>

        {/* Winner Spotlight */}
        <div className="glass-card text-center mb-8">

          <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
            🏆 Winner
          </p>

          {/* Winner Photo */}
          <div className="relative inline-block mb-6">
            <img
              src={
                winner.photo
                  ? `${API}${winner.photo}`
                  : "https://via.placeholder.com/144"
              }
              alt={winner.name}
              className="w-36 h-36 rounded-full object-cover
                         border-4 border-yellow-400 shadow-lg
                         shadow-yellow-400/30 mx-auto"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/144";
              }}
            />
            {/* Crown badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2
                            text-2xl">
              👑
            </div>
          </div>

          <h3 className="text-3xl font-bold text-yellow-400 mb-3">
            {winner.name}
          </h3>

          <div className="flex justify-center gap-8 mt-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Votes
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {winner.votes}
              </p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Vote Share
              </p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {winner.percentage}%
              </p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Cast
              </p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {totalVotes}
              </p>
            </div>
          </div>

          {/* Blockchain Verify Button */}
          <button
            onClick={handleBlockchainVerify}
            disabled={verifying}
            className="mt-8 px-6 py-2 rounded-xl border border-green-400/50
                       text-green-400 hover:bg-green-400/10 transition
                       text-sm font-semibold disabled:opacity-50
                       flex items-center justify-center gap-2 mx-auto"
          >
            {verifying ? (
              <Oval height={16} width={16} color="#4ade80" />
            ) : (
              "⛓️ Verify Winner on Blockchain"
            )}
          </button>

          {/* Blockchain Verification Result */}
          {blockchainWinner && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30
                            rounded-xl p-4 text-left max-w-md mx-auto">
              <p className="text-green-400 font-semibold text-sm mb-3">
                ⛓️ Blockchain Verification Result
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">
                    Winner on Blockchain
                  </span>
                  <span className="text-xs text-green-400 font-bold">
                    {blockchainWinner.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Vote Count</span>
                  <span className="text-xs text-white">
                    {blockchainWinner.votes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">
                    DB vs Blockchain
                  </span>
                  <span className={`text-xs font-bold ${
                    winner.name === blockchainWinner.name
                      ? "text-green-400"
                      : "text-red-400"
                  }`}>
                    {winner.name === blockchainWinner.name
                      ? "✅ Verified — Results Match"
                      : "⚠️ Mismatch Detected"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* All Candidates Ranking */}
        <div className="glass-card">

          <h2 className="text-sm uppercase tracking-widest text-gray-400 mb-6">
            All Candidates Ranking
          </h2>

          <div className="space-y-4">
            {results
              .sort((a, b) => b.votes - a.votes)
              .map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`flex flex-col md:flex-row md:justify-between
                              md:items-center p-5 rounded-xl transition
                              ${index === 0
                                ? "bg-yellow-400/10 border border-yellow-400/30"
                                : "bg-white/5 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-4">

                    {/* Rank */}
                    <span className={`text-lg font-bold w-8 ${
                      index === 0 ? "text-yellow-400" :
                      index === 1 ? "text-gray-300" :
                      index === 2 ? "text-orange-400" :
                      "text-gray-500"
                    }`}>
                      #{index + 1}
                    </span>

                    {/* Photo */}
                    {candidate.photo && (
                      <img
                        src={`${API}${candidate.photo}`}
                        alt={candidate.name}
                        className="w-10 h-10 rounded-full object-cover
                                   border border-white/20"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}

                    <span className={`font-medium ${
                      index === 0 ? "text-yellow-400" : "text-white"
                    }`}>
                      {candidate.name}
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-yellow-400/20
                                         text-yellow-400 px-2 py-0.5 rounded-full">
                          Winner
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Vote bar + count */}
                  <div className="mt-3 md:mt-0 md:w-1/2">
                    <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                      <div
                        className="h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${candidate.percentage}%`,
                          background: index === 0
                            ? "linear-gradient(90deg, #FACC15, #F97316)"
                            : "linear-gradient(90deg, #00D4FF, #7C3AED)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">
                        {candidate.votes} votes
                      </span>
                      <span className="text-xs text-cyan-400 font-semibold">
                        {candidate.percentage}%
                      </span>
                    </div>
                  </div>

                </div>
              ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default WinnerPage;