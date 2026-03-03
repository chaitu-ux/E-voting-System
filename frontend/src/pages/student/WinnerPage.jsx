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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading results...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        No Results Available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">
          🏆 Election Results
        </h1>

        <button
          onClick={() => navigate("/")}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded"
        >
          Back to Home
        </button>
      </div>

      {/* Winner Section */}
      <div className="bg-white/10 p-8 rounded-2xl text-center mb-10">

        <h2 className="text-xl mb-4">Winner</h2>

        <div className="flex flex-col items-center">
          <img
            src={
              data.winner.photo
                ? `http://localhost:5000${data.winner.photo}`
                : "/default-avatar.png"
            }
            alt={data.winner.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400 mb-4"
          />

          <h3 className="text-2xl font-bold text-yellow-400">
            {data.winner.name}
          </h3>

          <p className="mt-2 text-lg">
            🗳 Votes: {data.winner.votes}
          </p>

          <p className="text-lg">
            📊 {data.winner.percentage}%
          </p>
        </div>
      </div>

      {/* All Candidates Ranking */}
      <div className="bg-white/10 p-8 rounded-2xl">
        <h2 className="text-xl mb-6">All Candidates</h2>

        <div className="space-y-4">
          {data.results.map((candidate, index) => (
            <div
              key={candidate.id}
              className="flex justify-between items-center p-4 rounded-lg bg-white/5"
            >
              <div>
                <span className="font-bold mr-3">
                  #{index + 1}
                </span>
                {candidate.name}
              </div>

              <div>
                {candidate.votes} votes ({candidate.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default WinnerPage;