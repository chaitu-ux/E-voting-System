import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "@react-hook/window-size";

function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [width, height] = useWindowSize();

  const { transactionHash, blockNumber } = location.state || {};

  const handleCopy = () => {
    navigator.clipboard.writeText(transactionHash);
    toast.success("📋 Transaction Hash copied!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-page">

      <Confetti width={width} height={height} numberOfPieces={200} />

      <div className="glass-card w-[700px] max-w-[95%] text-center">

        <div className="text-6xl mb-6 animate-pulse">🎉</div>

        <h1 className="text-3xl font-bold mb-3 tracking-wide">
          Vote Successfully Cast!
        </h1>

        <p className="text-gray-400 mb-10">
          Your vote has been securely recorded on the blockchain.
          You can verify your transaction details below.
        </p>

        {/* Transaction Hash Card */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-6">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
            Transaction Hash
          </p>

          <p className="break-all text-cyan-400 text-sm font-mono">
            {transactionHash}
          </p>

          <button
            onClick={handleCopy}
            className="mt-4 text-xs text-cyan-400 hover:text-white transition"
          >
            Copy Hash
          </button>
        </div>

        {/* Block Number Card */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-10">
          <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
            Block Number
          </p>

          <p className="text-2xl font-bold text-purple-400">
            {blockNumber}
          </p>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("hasVoted");
            navigate("/");
          }}
          className="modern-btn w-full"
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default SuccessPage;