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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">

      <Confetti width={width} height={height} numberOfPieces={200} />

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-2xl p-10 w-[600px] text-center">

        <div className="text-6xl mb-4 animate-bounce">🎉</div>

        <h1 className="text-3xl font-bold mb-4">
          Vote Successfully Cast!
        </h1>

        <p className="text-gray-300 mb-6">
          Your vote has been securely recorded on the blockchain.
        </p>

        <div className="bg-white/10 p-4 rounded-lg border border-white/20 mb-4">
          <p className="text-sm text-gray-400 mb-1">Transaction Hash</p>
          <p className="break-all text-indigo-300 text-sm">
            {transactionHash}
          </p>
          <button
            onClick={handleCopy}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            Copy Hash
          </button>
        </div>

        <div className="bg-white/10 p-4 rounded-lg border border-white/20 mb-6">
          <p className="text-sm text-gray-400 mb-1">Block Number</p>
          <p className="text-lg font-semibold text-indigo-300">
            {blockNumber}
          </p>
        </div>

        <button
          onClick={() => {localStorage.removeItem("hasVoted");navigate("/");}}
          className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg"
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default SuccessPage;