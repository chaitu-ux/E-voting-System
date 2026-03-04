import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Oval } from "react-loader-spinner";

function SuperadminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [admins, setAdmins] = useState([]);
  const [electionOpen, setElectionOpen] = useState(false);
  const [togglingElection, setTogglingElection] = useState(false);

  // Create admin form
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAdmins();
    fetchElectionStatus();
  }, []);

  /* =============================================================
     FETCH
  ============================================================= */
  const fetchAdmins = async () => {
    try {
      const res = await api.get("/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data);
    } catch {
      toast.error("Failed to load admins");
    }
  };

  const fetchElectionStatus = async () => {
    try {
      const res = await api.get("/election-status");
      setElectionOpen(res.data?.isOpen || false);
    } catch {
      toast.error("Failed to load election status");
    }
  };

  /* =============================================================
     CREATE ADMIN
  ============================================================= */
  const createAdmin = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error("All fields are required");
    }
    if (form.password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    const toastId = toast.loading("Creating admin...");
    setCreating(true);

    try {
      await api.post(
        "/admin/create",
        { name: form.name, email: form.email, password: form.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Admin created successfully", { id: toastId });
      setForm({ name: "", email: "", password: "" });
      fetchAdmins();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create admin", { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  /* =============================================================
     DELETE ADMIN
  ============================================================= */
  const deleteAdmin = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    try {
      await api.delete(`/admin/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Admin deleted");
      fetchAdmins();
    } catch {
      toast.error("Failed to delete admin");
    }
  };

  /* =============================================================
     TRANSFER SUPERADMIN
  ============================================================= */
  const transferSuperadmin = async (id, name) => {
    if (!window.confirm(
      `Transfer Superadmin role to ${name}? You will be logged out.`
    )) return;

    try {
      await api.patch(
        `/admin/transfer-superadmin/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Superadmin transferred. Please login again.");
      localStorage.clear();
      navigate("/admin");
    } catch {
      toast.error("Failed to transfer superadmin");
    }
  };

  /* =============================================================
     TOGGLE ELECTION (with blockchain sync)
  ============================================================= */
  const toggleElection = async () => {
    const action = electionOpen ? "close" : "open";
    if (!window.confirm(
      `Are you sure you want to ${action} the election? This will sync with the blockchain.`
    )) return;

    const toastId = toast.loading(
      `${action === "open" ? "Opening" : "Closing"} election on blockchain...`
    );
    setTogglingElection(true);

    try {
      await api.post(
        "/admin/toggle-election",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchElectionStatus();

      toast.success(
        `✅ Election ${action === "open" ? "opened" : "closed"} on DB + blockchain`,
        { id: toastId }
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to toggle election",
        { id: toastId }
      );
    } finally {
      setTogglingElection(false);
    }
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
        <div className="flex flex-col md:flex-row md:justify-between
                        md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">
              Superadmin Dashboard 👑
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Full system control — blockchain + database management
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20
                         border border-white/10 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ELECTION CONTROL CARD */}
        <div className={`glass-card mb-8 border ${
          electionOpen
            ? "border-green-500/30 bg-green-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}>
          <div className="flex flex-col md:flex-row md:justify-between
                          md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1">
                🗳️ Election Control
              </h2>
              <p className="text-sm text-gray-400">
                Toggling syncs with the blockchain smart contract
              </p>

              <div className="flex items-center gap-3 mt-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  electionOpen ? "bg-green-400" : "bg-red-400"
                }`} />
                <span className={`font-semibold text-sm ${
                  electionOpen ? "text-green-400" : "text-red-400"
                }`}>
                  Election is {electionOpen ? "OPEN" : "CLOSED"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-start md:items-end">
              <button
                onClick={toggleElection}
                disabled={togglingElection}
                className={`px-8 py-3 rounded-xl font-semibold transition
                            flex items-center gap-2 disabled:opacity-50
                  ${electionOpen
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                {togglingElection ? (
                  <Oval height={18} width={18} color="#fff" />
                ) : electionOpen ? (
                  "🔒 Close Election"
                ) : (
                  "🟢 Open Election"
                )}
              </button>
              <p className="text-xs text-gray-500">
                ⛓️ Syncs with Ethereum smart contract
              </p>
            </div>
          </div>
        </div>

        {/* CREATE ADMIN CARD */}
        <div className="glass-card mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest
                         text-gray-400 mb-5">
            Create New Admin
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name</label>
              <input
                className="modern-input"
                placeholder="Admin name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                className="modern-input"
                placeholder="admin@university.edu"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="modern-input pr-12"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-white text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={createAdmin}
                disabled={creating}
                className="modern-btn w-full flex items-center
                           justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <Oval height={18} width={18} color="#fff" />
                ) : (
                  "+ Create Admin"
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ADMINS TABLE */}
        <div className="glass-card overflow-x-auto">

          <h2 className="text-sm font-semibold uppercase tracking-widest
                         text-gray-400 mb-5">
            All Admins ({admins.length})
          </h2>

          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider
                             border-b border-white/10">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}
                  className="border-t border-white/10 hover:bg-white/5 transition">

                  <td className="p-3 text-sm">{admin.name}</td>
                  <td className="p-3 text-sm text-gray-400">{admin.email}</td>

                  <td className="p-3">
                    <span className={`text-xs px-3 py-1 rounded-full
                                      font-semibold border
                      ${admin.role === "superadmin"
                        ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
                        : "text-cyan-400 bg-cyan-400/10 border-cyan-400/30"}`}>
                      {admin.role === "superadmin" ? "👑 Superadmin" : "🔐 Admin"}
                    </span>
                  </td>

                  <td className="p-3">
                    {admin.role !== "superadmin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            transferSuperadmin(admin._id, admin.name)
                          }
                          className="px-3 py-1 rounded-lg bg-yellow-500/80
                                     hover:bg-yellow-500 transition text-xs
                                     text-white font-semibold"
                        >
                          👑 Make Superadmin
                        </button>
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          className="px-3 py-1 rounded-lg bg-red-600/80
                                     hover:bg-red-600 transition text-xs
                                     text-white font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    {admin.role === "superadmin" && (
                      <span className="text-xs text-gray-500">
                        Current Superadmin
                      </span>
                    )}
                  </td>

                </tr>
              ))}

              {admins.length === 0 && (
                <tr>
                  <td colSpan={4}
                    className="p-6 text-center text-gray-500 text-sm">
                    No admins found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default SuperadminDashboard;