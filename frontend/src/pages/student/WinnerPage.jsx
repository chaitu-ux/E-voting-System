import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function WinnerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/results");
      setData(res.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No completed election available"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <p className="text-gray-400 text-lg">Loading results...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-page">
        <p className="text-gray-400 text-lg">No Results Available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen fade-page">
      <div className="container-modern">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-4">
          <h1 className="text-3xl font-bold tracking-wide">
            🏆 Election Results
          </h1>

          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 transition"
          >
            Back to Home
          </button>
        </div>

        {/* Winner Spotlight */}
        <div className="glass-card text-center mb-12">

          <h2 className="text-xl uppercase tracking-wider text-gray-400 mb-6">
            Winner
          </h2>

          <div className="flex flex-col items-center">

            <img
              src={
                data.winner.photo
                  ? `http://localhost:5000${data.winner.photo}`
                  : "/default-avatar.png"
              }
              alt={data.winner.name}
              className="w-36 h-36 rounded-full object-cover border-4 border-yellow-400 shadow-lg mb-6"
            />

            <h3 className="text-2xl font-bold text-yellow-400">
              {data.winner.name}
            </h3>

            <p className="mt-4 text-lg text-gray-300">
              🗳 Votes: <span className="text-white font-semibold">{data.winner.votes}</span>
            </p>

            <p className="text-lg text-cyan-400 font-semibold">
              📊 {data.winner.percentage}%
            </p>

          </div>
        </div>

        {/* Ranking Section */}
        <div className="glass-card">

          <h2 className="text-xl uppercase tracking-wider text-gray-400 mb-8">
            All Candidates Ranking
          </h2>

          <div className="space-y-5">
            {data.results.map((candidate, index) => (
              <div
                key={candidate.id}
                className="flex flex-col md:flex-row md:justify-between md:items-center p-5 rounded-xl bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400 font-bold text-lg">
                    #{index + 1}
                  </span>
                  <span className="font-medium">
                    {candidate.name}
                  </span>
                </div>

                <div className="text-gray-300 mt-2 md:mt-0">
                  {candidate.votes} votes ({candidate.percentage}%)
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default WinnerPage;