import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function RoleSelection() {
  const navigate = useNavigate();

  /* ===============================
     🔥 NEW STATE FOR WINNER
  =============================== */
  const [winner, setWinner] = useState(null);

  /* ===============================
     🔥 FETCH WINNER WHEN PAGE LOADS
  =============================== */
  useEffect(() => {
    const fetchWinner = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/admin/election-result"
        );

        if (res.data.winnerName && res.data.winnerName !== "Error Fetching Winner") {
          setWinner(res.data);
        }
      } catch (error) {
        console.log("No completed election yet");
      }
    };

    fetchWinner();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black relative text-white">

      {/* Glow Effects */}
      <div className="absolute w-96 h-96 bg-indigo-600 opacity-20 blur-3xl rounded-full -top-20 -left-20"></div>
      <div className="absolute w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full bottom-0 right-0"></div>

      <div className="relative bg-white/10 backdrop-blur-lg p-12 rounded-3xl shadow-2xl border border-white/20 text-center w-[500px]">

        <h1 className="text-3xl font-bold mb-4">
          University E-Voting System
        </h1>

        <p className="text-gray-300 mb-6">
          Secure Blockchain-Based Election Platform
        </p>

        {/* ===============================
            🏆 WINNER DISPLAY SECTION
        =============================== */}
        {winner && (
          <div className="mb-8 p-5 bg-green-600/20 border border-green-400 rounded-2xl shadow-lg animate-pulse">
            <h2 className="text-2xl font-bold text-green-300 mb-2">
              🏆 Election Winner Announced!
            </h2>
            <p className="text-lg font-semibold">
              {winner.winnerName}
            </p>
            <p className="text-sm text-green-200 mt-1">
              Total Votes: {winner.winnerVotes}
            </p>
          </div>
        )}

        <div className="space-y-6">

          {/* Student Login Card */}
          <div className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg p-6 rounded-2xl">

            <div
              onClick={() => navigate("/student")}
              className="cursor-pointer"
            >
              <h2 className="text-xl font-semibold">
                🎓 Student Login
              </h2>
              <p className="text-sm text-indigo-200 mt-2">
                Cast your vote securely
              </p>
            </div>

            <button
              onClick={() => navigate("/student/register")}
              className="mt-4 w-full py-2 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              New Student? Register
            </button>
          </div>

          {/* Admin Login Card */}
          <div
            onClick={() => navigate("/admin")}
            className="cursor-pointer p-6 rounded-2xl bg-gray-700 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <h2 className="text-xl font-semibold">
              🔐 Admin Login
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              Manage and control election
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RoleSelection;