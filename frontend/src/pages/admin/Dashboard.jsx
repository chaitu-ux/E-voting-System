import React, { useEffect, useState } from "react";
import api from "../../api";
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

  const rowsPerPage = 5;

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    fetchStudents();
    fetchFraudLogs();
    fetchVoteAnalytics();
    fetchCandidates();
  }, []);

  /* ================= FETCH ================= */

  const fetchStudents = async () => {
    try {
      const res = await api.get("/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch {
      toast.error("Failed to load students");
    }
  };

  const fetchFraudLogs = async () => {
    try {
      const res = await api.get("/admin/fraud-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFraudLogs(res.data);
    } catch {
      toast.error("Failed to load fraud logs");
    }
  };

  const fetchVoteAnalytics = async () => {
    try {
      const res = await api.get("/admin/vote-analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteAnalytics(res.data);
    } catch {
      toast.error("Failed to load analytics");
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get("/candidates/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data);
    } catch {
      toast.error("Failed to load candidates");
    }
  };

  /* ================= CANDIDATE ACTIONS ================= */

  const approveCandidate = async (id) => {
    try {
      await api.patch(`/candidates/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Candidate Approved");
      fetchCandidates();
    } catch {
      toast.error("Failed to approve candidate");
    }
  };

  const rejectCandidate = async (id) => {
    try {
      await api.patch(`/candidates/reject/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Candidate Rejected");
      fetchCandidates();
    } catch {
      toast.error("Failed to reject candidate");
    }
  };

  /* ================= STUDENT ACTIONS ================= */

  const approveStudent = async (id) => {
    await api.patch(`/admin/approve/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Student Approved");
    fetchStudents();
  };

  const rejectStudent = async (id) => {
    await api.patch(`/admin/reject/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Student Rejected");
    fetchStudents();
  };

  const blacklistStudent = async (id) => {
    await api.patch(`/admin/blacklist/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Student Blocked");
    fetchStudents();
  };

  const unblockStudent = async (id) => {
    await api.patch(`/admin/unblacklist/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Student Unblocked");
    fetchStudents();
  };

  const deleteStudent = async (id) => {
    await api.delete(`/admin/delete-student/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Student Deleted");
    fetchStudents();
  };

  /* ================= FILTER & PAGINATION ================= */

  const filteredStudents = students.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginate = (data, page) => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  };

  const currentStudents = paginate(filteredStudents, studentPage);
  const currentFraud = paginate(fraudLogs, fraudPage);

  const studentTotalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const fraudTotalPages = Math.ceil(fraudLogs.length / rowsPerPage);

  /* ================= CHART ================= */

  const chartData = {
    labels:
      voteAnalytics?.votesPerCandidate?.map(
        (v) => v.candidateName || "Candidate"
      ) || [],
    datasets: [
      {
        label: "Votes",
        data:
          voteAnalytics?.votesPerCandidate?.map((v) => v.votes) || [],
        backgroundColor: "rgba(0,212,255,0.7)",
      },
    ],
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold tracking-wide">
            Admin Dashboard
          </h1>

          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition"
          >
            Logout
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card title="Total Students" value={students.length} />
          <Card title="Approved"
            value={students.filter((s) => s.status === "approved").length}
            color="text-green-400" />
          <Card title="Pending"
            value={students.filter((s) => s.status === "pending").length}
            color="text-yellow-400" />
          <Card title="Blacklisted"
            value={students.filter((s) => s.isBlacklisted).length}
            color="text-red-500" />
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton label="Students" active={activeTab === "students"} onClick={() => setActiveTab("students")} />
          <TabButton label="Candidates" active={activeTab === "candidates"} onClick={() => setActiveTab("candidates")} />
          <TabButton label="Fraud Logs" active={activeTab === "fraud"} onClick={() => setActiveTab("fraud")} />
          <TabButton label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
        </div>

        {/* ================= CANDIDATES ================= */}
        {activeTab === "candidates" && (
          <GlassTable>
            <thead>
              <tr>
                <th className="p-3">Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c._id} className="border-t border-white/10">
                  <td className="p-3">{c.student?.name}</td>
                  <td>{c.student?.email}</td>
                  <td>{c.status}</td>
                  <td className="space-x-2">
                    {c.status === "pending" && (
                      <>
                        <ActionBtn type="success" onClick={() => approveCandidate(c._id)}>Approve</ActionBtn>
                        <ActionBtn type="danger" onClick={() => rejectCandidate(c._id)}>Reject</ActionBtn>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </GlassTable>
        )}

        {/* ================= STUDENTS ================= */}
        {activeTab === "students" && (
          <>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setStudentPage(1);
              }}
              className="modern-input mb-6"
            />

            <GlassTable>
              <thead>
                <tr>
                  <th className="p-3">ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((s) => (
                  <tr key={s._id} className="border-t border-white/10">
                    <td className="p-3">{s.studentId}</td>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.isBlacklisted ? "Blacklisted" : s.status}</td>
                    <td className="space-x-2">
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
                      <ActionBtn type="secondary" onClick={() => deleteStudent(s._id)}>Delete</ActionBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </GlassTable>

            <Pagination currentPage={studentPage} totalPages={studentTotalPages} setPage={setStudentPage} />
          </>
        )}

        {/* ================= FRAUD ================= */}
        {activeTab === "fraud" && (
          <>
            <GlassTable>
              <thead>
                <tr>
                  <th className="p-3">Student Hash</th>
                  <th>Reason</th>
                  <th>IP</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {currentFraud.map((log) => (
                  <tr key={log._id} className="border-t border-white/10">
                    <td className="p-3 text-xs">{log.studentHash}</td>
                    <td>{log.reason}</td>
                    <td>{log.ipAddress}</td>
                    <td>{log.severity}</td>
                  </tr>
                ))}
              </tbody>
            </GlassTable>

            <Pagination currentPage={fraudPage} totalPages={fraudTotalPages} setPage={setFraudPage} />
          </>
        )}

        {/* ================= ANALYTICS ================= */}
        {activeTab === "analytics" && voteAnalytics && (
          <div className="glass-card mt-6 h-[320px]">
            <Bar data={chartData} />
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

const Card = ({ title, value, color }) => (
  <div className="stat-card">
    <h3 className="text-gray-400 uppercase text-sm tracking-wider">{title}</h3>
    <p className={`stat-number mt-3 ${color || ""}`}>{value}</p>
  </div>
);

const TabButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2 rounded-lg transition ${
      active
        ? "bg-gradient-to-r from-cyan-500 to-purple-600"
        : "bg-white/10 hover:bg-white/20"
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
    success: "bg-green-600 hover:bg-green-700",
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-blue-500 hover:bg-blue-600",
    secondary: "bg-gray-600 hover:bg-gray-700"
  };
  return (
    <button
      {...props}
      className={`px-3 py-1 rounded text-sm transition ${styles[type]}`}
    >
      {children}
    </button>
  );
};

const Pagination = ({ currentPage, totalPages, setPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center mt-6 gap-4">
      <button
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
        className="px-4 py-1 bg-white/10 rounded disabled:opacity-40"
      >
        Prev
      </button>
      <span className="text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
        className="px-4 py-1 bg-white/10 rounded disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Dashboard;