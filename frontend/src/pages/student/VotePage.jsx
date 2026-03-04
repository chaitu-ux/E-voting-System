import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Oval } from "react-loader-spinner";

const API = "http://localhost:5000";

function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [electionOpen, setElectionOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);

  // ── ZKP Commit → Reveal phase tracking ──
  const [votePhase, setVotePhase] = useState("idle");
  // idle → committing → committed → revealing → done

  const [commitData, setCommitData] = useState(null);
  // stores commitmentHash + transactionHash from Phase 1

  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  useEffect(() => {
    if (!token) navigate("/student");
  }, [token, navigate]);

  useEffect(() => {
    fetchElectionStatus();
    fetchCandidates();
  }, []);

  const fetchElectionStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/election-status`);
      setElectionOpen(res.data.isOpen);
    } catch {
      setElectionOpen(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/candidates/approved`);
      setCandidates(res.data);
    } catch {
      toast.error("Failed to load candidates");
    }
  };

  /* =============================================================
     PHASE 1 — COMMIT VOTE (ZKP-Inspired)
     Submits commitment hash to blockchain without revealing choice
  ============================================================= */
  const handleCommit = async () => {
    if (!electionOpen) return toast.error("Election is closed");
    if (!selectedCandidate) return toast.error("Please select a candidate first");

    const toastId = toast.loading(
      "🔒 Phase 1: Submitting vote commitment to blockchain..."
    );

    try {
      setLoading(true);
      setVotePhase("committing");

      const res = await axios.post(
        `${API}/api/voter/commit-vote`,
        { candidateId: selectedCandidate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCommitData({
        commitmentHash: res.data.commitmentHash,
        commitTransactionHash: res.data.commitTransactionHash,
        blockNumber: res.data.blockNumber,
      });

      setVotePhase("committed");

      toast.success(
        "✅ Phase 1 Complete! Commitment recorded on blockchain.",
        { id: toastId }
      );

    } catch (error) {
      setVotePhase("idle");
      toast.error(
        error.response?.data?.message || "Commitment failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     PHASE 2 — REVEAL VOTE (ZKP Verification)
     Reveals actual vote — blockchain verifies against commitment
     Returns E2E verification code
  ============================================================= */
  const handleReveal = async () => {
    const toastId = toast.loading(
      "🗳️ Phase 2: Revealing vote on blockchain...\nVerifying commitment..."
    );

    try {
      setLoading(true);
      setVotePhase("revealing");

      const res = await axios.post(
        `${API}/api/voter/reveal-vote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        "✅ Vote confirmed and verified on blockchain!",
        { id: toastId }
      );

      // Navigate to success page with full receipt data
      navigate("/student/success", {
        state: {
          transactionHash: res.data.transactionHash,
          blockNumber: res.data.blockNumber,
          verificationCode: res.data.verificationCode,
          commitmentHash: commitData?.commitmentHash,
          commitTransactionHash: commitData?.commitTransactionHash,
        },
      });

    } catch (error) {
      setVotePhase("committed"); // go back to committed so they can retry
      toast.error(
        error.response?.data?.message || "Vote reveal failed",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  /* =============================================================
     PHASE STEP INDICATOR
  ============================================================= */
  const PhaseIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-8">

      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${votePhase === "idle"
            ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
            : "bg-cyan-500 text-white"}`}>
          {votePhase === "idle" ? "1" : "✓"}
        </div>
        <span className={`text-sm ${votePhase === "idle" ? "text-cyan-400" : "text-white"}`}>
          Select & Commit
        </span>
      </div>

      {/* Connector */}
      <div className={`h-px w-10 ${votePhase === "committed" || votePhase === "revealing" || votePhase === "done"
        ? "bg-cyan-400" : "bg-white/20"}`} />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${votePhase === "committed" || votePhase === "revealing"
            ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
            : votePhase === "done"
            ? "bg-cyan-500 text-white"
            : "bg-white/10 border border-white/20 text-gray-500"}`}>
          {votePhase === "done" ? "✓" : "2"}
        </div>
        <span className={`text-sm ${votePhase === "committed" || votePhase === "revealing"
          ? "text-cyan-400" : "text-gray-500"}`}>
          Verify & Confirm
        </span>
      </div>

    </div>
  );

  /* =============================================================
     COMMIT RECEIPT CARD (shown after Phase 1)
  ============================================================= */
  const CommitReceiptCard = () => (
    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-400 text-lg">🔒</span>
        <h3 className="text-green-400 font-semibold text-sm">
          Phase 1 Complete — Vote Committed to Blockchain
        </h3>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs text-gray-400 mb-1">Commitment Hash</p>
          <p className="text-xs text-white/70 font-mono break-all bg-black/30 rounded p-2">
            {commitData?.commitmentHash}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
          <p className="text-xs text-white/70 font-mono break-all bg-black/30 rounded p-2">
            {commitData?.commitTransactionHash}
          </p>
        </div>
      </div>
      <p className="text-xs text-yellow-400 mt-3">
        ⚠️ Your vote choice is hidden on-chain until you confirm in Phase 2.
      </p>
    </div>
  );

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center fade-page">
      <div className="container-modern flex justify-center">
        <div className="glass-card w-[700px] max-w-[95%]">

          {/* Header */}
          <h1 className="text-3xl font-bold text-center mb-2 tracking-wide">
            {votePhase === "committed" ? "Confirm Your Vote" : "Select Your Candidate"}
          </h1>

          <p className="text-center text-gray-400 mb-6">
            {votePhase === "idle"
              ? "Your vote will be privately committed then verified on the blockchain."
              : votePhase === "committed"
              ? "Your commitment is recorded. Click confirm to cast your final vote."
              : "Processing your vote on the blockchain..."}
          </p>

          {/* Phase Indicator */}
          <PhaseIndicator />

          {/* Commit Receipt (shown after Phase 1) */}
          {votePhase === "committed" && commitData && <CommitReceiptCard />}

          {/* Candidate List — hidden after commit */}
          {votePhase === "idle" && (
            <div className="space-y-5">
              {candidates.length === 0 && (
                <p className="text-center text-gray-500">No approved candidates yet.</p>
              )}
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
                    src={`${API}${candidate.photo}`}
                    alt={candidate.name}
                    className="w-20 h-20 rounded-full object-cover border border-white/20"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80";
                    }}
                  />
                  <div>
                    <h2 className="text-lg font-semibold">{candidate.name}</h2>
                    <p className="text-sm text-gray-400 mt-1">{candidate.department}</p>
                    <p className="text-sm text-gray-500 mt-1">{candidate.manifesto}</p>
                  </div>
                  {selectedCandidate === candidate._id && (
                    <div className="ml-auto text-cyan-400 text-xl">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected candidate summary (shown in Phase 2) */}
          {votePhase === "committed" && (
            <div className="flex items-center gap-4 p-4 rounded-xl border border-cyan-400/30 bg-cyan-400/5 mb-4">
              {(() => {
                const c = candidates.find((c) => c._id === selectedCandidate);
                return c ? (
                  <>
                    <img
                      src={`${API}${c.photo}`}
                      alt={c.name}
                      className="w-14 h-14 rounded-full object-cover border border-white/20"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/56"; }}
                    />
                    <div>
                      <p className="text-sm text-gray-400">You are voting for</p>
                      <p className="text-lg font-bold text-cyan-400">{c.name}</p>
                      <p className="text-sm text-gray-400">{c.department}</p>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          )}

          {/* Phase 1 Button — Commit */}
          {votePhase === "idle" && (
            <button
              onClick={handleCommit}
              disabled={loading || !selectedCandidate || !electionOpen}
              className="modern-btn w-full mt-10 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Oval height={25} width={25} color="#fff" />
              ) : (
                <>🔒 Commit Vote (Phase 1)</>
              )}
            </button>
          )}

          {/* Phase 2 Button — Reveal */}
          {votePhase === "committed" && (
            <div className="space-y-3 mt-6">
              <button
                onClick={handleReveal}
                disabled={loading}
                className="modern-btn w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Oval height={25} width={25} color="#fff" />
                ) : (
                  <>🗳️ Confirm & Cast Vote (Phase 2)</>
                )}
              </button>

              <button
                onClick={() => {
                  setVotePhase("idle");
                  setCommitData(null);
                  setSelectedCandidate(null);
                  toast("Vote commitment cancelled. You can select again.", {
                    icon: "ℹ️",
                  });
                }}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-white/20 text-gray-400
                           hover:bg-white/5 transition text-sm disabled:opacity-50"
              >
                ← Go Back & Change Selection
              </button>
            </div>
          )}

          {/* Election closed warning */}
          {!electionOpen && (
            <p className="text-center text-red-400 mt-6 text-sm">
              ⚠️ Election is currently closed. Voting is not available.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}

export default VotePage;