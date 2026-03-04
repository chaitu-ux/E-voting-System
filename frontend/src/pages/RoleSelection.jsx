import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000";

function RoleSelection() {
  const navigate = useNavigate();
  const [winner, setWinner] = useState(null);

  /* =============================================================
     FETCH WINNER
     ✅ FIX: Only show winner card when electionClosed === true.
     Previously the winner was fetched but never displayed because
     the election status was still "active" / isOpen was true.
     The backend now returns electionClosed flag — we gate the
     winner display on that flag so it only appears after the
     superadmin closes the election.
  ============================================================= */
  useEffect(() => {
    const fetchWinner = async () => {
      try {
        const res = await axios.get(`${API}/api/voter/winner`);
        // ✅ FIX: Only set winner if election is actually closed
        if (res.data?.winner?.name && res.data?.electionClosed === true) {
          setWinner(res.data.winner);
        }
      } catch {
        // No completed election yet — silent fail
      }
    };
    fetchWinner();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center
                    justify-center bg-gradient-to-br from-[#0A0E27] via-[#0F3460]
                    to-[#1B1F3B] text-white">

      {/* Background Glows */}
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/20 blur-3xl
                      rounded-full -top-40 -left-40 animate-pulse" />
      <div className="absolute w-[600px] h-[600px] bg-purple-600/20 blur-3xl
                      rounded-full -bottom-40 -right-40 animate-pulse" />

      <div className="relative z-10 container-modern grid md:grid-cols-2
                      gap-16 items-center">

        {/* ── LEFT SIDE — HERO ── */}
        <div className="space-y-8">

          <h1 className="text-5xl font-extrabold leading-tight">
            Secure <span className="text-cyan-400">Blockchain</span> <br />
            E-Voting System
          </h1>

          <p className="text-gray-300 text-lg max-w-xl">
            Transparent. Tamper-proof. Decentralized.
            Experience next-generation university elections
            powered by blockchain technology.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3">
            {[
              "🔐 MFA Authentication",
              "🔒 ZKP Commit-Reveal",
              "✅ E2E Verification",
              "⛓️ Blockchain Secured",
            ].map((f) => (
              <span
                key={f}
                className="text-xs px-3 py-1 rounded-full border
                           border-cyan-400/30 bg-cyan-400/10 text-cyan-400"
              >
                {f}
              </span>
            ))}
          </div>

          {/* ✅ FIX: Winner card — only shown when electionClosed === true */}
          {winner && (
            <div className="p-6 rounded-2xl bg-green-500/10 border
                            border-green-400/40 shadow-lg shadow-green-500/20">
              <h2 className="text-xl font-bold text-green-400 mb-2">
                🏆 Election Winner
              </h2>
              {winner.photo && (
                <img
                  src={`${API}${winner.photo}`}
                  alt={winner.name}
                  className="w-16 h-16 rounded-full object-cover border-2
                             border-green-400 mb-3"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}
              <p className="text-lg font-semibold">{winner.name}</p>
              <p className="text-sm text-green-300 mt-1">
                Total Votes: {winner.votes}
              </p>
              <button
                onClick={() => navigate("/student/results")}
                className="mt-3 text-xs text-cyan-400 hover:underline"
              >
                View full results →
              </button>
            </div>
          )}

        </div>

        {/* ── RIGHT SIDE — ROLE CARDS ── */}
        <div className="space-y-8">

          {/* Student Card */}
          <div
            onClick={() => navigate("/student")}
            className="p-8 rounded-3xl backdrop-blur-xl bg-white/10
                       border border-white/10 hover:border-cyan-400
                       hover:shadow-cyan-400/30 hover:shadow-2xl
                       transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-6">
              <div className="text-5xl group-hover:scale-110 transition">🎓</div>
              <div>
                <h2 className="text-2xl font-semibold">Student Portal</h2>
                <p className="text-gray-400 mt-2">
                  Login and cast your vote securely.
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/student/register");
              }}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r
                         from-cyan-500 to-blue-600 font-semibold
                         hover:opacity-90 transition"
            >
              New Student? Register
            </button>
          </div>

          {/* Admin Card */}
          <div
            onClick={() => navigate("/admin")}
            className="p-8 rounded-3xl backdrop-blur-xl bg-white/10
                       border border-white/10 hover:border-purple-400
                       hover:shadow-purple-400/30 hover:shadow-2xl
                       transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-6">
              <div className="text-5xl group-hover:scale-110 transition">🔐</div>
              <div>
                <h2 className="text-2xl font-semibold">Admin Panel</h2>
                <p className="text-gray-400 mt-2">
                  Manage and control the election process.
                </p>
              </div>
            </div>
          </div>

          {/* View Results Card — always visible */}
          <div
            onClick={() => navigate("/student/results")}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/5
                       border border-white/10 hover:border-yellow-400
                       hover:shadow-yellow-400/20 hover:shadow-xl
                       transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl group-hover:scale-110 transition">📊</div>
              <div>
                <h2 className="text-lg font-semibold">View Election Results</h2>
                <p className="text-gray-400 text-sm mt-1">
                  See live vote counts and standings.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-sm text-gray-500 tracking-wide">
        Powered by Blockchain Technology
      </div>

    </div>
  );
}

export default RoleSelection;