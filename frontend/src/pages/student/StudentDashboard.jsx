import React, { useEffect, useState } from "react";
import api from "../../api";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("studentToken");

  const [electionOpen, setElectionOpen] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [studentInfo, setStudentInfo] = useState(null);
  const [voterStatus, setVoterStatus] = useState(null);
  const [verifyingVote, setVerifyingVote] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // ✅ Verification code state — fetched from backend, not localStorage
  const [savedVerificationCode, setSavedVerificationCode] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/student");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([
      fetchElectionStatus(),
      fetchApplicationStatus(),
      fetchVoterStatus(),
      fetchStudentInfo(),
      fetchVerificationCode(), // ✅ fetch from backend
    ]);
    setLoading(false);
  };

  /* =============================================================
     FETCH ELECTION STATUS
  ============================================================= */
  const fetchElectionStatus = async () => {
    try {
      const res = await api.get("/election-status");
      setElectionOpen(res.data.isOpen);
    } catch {
      toast.error("Failed to fetch election status");
    }
  };

  /* =============================================================
     FETCH APPLICATION STATUS
  ============================================================= */
  const fetchApplicationStatus = async () => {
    try {
      const res = await api.get("/candidates/my-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplicationStatus(res.data.status);
    } catch {
      setApplicationStatus(null);
    }
  };

  /* =============================================================
     FETCH VOTER STATUS (DID + blockchain)
  ============================================================= */
  const fetchVoterStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/voter/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoterStatus(res.data.status);
    } catch {
      setVoterStatus(null);
    }
  };

  /* =============================================================
     FETCH STUDENT INFO from JWT
  ============================================================= */
  const fetchStudentInfo = async () => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setStudentInfo(payload);
    } catch {
      setStudentInfo(null);
    }
  };

  /* =============================================================
     ✅ FIX 1: FETCH VERIFICATION CODE — backend only, NO localStorage
     Removed localStorage fallback to prevent cross-user leakage.
     Each student's JWT ensures this always returns their own code.
  ============================================================= */
  const fetchVerificationCode = async () => {
    try {
      const res = await axios.get(`${API}/api/voter/my-verification-code`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.verificationCode) {
        setSavedVerificationCode(res.data.verificationCode);
      } else {
        setSavedVerificationCode(null);
      }
    } catch {
      setSavedVerificationCode(null);
    }
  };

  /* =============================================================
     E2E VOTE VERIFICATION
     Priority: backend-fetched code → manual input code
  ============================================================= */
  const handleVerifyVote = async () => {
    const codeToUse = savedVerificationCode || manualCode.trim();

    if (!codeToUse) {
      toast.error("Please enter your verification code.");
      return;
    }

    setVerifyingVote(true);
    setVerificationResult(null);
    const toastId = toast.loading("🔍 Verifying your vote on blockchain...");

    try {
      const res = await axios.post(
        `${API}/api/voter/verify-my-vote`,
        { verificationCode: codeToUse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save manually entered code — only if no backend code exists
      if (!savedVerificationCode && codeToUse) {
        setSavedVerificationCode(codeToUse);
      }

      setVerificationResult(res.data.verificationDetails);
      setShowManualInput(false);
      toast.success("✅ Vote verified!", { id: toastId });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Verification failed",
        { id: toastId }
      );
    } finally {
      setVerifyingVote(false);
    }
  };

  /* =============================================================
     ✅ FIX 2: LOGOUT — clears voteVerificationCode from localStorage
     Prevents stale code from leaking to the next user on same browser
  ============================================================= */
  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("hasVoted");
    localStorage.removeItem("voteVerificationCode"); // ✅ prevent cross-user leak
    navigate("/student");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <p className="text-gray-400 text-lg animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  /* =============================================================
     STATUS BADGE HELPER
  ============================================================= */
  const StatusBadge = ({ value, trueLabel, falseLabel, trueColor, falseColor }) => (
    <span className={`text-xs px-3 py-1 rounded-full border font-semibold
      ${value
        ? `${trueColor || "text-green-400"} border-green-400/30 bg-green-400/10`
        : `${falseColor || "text-red-400"} border-red-400/30 bg-red-400/10`
      }`}>
      {value ? trueLabel : falseLabel}
    </span>
  );

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">
              Student Dashboard 🎓
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Blockchain-secured university election portal
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20
                       border border-white/10 transition text-sm"
          >
            Logout
          </button>
        </div>

        {/* ── STATUS CARDS ROW 1 ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">

          {/* Election Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              Election Status
            </h3>
            <p className={`text-2xl font-bold ${electionOpen ? "text-green-400" : "text-red-400"}`}>
              {electionOpen ? "🟢 Open" : "🔴 Closed"}
            </p>
          </div>

          {/* Candidate Application */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              Candidate Application
            </h3>
            <p className="text-2xl font-bold text-purple-400">
              {applicationStatus
                ? applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)
                : "Not Applied"}
            </p>
          </div>

          {/* Vote Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              Vote Status
            </h3>
            <p className={`text-2xl font-bold ${
              voterStatus?.hasVoted
                ? "text-green-400"
                : electionOpen
                ? "text-cyan-400"
                : "text-gray-500"
            }`}>
              {voterStatus?.hasVoted
                ? "✅ Voted"
                : electionOpen
                ? "🗳️ Available"
                : "⏸️ Unavailable"}
            </p>
          </div>

        </div>

        {/* ── MFA + DID STATUS CARDS ROW 2 ── */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">

          {/* DID Identity */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              DID Identity
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge
                value={voterStatus?.isRegistered}
                trueLabel="Registered on Blockchain"
                falseLabel="Not Registered"
              />
            </div>
            {voterStatus?.didHash && (
              <p className="text-xs text-gray-500 font-mono mt-3 break-all">
                {voterStatus.didHash.slice(0, 20)}...
              </p>
            )}
          </div>

          {/* Voter Eligibility */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              Voter Eligibility
            </h3>
            <StatusBadge
              value={voterStatus?.isEligible}
              trueLabel="Eligible to Vote"
              falseLabel="Not Eligible"
            />
            {voterStatus?.isBlacklisted && (
              <p className="text-xs text-red-400 mt-2">
                ⛔ Account blacklisted
              </p>
            )}
          </div>

          {/* MFA Status */}
          <div className="stat-card">
            <h3 className="text-gray-400 uppercase text-xs tracking-wider mb-3">
              MFA Authentication
            </h3>
            <StatusBadge
              value={studentInfo?.mfaComplete}
              trueLabel="3-Factor Verified"
              falseLabel="Incomplete"
              trueColor="text-cyan-400"
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                🔑 Password
              </span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                📧 OTP
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                voterStatus?.isRegistered
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "bg-white/10 text-gray-500"
              }`}>
                🔗 DID
              </span>
            </div>
          </div>

        </div>

        {/* ── FRAUD / RISK STATUS (shown only if risk > 0) ── */}
        {voterStatus?.fraudScore > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <h3 className="text-red-400 font-semibold text-sm">
                Security Alert
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              Your account has a fraud score of{" "}
              <span className="text-red-400 font-bold">
                {voterStatus.fraudScore}
              </span>
              . Suspicious activity has been detected. Contact admin if this
              is a mistake.
            </p>
          </div>
        )}

        {/* ── E2E VOTE VERIFICATION ── */}
        {voterStatus?.hasVoted && (
          <div className="glass-card mb-8">
            <h3 className="text-sm font-semibold text-purple-400 mb-1">
              🔍 End-to-End Vote Verification
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Independently verify your vote is correctly recorded on the
              blockchain using your verification code.
            </p>

            {/* ── Code status ── */}
            {savedVerificationCode && !showManualInput ? (
              <>
                <p className="text-xs text-green-400/80 mb-1">
                  ✅ Verification code found — click below to verify instantly.
                </p>
                <p
                  className="text-xs text-gray-500 underline cursor-pointer mb-4"
                  onClick={() => setShowManualInput(true)}
                >
                  Use a different code instead
                </p>
              </>
            ) : (
              <>
                {!savedVerificationCode && (
                  <p className="text-xs text-yellow-400/80 mb-3">
                    ⚠️ No saved code found. Paste your verification code from your vote receipt below.
                  </p>
                )}

                {/* Manual input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Paste verification code (0x...)"
                    className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2.5
                               text-sm text-white placeholder-gray-600 font-mono
                               focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {savedVerificationCode && showManualInput && (
                  <p
                    className="text-xs text-gray-500 underline cursor-pointer mb-4"
                    onClick={() => { setShowManualInput(false); setManualCode(""); }}
                  >
                    ← Use saved code instead
                  </p>
                )}
              </>
            )}

            <button
              onClick={handleVerifyVote}
              disabled={verifyingVote || (!savedVerificationCode && !manualCode.trim())}
              className="w-full py-3 rounded-xl border border-purple-400/50
                         text-purple-400 hover:bg-purple-400/10 transition
                         text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {verifyingVote
                ? "⏳ Verifying..."
                : "🔍 Verify My Vote on Blockchain"}
            </button>

            {/* Verification Result */}
            {verificationResult && (
              <div className="mt-4 bg-green-500/10 border border-green-500/30
                              rounded-xl p-4">
                <p className="text-green-400 font-semibold text-sm mb-3">
                  ✅ Vote Verified!
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Status</span>
                    <span className="text-xs text-green-400 font-bold">
                      Valid ✓
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Candidate</span>
                    <span className="text-xs text-cyan-400">
                      {verificationResult.candidateName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Block Number</span>
                    {/* ✅ FIX 3: Show N/A for old DB-fallback votes with blockNumber 0 */}
                    <span className="text-xs text-white">
                      {verificationResult.blockNumber > 0
                        ? verificationResult.blockNumber
                        : "N/A (DB fallback vote)"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  🔒 {verificationResult.note}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Apply as Candidate */}
          {!applicationStatus && (
            <button
              onClick={() => navigate("/student/apply")}
              className="modern-btn"
            >
              Apply as Candidate 🎤
            </button>
          )}

          {/* Vote Now */}
          {electionOpen && !voterStatus?.hasVoted && voterStatus?.isEligible && (
            <button
              onClick={() => navigate("/student/vote")}
              className="modern-btn"
            >
              Vote Now 🗳️
            </button>
          )}

          {/* View Results */}
          <button
            onClick={() => navigate("/student/results")}
            className="px-6 py-3 rounded-xl border border-white/20
                       hover:bg-white/5 transition text-sm"
          >
            View Results 📊
          </button>

        </div>

        {/* Already voted message */}
        {voterStatus?.hasVoted && (
          <p className="text-center text-green-400 text-sm mt-6">
            ✅ You have already cast your vote in this election.
          </p>
        )}

        {/* Not eligible message */}
        {!voterStatus?.isEligible && !voterStatus?.hasVoted && (
          <p className="text-center text-yellow-400 text-sm mt-6">
            ⏳ Your voter eligibility is pending admin approval.
          </p>
        )}

      </div>
    </div>
  );
}

export default StudentDashboard;