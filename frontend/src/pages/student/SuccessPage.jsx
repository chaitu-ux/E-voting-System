import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";
import axios from "axios";

const API = "http://localhost:5000";

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [width, height] = useWindowSize();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const {
    transactionHash,
    blockNumber,
    verificationCode,
    commitmentHash,
    commitTransactionHash,
  } = location.state || {};

  /* =============================================================
     COPY HELPER
  ============================================================= */
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`📋 ${label} copied!`);
  };

  /* =============================================================
     E2E VOTE VERIFICATION
     Calls blockchain to confirm vote is correctly recorded
  ============================================================= */
  const handleVerifyVote = async () => {
    if (!verificationCode) {
      return toast.error("No verification code available");
    }

    const toastId = toast.loading("🔍 Verifying your vote on blockchain...");
    setVerifying(true);

    try {
      const token = localStorage.getItem("studentToken");
      const res = await axios.post(
        `${API}/api/voter/verify-my-vote`,
        { verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVerificationResult(res.data.verificationDetails);
      toast.success("✅ Vote verified on blockchain!", { id: toastId });

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Verification failed",
        { id: toastId }
      );
    } finally {
      setVerifying(false);
    }
  };

  /* =============================================================
     INFO CARD COMPONENT
  ============================================================= */
  const InfoCard = ({ label, value, color = "text-cyan-400", onCopy, copyLabel }) => (
    <div className="bg-white/5 p-5 rounded-xl border border-white/10 mb-4 text-left">
      <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">{label}</p>
      <p className={`break-all text-sm font-mono ${color}`}>{value}</p>
      {onCopy && (
        <button
          onClick={() => onCopy(value, copyLabel || label)}
          className="mt-3 text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
        >
          📋 Copy {copyLabel || label}
        </button>
      )}
    </div>
  );

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen flex items-center justify-center fade-page py-10">

      <Confetti
        width={width}
        height={height}
        numberOfPieces={200}
        recycle={false}
      />

      <div className="glass-card w-[720px] max-w-[95%] text-center">

        {/* Header */}
        <div className="text-6xl mb-4 animate-pulse">🎉</div>
        <h1 className="text-3xl font-bold mb-2 tracking-wide">
          Vote Successfully Cast!
        </h1>
        <p className="text-gray-400 mb-8">
          Your vote is securely recorded on the blockchain using
          ZKP-inspired commit-reveal verification.
        </p>

        {/* ZKP Phase Summary */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30
                          rounded-full px-4 py-2">
            <span className="text-green-400 text-sm">🔒 Phase 1</span>
            <span className="text-green-400 text-xs font-semibold">Committed</span>
          </div>
          <div className="h-px w-8 bg-green-400" />
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30
                          rounded-full px-4 py-2">
            <span className="text-cyan-400 text-sm">✅ Phase 2</span>
            <span className="text-cyan-400 text-xs font-semibold">Verified</span>
          </div>
        </div>

        {/* ── VOTE TRANSACTION (Phase 2) ── */}
        <h3 className="text-left text-xs text-gray-500 uppercase tracking-widest mb-3">
          Vote Transaction (Phase 2 — Reveal)
        </h3>

        <InfoCard
          label="Transaction Hash"
          value={transactionHash || "N/A"}
          color="text-cyan-400"
          onCopy={handleCopy}
          copyLabel="Transaction Hash"
        />

        <div className="bg-white/5 p-5 rounded-xl border border-white/10 mb-4 text-left">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Block Number</p>
          <p className="text-2xl font-bold text-purple-400">{blockNumber || "N/A"}</p>
        </div>

        {/* ── COMMIT TRANSACTION (Phase 1) ── */}
        {commitTransactionHash && (
          <>
            <h3 className="text-left text-xs text-gray-500 uppercase tracking-widest mb-3 mt-6">
              Commitment Transaction (Phase 1 — ZKP Commit)
            </h3>
            <InfoCard
              label="Commitment Transaction Hash"
              value={commitTransactionHash}
              color="text-yellow-400"
              onCopy={handleCopy}
              copyLabel="Commit Hash"
            />
            {commitmentHash && (
              <InfoCard
                label="Commitment Hash (ZKP Proof)"
                value={commitmentHash}
                color="text-orange-400"
                onCopy={handleCopy}
                copyLabel="Commitment Hash"
              />
            )}
          </>
        )}

        {/* ── E2E VERIFICATION CODE ── */}
        {verificationCode && (
          <>
            <h3 className="text-left text-xs text-gray-500 uppercase tracking-widest mb-3 mt-6">
              E2E Verification Code
            </h3>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 mb-4 text-left">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">
                Your Unique Vote Receipt
              </p>
              <p className="break-all text-sm font-mono text-purple-400">
                {verificationCode}
              </p>
              <button
                onClick={() => handleCopy(verificationCode, "Verification Code")}
                className="mt-3 text-xs text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                📋 Copy Verification Code
              </button>
              <p className="text-xs text-gray-500 mt-3">
                💡 Save this code. Use it anytime to independently verify
                your vote is correctly recorded on the blockchain.
              </p>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyVote}
              disabled={verifying}
              className="w-full py-3 rounded-xl border border-purple-400/50 text-purple-400
                         hover:bg-purple-400/10 transition text-sm font-semibold mb-4
                         disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>⏳ Verifying on blockchain...</>
              ) : (
                <>🔍 Verify My Vote on Blockchain</>
              )}
            </button>
          </>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-400 text-lg">✅</span>
              <h3 className="text-green-400 font-semibold">
                Vote Verified on Blockchain!
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Status</span>
                <span className="text-xs text-green-400 font-semibold">
                  {verificationResult.isValid ? "Valid ✓" : "Invalid ✗"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Block Number</span>
                <span className="text-xs text-white">{verificationResult.blockNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Candidate</span>
                <span className="text-xs text-cyan-400">{verificationResult.candidateName}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              🔒 {verificationResult.note}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            localStorage.removeItem("studentToken");
            localStorage.removeItem("hasVoted");
            navigate("/");
          }}
          className="modern-btn w-full mt-4"
        >
          Done — Return to Home
        </button>

      </div>
    </div>
  );
}

export default SuccessPage;