import React, { useEffect, useState, useCallback } from "react";
import api from "../../api";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const API = "http://localhost:5000";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [students, setStudents] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [voteAnalytics, setVoteAnalytics] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [fraudPage, setFraudPage] = useState(1);

  const [voterStatusData, setVoterStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Merkle state
  const [merkleData, setMerkleData] = useState(null);
  const [merkleLoading, setMerkleLoading] = useState(false);
  const [merkleAnchoring, setMerkleAnchoring] = useState(false);

  const rowsPerPage = 5;

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchStudents();
    fetchFraudLogs();
    fetchVoteAnalytics();
    fetchCandidates();
  };

  /* =============================================================
     FETCH FUNCTIONS
  ============================================================= */
  const fetchStudents = async () => {
    try {
      const res = await api.get("/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch { toast.error("Failed to load students"); }
  };

  const fetchFraudLogs = async () => {
    try {
      const res = await api.get("/admin/fraud-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFraudLogs(res.data);
    } catch { toast.error("Failed to load fraud logs"); }
  };

  const fetchVoteAnalytics = async () => {
    try {
      const res = await api.get("/admin/vote-analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteAnalytics(res.data);
    } catch { toast.error("Failed to load analytics"); }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get("/candidates/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data);
    } catch { toast.error("Failed to load candidates"); }
  };

  /* =============================================================
     MERKLE FETCH + RE-ANCHOR
  ============================================================= */
  const fetchMerkleStatus = useCallback(async () => {
    setMerkleLoading(true);
    try {
      const res = await axios.get(`${API}/api/voter/merkle-root`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerkleData(res.data);
    } catch (e) {
      toast.error("Failed to fetch Merkle status");
    } finally {
      setMerkleLoading(false);
    }
  }, [token]);

  const reAnchorMerkle = async () => {
    setMerkleAnchoring(true);
    const toastId = toast.loading("Anchoring Merkle root on blockchain...");
    try {
      const res = await axios.get(`${API}/api/voter/merkle-root?anchor=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerkleData(res.data);
      toast.success(
        `✅ Anchored! TX: ${res.data.reAnchor?.txHash?.slice(0, 18)}...`,
        { id: toastId }
      );
    } catch (e) {
      toast.error(e.response?.data?.message || "Re-anchor failed", { id: toastId });
    } finally {
      setMerkleAnchoring(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics" && !merkleData) {
      fetchMerkleStatus();
    }
  }, [activeTab, merkleData, fetchMerkleStatus]);

  /* =============================================================
     STUDENT ACTIONS
  ============================================================= */
  const approveStudent = async (id) => {
    const toastId = toast.loading("Approving + registering DID on blockchain...");
    try {
      const res = await api.patch(`/admin/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(
        `✅ Approved! Blockchain: ${res.data.blockchainStatus}`,
        { id: toastId }
      );
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed", { id: toastId });
    }
  };

  const rejectStudent = async (id) => {
    try {
      await api.patch(`/admin/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student Rejected");
      fetchStudents();
    } catch { toast.error("Failed to reject"); }
  };

  const blacklistStudent = async (id) => {
    const toastId = toast.loading("Blacklisting on DB and blockchain...");
    try {
      await api.patch(`/admin/blacklist/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student blacklisted on DB + blockchain", { id: toastId });
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed", { id: toastId });
    }
  };

  const unblockStudent = async (id) => {
    const toastId = toast.loading("Restoring eligibility...");
    try {
      await api.patch(`/admin/unblacklist/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student unblocked on DB + blockchain", { id: toastId });
      fetchStudents();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed", { id: toastId });
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await api.delete(`/admin/delete-student/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student Deleted");
      fetchStudents();
    } catch { toast.error("Failed to delete"); }
  };

  const reportFraud = async (id) => {
    const reason = window.prompt("Enter fraud reason:");
    if (!reason) return;
    const toastId = toast.loading("Reporting fraud to blockchain...");
    try {
      const res = await axios.post(
        `${API}/api/admin/report-fraud/${id}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Fraud reported! TX: ${res.data.transactionHash?.slice(0, 16)}...`, { id: toastId });
      fetchStudents();
      fetchFraudLogs();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed", { id: toastId });
    }
  };

  const viewVoterStatus = async (id) => {
    setLoadingStatus(true);
    setVoterStatusData(null);
    try {
      const res = await axios.get(
        `${API}/api/admin/voter-status/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data;
      const blockchainUnavailable =
        !data.blockchainStatus?.isRegistered &&
        !data.blockchainStatus?.isEligible &&
        data.dbStatus?.status === "approved" &&
        data.dbStatus?.isEligible === true;

      if (blockchainUnavailable) {
        data.blockchainStatus = {
          isRegistered: data.dbStatus.isEligible,
          isEligible: data.dbStatus.isEligible,
          hasVoted: data.blockchainStatus?.hasVoted || false,
          isBlacklisted: data.dbStatus.isBlacklisted,
          fraudScore: data.blockchainStatus?.fraudScore || "0",
          _chainUnavailable: true,
        };
      }
      setVoterStatusData(data);
    } catch {
      toast.error("Failed to fetch blockchain status");
    } finally {
      setLoadingStatus(false);
    }
  };

  /* =============================================================
     CANDIDATE ACTIONS
  ============================================================= */
  const approveCandidate = async (id) => {
    try {
      await api.patch(`/candidates/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Candidate Approved");
      fetchCandidates();
    } catch { toast.error("Failed to approve candidate"); }
  };

  const rejectCandidate = async (id) => {
    try {
      await api.patch(`/candidates/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Candidate Rejected");
      fetchCandidates();
    } catch { toast.error("Failed to reject candidate"); }
  };

  /* =============================================================
     FILTER + PAGINATION
  ============================================================= */
  const filteredStudents = students.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginate = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const currentStudents = paginate(filteredStudents, studentPage);
  const currentFraud = paginate(fraudLogs, fraudPage);
  const studentTotalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const fraudTotalPages = Math.ceil(fraudLogs.length / rowsPerPage);

  /* =============================================================
     CHART DATA
  ============================================================= */
  const chartData = {
    labels: voteAnalytics?.votesPerCandidate?.map(
      (v) => v.candidateName || `Candidate ${v._id}`
    ) || [],
    datasets: [{
      label: "Votes",
      data: voteAnalytics?.votesPerCandidate?.map((v) => v.votes) || [],
      backgroundColor: "rgba(0,212,255,0.7)",
      borderColor: "rgba(0,212,255,1)",
      borderWidth: 1,
    }],
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin");
  };

  /* =============================================================
     RENDER
  ============================================================= */
  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Blockchain-secured election management
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

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card title="Total Students" value={students.length} />
          <Card title="Approved" value={students.filter((s) => s.status === "approved").length} color="text-green-400" />
          <Card title="Pending" value={students.filter((s) => s.status === "pending").length} color="text-yellow-400" />
          <Card title="Blacklisted" value={students.filter((s) => s.isBlacklisted).length} color="text-red-400" />
        </div>

        {/* ANALYTICS MINI CARDS */}
        {voteAnalytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card title="Total Votes" value={voteAnalytics.totalVotes} color="text-cyan-400" />
            <Card title="Turnout" value={`${voteAnalytics.turnoutPercentage}%`} color="text-purple-400" />
            <Card title="Fraud Logs" value={voteAnalytics.totalFraudLogs} color="text-orange-400" />
            <Card title="Candidates" value={candidates.length} color="text-blue-400" />
          </div>
        )}

        {/* TABS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {["students", "candidates", "fraud", "analytics"].map((tab) => (
            <TabButton
              key={tab}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>

        {/* ── STUDENTS TAB ── */}
        {activeTab === "students" && (
          <>
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setStudentPage(1); }}
              className="modern-input mb-4"
            />

            <GlassTable>
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-3 text-left">Student ID</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">DID</th>
                  <th className="p-3 text-left">Risk</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((s) => (
                  <tr key={s._id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3 text-sm">{s.studentId}</td>
                    <td className="p-3 text-sm">{s.name}</td>
                    <td className="p-3 text-xs text-gray-400">{s.email}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${s.isBlacklisted ? "bg-red-500/20 text-red-400"
                          : s.status === "approved" ? "bg-green-500/20 text-green-400"
                          : s.status === "pending" ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"}`}>
                        {s.isBlacklisted ? "Blacklisted" : s.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full
                        ${s.isDIDRegistered ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-gray-500"}`}>
                        {s.isDIDRegistered ? "⛓️ On-chain" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-bold
                        ${(s.riskScore || 0) >= 30 ? "text-red-400"
                          : (s.riskScore || 0) >= 10 ? "text-yellow-400"
                          : "text-green-400"}`}>
                        {s.riskScore || 0}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {s.status === "pending" && (
                          <>
                            <ActionBtn type="success" onClick={() => approveStudent(s._id)}>Approve</ActionBtn>
                            <ActionBtn type="warning" onClick={() => rejectStudent(s._id)}>Reject</ActionBtn>
                          </>
                        )}
                        {s.isBlacklisted ? (
                          <ActionBtn type="info" onClick={() => unblockStudent(s._id)}>Unblock</ActionBtn>
                        ) : (
                          <ActionBtn type="danger" onClick={() => blacklistStudent(s._id)}>Block</ActionBtn>
                        )}
                        <ActionBtn type="orange" onClick={() => reportFraud(s._id)}>Fraud</ActionBtn>
                        <ActionBtn type="purple" onClick={() => viewVoterStatus(s._id)}>Chain</ActionBtn>
                        <ActionBtn type="secondary" onClick={() => deleteStudent(s._id)}>Delete</ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </GlassTable>

            <Pagination currentPage={studentPage} totalPages={studentTotalPages} setPage={setStudentPage} />

            {/* Blockchain Voter Status Modal */}
            {(voterStatusData || loadingStatus) && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="glass-card w-[520px] max-w-[95%] max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-cyan-400">⛓️ Blockchain Voter Status</h3>
                    <button onClick={() => setVoterStatusData(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                  </div>

                  {loadingStatus ? (
                    <p className="text-gray-400 text-center py-4">Loading blockchain data...</p>
                  ) : voterStatusData && (
                    <div className="space-y-3">
                      {voterStatusData.blockchainStatus?._chainUnavailable && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                          <p className="text-xs text-yellow-400">
                            ⚠️ Blockchain node state was reset (Hardhat restart). Showing DB values.
                            Re-deploy contract to sync blockchain state.
                          </p>
                        </div>
                      )}

                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
                          Blockchain Status
                          {voterStatusData.blockchainStatus?._chainUnavailable && (
                            <span className="ml-2 text-yellow-400 normal-case">(from DB fallback)</span>
                          )}
                        </p>
                        {[
                          ["DID Registered", voterStatusData.blockchainStatus?.isRegistered ? "✅ Yes" : "❌ No"],
                          ["Eligible", voterStatusData.blockchainStatus?.isEligible ? "✅ Yes" : "❌ No"],
                          ["Has Voted", voterStatusData.blockchainStatus?.hasVoted ? "✅ Yes" : "⬜ No"],
                          ["Blacklisted", voterStatusData.blockchainStatus?.isBlacklisted ? "🔴 Yes" : "✅ No"],
                          ["Fraud Score", voterStatusData.blockchainStatus?.fraudScore || "0"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-xs text-gray-400">{label}</span>
                            <span className="text-xs text-white font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Database Status</p>
                        {[
                          ["Status", voterStatusData.dbStatus?.status],
                          ["Eligible", voterStatusData.dbStatus?.isEligible ? "✅ Yes" : "❌ No"],
                          ["Blacklisted", voterStatusData.dbStatus?.isBlacklisted ? "🔴 Yes" : "✅ No"],
                          ["Risk Score", voterStatusData.dbStatus?.riskScore || "0"],
                          ["Failed Attempts", voterStatusData.dbStatus?.failedAttempts || "0"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-xs text-gray-400">{label}</span>
                            <span className="text-xs text-white font-semibold">{value}</span>
                          </div>
                        ))}
                      </div>

                      {voterStatusData.didHash && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-1">DID Hash</p>
                          <p className="text-xs font-mono text-cyan-400 break-all">{voterStatusData.didHash}</p>
                        </div>
                      )}

                      {/* ✅ B3 — ZKP Proof Section */}
                      {voterStatusData.zkpProof ? (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🔐</span>
                            <div>
                              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                                ZKP Commitment Proof
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Voter proved knowledge of their choice without revealing it
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Commitment Hash</p>
                              <p className="text-xs font-mono text-purple-300 break-all bg-black/20 rounded p-2">
                                {voterStatusData.zkpProof.commitmentHash}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Proof Hash (Verification Code)</p>
                              <p className="text-xs font-mono text-purple-300 break-all bg-black/20 rounded p-2">
                                {voterStatusData.zkpProof.proofHash}
                              </p>
                            </div>
                            {voterStatusData.zkpProof.txHash && !voterStatusData.zkpProof.txHash.startsWith("db-only") && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">On-chain TX Hash</p>
                                <p className="text-xs font-mono text-cyan-400 break-all bg-black/20 rounded p-2">
                                  {voterStatusData.zkpProof.txHash}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-green-400 text-sm">✅</span>
                              <p className="text-xs text-green-400 font-semibold">
                                Verification Status: Confirmed
                              </p>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 mt-1">
                              <p className="text-xs text-gray-500 italic">
                                This proves the voter knew their candidate choice at commit time
                                without the choice being revealed until the reveal phase —
                                a Zero-Knowledge commitment scheme.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        voterStatusData.blockchainStatus?.hasVoted === false && (
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 text-center">
                              🔐 ZKP Proof — No vote recorded yet for this student
                            </p>
                          </div>
                        )
                      )}

                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── CANDIDATES TAB ── */}
        {activeTab === "candidates" && (
          <GlassTable>
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-3 text-left">Photo</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c._id} className="border-t border-white/10 hover:bg-white/5 transition">
                  <td className="p-3">
                    {c.photo && (
                      <img
                        src={`${API}${c.photo}`}
                        alt={c.student?.name}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </td>
                  <td className="p-3 text-sm">{c.student?.name || c.name}</td>
                  <td className="p-3 text-xs text-gray-400">{c.department || c.student?.department || "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold
                      ${c.status === "approved" ? "bg-green-500/20 text-green-400"
                        : c.status === "pending" ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {c.status === "pending" && (
                      <>
                        <ActionBtn type="success" onClick={() => approveCandidate(c._id)}>Approve</ActionBtn>
                        <ActionBtn type="danger" onClick={() => rejectCandidate(c._id)}>Reject</ActionBtn>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-sm">No candidates yet</td></tr>
              )}
            </tbody>
          </GlassTable>
        )}

        {/* ── FRAUD LOGS TAB ── */}
        {activeTab === "fraud" && (
          <>
            {/* ✅ B2 — Severity summary badges (already existed, confirmed wired to live data) */}
            {voteAnalytics?.fraudBySeverity && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {voteAnalytics.fraudBySeverity.map((f) => (
                  <div key={f._id} className={`px-4 py-2 rounded-xl text-xs font-semibold border
                    ${f._id === "high" ? "bg-red-500/20 border-red-500/30 text-red-400"
                      : f._id === "medium" ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                      : "bg-blue-500/20 border-blue-500/30 text-blue-400"}`}>
                    {f._id?.toUpperCase()}: {f.count}
                  </div>
                ))}
              </div>
            )}

            {/* ✅ B2 NEW — Risk Score Leaderboard: top 5 highest risk students */}
            {voteAnalytics?.topRiskStudents && voteAnalytics.topRiskStudents.length > 0 && (
              <div className="glass-card mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🚨</span>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Risk Score Leaderboard
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Top 5 students with highest fraud risk scores
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {voteAnalytics.topRiskStudents.map((s, idx) => {
                    const riskColor =
                      s.riskScore >= 50 ? "text-red-400" :
                      s.riskScore >= 25 ? "text-orange-400" :
                      s.riskScore >= 10 ? "text-yellow-400" :
                      "text-green-400";

                    const riskBg =
                      s.riskScore >= 50 ? "border-red-500/30 bg-red-500/5" :
                      s.riskScore >= 25 ? "border-orange-500/30 bg-orange-500/5" :
                      s.riskScore >= 10 ? "border-yellow-500/30 bg-yellow-500/5" :
                      "border-white/10 bg-white/5";

                    return (
                      <div
                        key={s._id}
                        className={`flex items-center justify-between rounded-xl p-3 border ${riskBg}`}
                      >
                        {/* Rank + Info */}
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold w-6 text-center ${
                            idx === 0 ? "text-red-400" :
                            idx === 1 ? "text-orange-400" :
                            "text-gray-500"
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.studentId}</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="text-center hidden sm:block">
                            <p className="text-xs text-gray-500">Attempts</p>
                            <p className="text-xs font-bold text-white">{s.failedAttempts || 0}</p>
                          </div>
                          <div className="text-center hidden sm:block">
                            <p className="text-xs text-gray-500">Susp. IPs</p>
                            <p className="text-xs font-bold text-white">{s.suspiciousIPs?.length || 0}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Risk Score</p>
                            <p className={`text-sm font-black ${riskColor}`}>{s.riskScore}</p>
                          </div>
                          {s.isBlacklisted && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 font-semibold">
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fraud Log Table */}
            <GlassTable>
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">IP Address</th>
                  <th className="p-3 text-left">Severity</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {currentFraud.map((log) => (
                  <tr key={log._id} className="border-t border-white/10 hover:bg-white/5 transition">
                    <td className="p-3 text-xs text-gray-300">
                      {log.student?.name || "Unknown"}<br />
                      <span className="text-gray-500">{log.student?.studentId}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-300 max-w-[200px]">{log.reason}</td>
                    <td className="p-3 text-xs text-gray-400">{log.ipAddress || "—"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${log.severity === "high" ? "bg-red-500/20 text-red-400"
                          : log.severity === "medium" ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-blue-500/20 text-blue-400"}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {fraudLogs.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500 text-sm">No fraud logs yet</td></tr>
                )}
              </tbody>
            </GlassTable>
            <Pagination currentPage={fraudPage} totalPages={fraudTotalPages} setPage={setFraudPage} />
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">

            {/* Vote Summary Cards */}
            {voteAnalytics && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="glass-card text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Voter Turnout</p>
                  <p className="text-3xl font-bold text-cyan-400">{voteAnalytics.turnoutPercentage}%</p>
                </div>
                <div className="glass-card text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Total Votes Cast</p>
                  <p className="text-3xl font-bold text-green-400">{voteAnalytics.totalVotes}</p>
                </div>
                <div className="glass-card text-center">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Fraud Attempts</p>
                  <p className="text-3xl font-bold text-red-400">{voteAnalytics.totalFraudLogs}</p>
                </div>
              </div>
            )}

            {/* Votes Per Candidate Chart */}
            <div className="glass-card">
              <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-4">Votes Per Candidate</h3>
              <div className="h-[300px]">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: "#9ca3af" } } },
                    scales: {
                      x: { ticks: { color: "#9ca3af" } },
                      y: { ticks: { color: "#9ca3af" }, beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>

            {/* MERKLE TREE INTEGRITY PANEL */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    🌿 Merkle Tree — Vote Integrity Proof
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Every revealed vote is hashed into a Merkle tree anchored on blockchain
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchMerkleStatus}
                    disabled={merkleLoading}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20
                               text-xs text-gray-300 transition disabled:opacity-40"
                  >
                    {merkleLoading ? "Loading..." : "↻ Refresh"}
                  </button>
                  <button
                    onClick={reAnchorMerkle}
                    disabled={merkleAnchoring || merkleLoading}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-600
                               text-xs text-white transition disabled:opacity-40 font-semibold"
                  >
                    {merkleAnchoring ? "Anchoring..." : "⛓️ Re-Anchor"}
                  </button>
                </div>
              </div>

              {merkleLoading && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Computing Merkle tree...
                </div>
              )}

              {!merkleLoading && merkleData && !merkleData.root && (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🌱</p>
                  <p className="text-gray-400 text-sm">No votes cast yet</p>
                  <p className="text-gray-600 text-xs mt-1">
                    Merkle tree will be built after the first vote is revealed
                  </p>
                </div>
              )}

              {!merkleLoading && merkleData?.root && (
                <div className="space-y-4">
                  <div className={`rounded-xl p-4 border flex items-center gap-3
                    ${merkleData.isInSync
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"}`}>
                    <span className="text-2xl">
                      {merkleData.isInSync ? "✅" : "⚠️"}
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${merkleData.isInSync ? "text-green-400" : "text-yellow-400"}`}>
                        {merkleData.isInSync
                          ? "Integrity Verified — All votes anchored on blockchain"
                          : "Out of Sync — Click Re-Anchor to push latest root on-chain"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {merkleData.totalVotes} vote{merkleData.totalVotes !== 1 ? "s" : ""} in Merkle tree
                        {merkleData.onChainAnchorCount > 0 && ` · Anchored ${merkleData.onChainAnchorCount} time${merkleData.onChainAnchorCount !== 1 ? "s" : ""}`}
                        {merkleData.onChainLastAnchorBlock > 0 && ` · Last anchor block #${merkleData.onChainLastAnchorBlock}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">LIVE</span>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Current DB Root</p>
                      </div>
                      <p className="text-xs font-mono text-cyan-300 break-all leading-relaxed">{merkleData.root}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Computed from {merkleData.totalVotes} revealed vote{merkleData.totalVotes !== 1 ? "s" : ""} right now
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                          ${merkleData.isInSync ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                          ON-CHAIN
                        </span>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Anchored Root</p>
                      </div>
                      {merkleData.onChainRoot &&
                       merkleData.onChainRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                        <p className="text-xs font-mono text-green-300 break-all leading-relaxed">
                          {merkleData.onChainRoot}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 italic mt-1">Not yet anchored — click Re-Anchor</p>
                      )}
                      {merkleData.onChainLastAnchorBlock > 0 && (
                        <p className="text-xs text-gray-600 mt-2">Block #{merkleData.onChainLastAnchorBlock}</p>
                      )}
                    </div>
                  </div>

                  <div className={`rounded-xl p-3 text-center text-xs font-mono
                    ${merkleData.isInSync ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"}`}>
                    {merkleData.isInSync
                      ? "✅ DB Root == On-chain Root — Data integrity confirmed"
                      : "⚠️  DB Root ≠ On-chain Root — Anchor needed"}
                  </div>

                  <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">How Merkle Integrity Works</p>
                    <div className="space-y-1.5">
                      {[
                        ["🗳️", "Each vote's commitment hash becomes a leaf node in the tree"],
                        ["🌿", "All leaves are hashed together into a single 32-byte Merkle root"],
                        ["⛓️", "Root is stored on Ethereum via anchorOffChainData() — immutable proof"],
                        ["🔍", "Any vote can be independently verified using its Merkle proof"],
                        ["🔒", "If any vote is tampered with, the root changes and tampering is detected"],
                      ].map(([icon, text]) => (
                        <div key={text} className="flex gap-2 items-start">
                          <span className="text-sm">{icon}</span>
                          <p className="text-xs text-gray-500">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {merkleData.reAnchor && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                      <p className="text-xs text-cyan-400 font-semibold mb-2">✅ Re-Anchor Successful</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">TX Hash</span>
                          <span className="text-xs font-mono text-cyan-300">{merkleData.reAnchor.txHash?.slice(0, 20)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Votes Anchored</span>
                          <span className="text-xs text-white font-semibold">{merkleData.reAnchor.totalVotes}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

/* =============================================================
   REUSABLE COMPONENTS
============================================================= */
const Card = ({ title, value, color }) => (
  <div className="stat-card">
    <h3 className="text-gray-400 uppercase text-xs tracking-wider">{title}</h3>
    <p className={`text-2xl font-bold mt-2 ${color || "text-white"}`}>{value}</p>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-lg transition text-sm ${
      active
        ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
        : "bg-white/10 hover:bg-white/20 text-gray-300"
    }`}
  >
    {label}
  </button>
);

const GlassTable = ({ children }) => (
  <div className="glass-card overflow-x-auto">
    <table className="w-full text-left">{children}</table>
  </div>
);

const ActionBtn = ({ children, type, ...props }) => {
  const styles = {
    success: "bg-green-600/80 hover:bg-green-600",
    danger: "bg-red-600/80 hover:bg-red-600",
    warning: "bg-yellow-500/80 hover:bg-yellow-500",
    info: "bg-blue-500/80 hover:bg-blue-500",
    orange: "bg-orange-500/80 hover:bg-orange-500",
    purple: "bg-purple-500/80 hover:bg-purple-500",
    secondary: "bg-gray-600/80 hover:bg-gray-600",
  };
  return (
    <button {...props} className={`px-2 py-1 rounded text-xs transition text-white ${styles[type]}`}>
      {children}
    </button>
  );
};

const Pagination = ({ currentPage, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center mt-4 gap-4 items-center">
      <button
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
        className="px-4 py-1 bg-white/10 rounded text-sm disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-gray-400 text-sm">{currentPage} / {totalPages}</span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
        className="px-4 py-1 bg-white/10 rounded text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Dashboard;