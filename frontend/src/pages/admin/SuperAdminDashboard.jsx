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

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    if (!token) {
      navigate("/admin");
      return;
    }

    fetchAdmins();
    fetchElectionStatus();
  }, []);

  /* =========================
     FETCH ADMINS
  ========================= */
  const fetchAdmins = async () => {
    try {
      const res = await api.get("/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data);
    } catch (error) {
      toast.error("Failed to load admins");
    }
  };

  /* =========================
     CREATE ADMIN
  ========================= */
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
    } catch (error) {
      toast.error("Failed to create admin");
    }
  };

  /* =========================
     DELETE ADMIN
  ========================= */
  const deleteAdmin = async (id) => {
    try {
      await api.delete(`/admin/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Admin deleted");
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  /* =========================
     TRANSFER SUPERADMIN
  ========================= */
  const transferSuperadmin = async (id) => {
    try {
      await api.patch(
        `/admin/transfer-superadmin/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Superadmin transferred. Login again.");
      localStorage.clear();
      navigate("/admin");
    } catch (error) {
      toast.error("Failed to transfer superadmin");
    }
  };

  /* =========================
     FETCH ELECTION STATUS
  ========================= */
  const fetchElectionStatus = async () => {
    try {
      const res = await api.get("/election-status");
      setElectionOpen(res.data?.isOpen || false);
    } catch (error) {
      toast.error("Failed to load election status");
    }
  };

  /* =========================
     TOGGLE ELECTION
  ========================= */
  const toggleElection = async () => {
    try {
      await api.post(
        "/admin/toggle-election",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchElectionStatus();
      toast.success("Election status updated");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to toggle election"
      );
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-indigo-900 text-white p-10">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">
          Superadmin Dashboard 👑
        </h1>

        <div className="flex gap-4">
          <button
            onClick={toggleElection}
            className={`px-5 py-2 rounded font-semibold ${
              electionOpen
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {electionOpen ? "Close Election" : "Open Election"}
          </button>

          <button
            onClick={handleLogout}
            className="bg-gray-700 hover:bg-gray-800 px-5 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* CREATE ADMIN SECTION */}
      <div className="bg-white/10 p-6 rounded-xl mb-10">
        <h2 className="text-xl mb-4">Create New Admin</h2>

        <div className="flex gap-4">
          <input
            className="p-2 rounded bg-white/20 w-full"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="p-2 rounded bg-white/20 w-full"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="p-2 rounded bg-white/20 w-full"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={createAdmin}
            className="bg-green-600 px-5 rounded hover:bg-green-700"
          >
            Create
          </button>
        </div>
      </div>

      {/* ADMIN TABLE */}
      <div className="bg-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/20">
            <tr>
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} className="border-t border-white/20">
                <td className="p-3">{admin.name}</td>
                <td>{admin.email}</td>
                <td>{admin.role}</td>
                <td className="space-x-2">
                  {admin.role !== "superadmin" && (
                    <>
                      <button
                        onClick={() => transferSuperadmin(admin._id)}
                        className="bg-yellow-500 px-3 py-1 rounded"
                      >
                        Make Superadmin
                      </button>

                      <button
                        onClick={() => deleteAdmin(admin._id)}
                        className="bg-red-600 px-3 py-1 rounded"
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
  );
}

export default SuperadminDashboard;