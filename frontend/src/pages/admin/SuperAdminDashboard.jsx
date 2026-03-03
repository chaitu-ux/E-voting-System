import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function SuperadminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [admins, setAdmins] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [electionOpen, setElectionOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    fetchAdmins();
    fetchElectionStatus();
  }, []);

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

  const createAdmin = async () => {
    if (!name || !email || !password) {
      return toast.error("All fields required");
    }

    try {
      await api.post(
        "/admin/create",
        { name, email, password, role: "admin" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Admin created successfully");
      setName("");
      setEmail("");
      setPassword("");
      fetchAdmins();
    } catch {
      toast.error("Failed to create admin");
    }
  };

  const deleteAdmin = async (id) => {
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

  const transferSuperadmin = async (id) => {
    try {
      await api.patch(
        `/admin/transfer-superadmin/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Superadmin transferred. Login again.");
      localStorage.clear();
      navigate("/admin");
    } catch {
      toast.error("Failed to transfer superadmin");
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

  const toggleElection = async () => {
    try {
      await api.post(
        "/admin/toggle-election",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchElectionStatus();
      toast.success("Election status updated");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to toggle election"
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-4">
          <h1 className="text-3xl font-bold tracking-wide">
            Superadmin Dashboard 👑
          </h1>

          <div className="flex flex-wrap gap-4">

            <button
              onClick={toggleElection}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                electionOpen
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {electionOpen ? "Close Election" : "Open Election"}
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition"
            >
              Logout
            </button>

          </div>
        </div>

        {/* CREATE ADMIN */}
        <div className="glass-card mb-12">

          <h2 className="text-xl font-semibold mb-6 uppercase tracking-wider text-gray-400">
            Create New Admin
          </h2>

          <div className="grid md:grid-cols-4 gap-4">

            <input
              className="modern-input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="modern-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              className="modern-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={createAdmin}
              className="modern-btn"
            >
              Create
            </button>

          </div>
        </div>

        {/* ADMIN TABLE */}
        <div className="glass-card overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-white/10">
              <tr>
                <th className="p-4">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} className="border-t border-white/10">

                  <td className="p-4">{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`font-semibold ${
                      admin.role === "superadmin"
                        ? "text-yellow-400"
                        : "text-cyan-400"
                    }`}>
                      {admin.role}
                    </span>
                  </td>

                  <td className="space-x-2">

                    {admin.role !== "superadmin" && (
                      <>
                        <button
                          onClick={() => transferSuperadmin(admin._id)}
                          className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 transition text-sm"
                        >
                          Make Superadmin
                        </button>

                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 transition text-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}

export default SuperadminDashboard;