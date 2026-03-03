import React, { useEffect, useState } from "react";
import axios from "axios";

function ResultsPage() {
  const [results, setResults] = useState([]);
  const [winner, setWinner] = useState(null);
  const [electionTitle, setElectionTitle] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/results");

      setResults(res.data.results);
      setWinner(res.data.winner);
      setElectionTitle(res.data.electionTitle);
      setTotalVotes(res.data.totalVotes);

    } catch (error) {
      console.error("Failed to load results:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-10 w-[800px]">

        <h1 className="text-3xl font-bold text-center mb-4">
          {electionTitle}
        </h1>

        <p className="text-center mb-8 text-gray-300">
          Total Votes: {totalVotes}
        </p>

        {/* 🏆 Winner Section */}
        {winner && (
          <div className="bg-yellow-500/20 border border-yellow-400 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2">🏆 Winner</h2>
            <p className="text-xl font-semibold">{winner.name}</p>
            <p>{winner.votes} Votes ({winner.percentage}%)</p>
          </div>
        )}

        {/* 📊 All Candidates */}
        {results.map((c) => (
          <div key={c.id} className="mb-6">

            <div className="flex justify-between mb-1">
              <span>{c.name}</span>
              <span>{c.percentage}%</span>
            </div>

            <div className="w-full bg-white/20 rounded-full h-4">
              <div
                className="bg-indigo-500 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${c.percentage}%` }}
              />
            </div>

            <p className="text-sm text-gray-300 mt-1">
              {c.votes} votes
            </p>

          </div>
        ))}

      </div>
    </div>
  );
}

export default ResultsPage;