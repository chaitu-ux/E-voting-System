import { useState } from "react";
import axios from "axios";

export default function PublicVerifier() {
  const [commitmentHash, setCommitmentHash] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!commitmentHash.trim()) {
      setError("Please enter a commitment hash.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/voter/public-verify?commitmentHash=${commitmentHash.trim()}`
      );
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Verification failed. Hash not found."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.shieldIcon}>🔍</div>
          <h1 style={styles.title}>Public Vote Verifier</h1>
          <p style={styles.subtitle}>
            No login required. Paste any commitment hash to verify a vote on
            the blockchain.
          </p>
          <div style={styles.badges}>
            {["No Login Required", "Merkle Proof", "On-Chain Verified"].map(
              (b) => (
                <span key={b} style={styles.badge}>
                  {b}
                </span>
              )
            )}
          </div>
        </div>

        {/* Input */}
        <div style={styles.inputSection}>
          <label style={styles.label}>Commitment Hash</label>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="0x1a2b3c4d... (paste your commitment hash)"
              value={commitmentHash}
              onChange={(e) => setCommitmentHash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <button
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onClick={handleVerify}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Vote"}
            </button>
          </div>
          {error && <p style={styles.errorText}>⚠ {error}</p>}
        </div>

        {/* Result */}
        {result && (
          <div style={styles.resultBox}>
            {/* Verification badge */}
            <div
              style={{
                ...styles.verifyBadge,
                background: result.isVerifiedOnChain ? "#0d3d2a" : "#3d0d0d",
                borderColor: result.isVerifiedOnChain ? "#00e676" : "#ff5252",
              }}
            >
              <span style={{ fontSize: 22 }}>
                {result.isVerifiedOnChain ? "✅" : "❌"}
              </span>
              <span
                style={{
                  color: result.isVerifiedOnChain ? "#00e676" : "#ff5252",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {result.isVerifiedOnChain
                  ? "Verified On-Chain"
                  : "Not Verified On-Chain"}
              </span>
            </div>

            {/* Result fields */}
            <div style={styles.resultGrid}>
              <ResultRow label="Candidate Name" value={result.candidateName} />
              <ResultRow
                label="Commit TX Hash"
                value={result.commitTxHash}
                mono
              />
              <ResultRow
                label="Reveal TX Hash"
                value={result.revealTxHash}
                mono
              />
              <ResultRow label="Merkle Root" value={result.merkleRoot} mono />
            </div>

            {/* Merkle Proof */}
            {result.merkleProof && result.merkleProof.length > 0 && (
              <div style={styles.proofSection}>
                <p style={styles.proofLabel}>Merkle Inclusion Proof Path</p>
                {result.merkleProof.map((node, i) => (
                  <div key={i} style={styles.proofNode}>
                    <span style={styles.proofIndex}>{i + 1}</span>
                    <span style={styles.proofHash}>{node}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p style={styles.footer}>
          Powered by Blockchain Technology · E-Voting System
        </p>
      </div>
    </div>
  );
}

function ResultRow({ label, value, mono }) {
  return (
    <div style={styles.resultRow}>
      <span style={styles.resultLabel}>{label}</span>
      <span
        style={{
          ...styles.resultValue,
          fontFamily: mono ? "monospace" : "inherit",
          fontSize: mono ? 12 : 14,
          wordBreak: "break-all",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0f1e 0%, #1a1f3e 50%, #0d1b2a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 720,
    backdropFilter: "blur(12px)",
  },
  header: { textAlign: "center", marginBottom: 32 },
  shieldIcon: { fontSize: 48, marginBottom: 12 },
  title: { color: "#fff", fontSize: 28, fontWeight: 700, margin: "0 0 8px" },
  subtitle: { color: "#94a3b8", fontSize: 15, margin: "0 0 16px" },
  badges: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  badge: {
    background: "rgba(0,200,150,0.15)",
    color: "#00c896",
    border: "1px solid rgba(0,200,150,0.3)",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 600,
  },
  inputSection: { marginBottom: 24 },
  label: { color: "#94a3b8", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 },
  inputRow: { display: "flex", gap: 10 },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  button: {
    background: "linear-gradient(135deg, #00b4d8, #0077b6)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  errorText: { color: "#ff6b6b", fontSize: 13, marginTop: 8 },
  resultBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
  },
  verifyBadge: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    border: "1px solid",
    borderRadius: 10,
    padding: "12px 20px",
    marginBottom: 20,
  },
  resultGrid: { display: "flex", flexDirection: "column", gap: 12 },
  resultRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    paddingBottom: 12,
  },
  resultLabel: { color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 },
  resultValue: { color: "#e2e8f0", fontSize: 14 },
  proofSection: { marginTop: 20 },
  proofLabel: { color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  proofNode: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    marginBottom: 6,
  },
  proofIndex: { color: "#00c896", fontWeight: 700, fontSize: 12, minWidth: 20 },
  proofHash: { color: "#94a3b8", fontFamily: "monospace", fontSize: 11, wordBreak: "break-all" },
  footer: { textAlign: "center", color: "#475569", fontSize: 12, marginTop: 8 },
};