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
    <div className="min-h-screen flex items-center justify-center fade-page">
      <div className="container-modern flex justify-center">

        <div className="glass-card w-[900px] max-w-[95%]">

          <h1 className="text-3xl font-bold text-center mb-3 tracking-wide">
            {electionTitle}
          </h1>

          <p className="text-center text-gray-400 mb-10">
            Total Votes Cast: <span className="text-cyan-400 font-semibold">{totalVotes}</span>
          </p>

          {/* 🏆 Winner Section */}
          {winner && (
            <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-2xl p-8 mb-10 text-center shadow-lg">
              <h2 className="text-2xl font-bold mb-3 text-yellow-400">
                🏆 Winner
              </h2>
              <p className="text-xl font-semibold text-white">
                {winner.name}
              </p>
              <p className="text-gray-300 mt-2">
                {winner.votes} Votes ({winner.percentage}%)
              </p>
            </div>
          )}

          {/* 📊 All Candidates */}
          <div className="space-y-8">
            {results.map((c) => (
              <div key={c.id}>

                <div className="flex justify-between mb-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-cyan-400 font-semibold">
                    {c.percentage}%
                  </span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full transition-all duration-1000"
                    style={{
                      width: `${c.percentage}%`,
                      background: "linear-gradient(90deg, #00D4FF, #7C3AED)"
                    }}
                  />
                </div>

                <p className="text-sm text-gray-400 mt-2">
                  {c.votes} votes
                </p>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}

export default ResultsPage;