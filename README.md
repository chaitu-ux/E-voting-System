# 🗳️ University Blockchain E-Voting System

A decentralized, tamper-resistant electronic voting system for university student elections.  
Built with **React 19**, **Node.js/Express**, **MongoDB**, and **Ethereum (Hardhat + Solidity)** — combining a modern web stack with smart contracts to deliver transparent, privacy-preserving, and fraud-resistant elections.

> **MCA Final Year Project** — Chaitanya | [GitHub](https://github.com/chaitu-ux/E-voting-System)

---

## 📋 Project Overview

Most existing e-voting systems are centralized, making them vulnerable to vote tampering, weak authentication, lack of transparency, and low voter trust. This project addresses those limitations through **six core technical contributions**:

| # | Contribution | Implementation |
|---|---|---|
| 1 | **DID-Inspired Authentication + MFA** | keccak256 DID hash + OTP + password (3-factor) |
| 2 | **ZKP-Inspired Privacy** | Commit–reveal scheme with cryptographic commitment |
| 3 | **End-to-End Verifiable Voting (E2E-V)** | Merkle proof + on-chain verification + public verifier |
| 4 | **Behavioral Fraud Detection** | IP rate + rapid attempt detection + auto-blacklist |
| 5 | **Layer-2 + Sidechain Architecture** | Off-chain data + Merkle root on-chain + checkpoint ledger |
| 6 | **Transparency and Auditability** | Admin Merkle panel + Sidechain Checkpoint Ledger + public `/verify` |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND  (React 19)                         │
│  Student Portal  │  Admin Dashboard  │  Public Verifier (/verify)   │
│  Tailwind CSS + Framer Motion + Chart.js                             │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  REST API  (Axios + JWT)
┌────────────────────────────▼─────────────────────────────────────────┐
│                    BACKEND  (Node.js + Express 5)                    │
│                                                                      │
│  voterRoutes.js          adminRoutes.js       authRoutes.js          │
│  ├─ commit-vote          ├─ approve/reject    ├─ register            │
│  ├─ reveal-vote          ├─ fraud-logs        ├─ login + OTP         │
│  ├─ verify-my-vote       ├─ vote-analytics    └─ verify-did          │
│  ├─ merkle-root          └─ voter-status                             │
│  ├─ merkle-proof                                                     │
│  └─ sidechain-checkpoints  ← ✅ NEW                                  │
│                                                                      │
│  MongoDB  (Mongoose)                                                 │
│  Student │ Voter │ FraudLog │ Candidate │ Election │ Admin           │
│  SidechainCheckpoint  ← ✅ NEW                                       │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  ethers.js v6  (Hardhat local node)
┌────────────────────────────▼─────────────────────────────────────────┐
│                   BLOCKCHAIN  (Ethereum / Hardhat)                   │
│                                                                      │
│  Voting.sol                                                          │
│  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  DID Registry    │  │  Commit-Reveal  │  │  Merkle Anchor      │ │
│  │ registerVoterDID │  │  commitVote()   │  │ anchorOffChainData()│ │
│  │ setEligibility() │  │  revealVote()   │  │ verifyOffChainRec() │ │
│  └──────────────────┘  └─────────────────┘  └─────────────────────┘ │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Fraud Control   │  │  Events                                  │ │
│  │ blacklistVoter() │  │  VoteCommitted, VoteRevealed,            │ │
│  │ reportFraud()    │  │  VoteReceiptIssued, OffChainDataAnchored │ │
│  └──────────────────┘  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Tailwind CSS | 3.x | Styling |
| Framer Motion | 12.x | Animations |
| React Hot Toast | 2.x | Notifications |
| Chart.js + react-chartjs-2 | 4.x | Results visualization |
| React Loader Spinner | 8.x | Loading states |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 5.x | Web framework |
| MongoDB + Mongoose | 9.x | Off-chain data store |
| JSON Web Token | 9.x | Authentication |
| bcryptjs | 3.x | Password hashing |
| Nodemailer | 8.x | OTP email delivery |
| Multer | 2.x | Candidate photo uploads |
| Helmet | 8.x | Security headers |
| express-rate-limit | 7.x | Rate limiting |
| Ethers.js | 6.x | Ethereum interaction |
| merkletreejs | latest | Merkle tree construction |

### Blockchain

| Technology | Purpose |
|---|---|
| Solidity 0.8.20 | Smart contract (Voting.sol) |
| Hardhat | Local Ethereum node + deployment |
| Ethers.js v6 | Contract interaction |
| TypeScript | Deployment scripts |

---

## 📁 Project Structure

```
E-votingSystem/
├── backend/
│   ├── models/
│   │   ├── Student.js              # riskScore, suspiciousIPs, lastAttemptTime, isRapidAttempt()
│   │   ├── Voter.js                # commitmentHash, nonce, phase, verificationCode
│   │   ├── FraudLog.js             # reason, severity, ipAddress, timestamps
│   │   ├── SidechainCheckpoint.js  # ✅ NEW — checkpoint ledger model
│   │   ├── Candidate.js
│   │   ├── Election.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── voterRoutes.js    # commit-vote, reveal-vote, verify-my-vote,
│   │   │                     # merkle-root, merkle-proof, results, winner,
│   │   │                     # sidechain-checkpoints  ← ✅ NEW
│   │   ├── adminRoutes.js    # students, approve, fraud-logs,
│   │   │                     # vote-analytics (topRiskStudents), voter-status (zkpProof)
│   │   ├── authRoutes.js     # register, login, verify-otp, verify-did
│   │   └── candidateRoutes.js
│   ├── middleware/
│   └── server.js
│
├── frontend/src/
│   ├── pages/
│   │   ├── admin/
│   │   │   └── Dashboard.jsx        # Merkle panel + Sidechain Checkpoint Ledger ← ✅ NEW
│   │   │                            # + fraud leaderboard + ZKP modal
│   │   └── student/
│   │       ├── VotePage.jsx         # Two-phase commit-reveal + Verify My Vote
│   │       ├── StudentDashboard.jsx # DID fingerprint panel + election status
│   │       ├── SuccessPage.jsx      # Vote receipt with verificationCode
│   │       └── ResultsPage.jsx      # Results + Merkle root display
│   ├── components/
│   │   └── DIDFingerprintPanel.jsx  # Shows student their on-chain DID hash
│   ├── PublicVerifier.jsx           # /verify — no login public Merkle proof checker
│   └── App.js
│
├── contracts/
│   └── Voting.sol                   # Full contract: DID, commit-reveal, Merkle, fraud
├── scripts/
│   └── deploy.ts
└── hardhat.config.ts
```

---
### Default Credentials (for testing)

Admin:
Email: [admin@university.com](mailto:admin@evoting.com)
Password: 123456

Super Admin:
Email: [supersayan@university.com](mailto:superadmin@evoting.com)
Password: 123456
---------

## 🔐 Identity, Authentication and Privacy

### 1. DID-Inspired Authentication

Each student receives a **Decentralized Identity hash** derived from their student ID:

```js
didHash = keccak256(studentId + DID_SALT)   // one-way, salted, irreversible
did     = "did:university:" + didHash
```

- Only the hash is registered on-chain via `registerVoterDID(didHash)`
- Real student name and ID stay in MongoDB — never touch the blockchain
- Eligibility is managed on-chain via `setVoterEligibility(didHash, bool)`
- **Auto-heal**: if blockchain TX fails during admin approval, `commit-vote` automatically re-registers the DID before proceeding

### 2. Multi-Factor Authentication

| Factor | Method | Enforced at |
|---|---|---|
| 1 — Password | bcrypt-hashed, verified at login | `/api/auth/login` |
| 2 — OTP | 6-digit code via email, time-limited | `/api/auth/verify-otp` |
| 3 — DID eligibility | On-chain check before voting | `commit-vote` + `reveal-vote` |

**Rate limits applied:**

| Endpoint group | Limit |
|---|---|
| Global | 500 req / 15 min |
| Auth (login/OTP) | 50 req / 15 min |
| Status polling | 300 req / 15 min |
| Voting (commit/reveal) | 20 req / 15 min |

### 3. ZKP-Inspired Commit–Reveal Voting

Voting is split into two phases so the ballot is hidden until reveal:

**Phase 1 — Commit** (`POST /api/voter/commit-vote`)
```
commitmentHash = keccak256(didHash + candidateId + nonce)
```
Only this hash is sent to the blockchain. The candidate choice is completely hidden.

**Phase 2 — Reveal** (`POST /api/voter/reveal-vote`)
```
contract recomputes keccak256(didHash, candidateId, nonce)
verifies match with stored commitment → counts the vote
```

This proves the voter knew their choice at commit time without revealing it during Phase 1 — a **zero-knowledge commitment property**.

> **Scope note:** This is a ZKP-*inspired* commit–reveal scheme, not a formal zero-knowledge proof system (zk-SNARKs / zk-STARKs). See [Limitations](#%EF%B8%8F-limitations--future-work).

---

## ✅ End-to-End Verifiable Voting (E2E-V)

After each vote is revealed, it is included in a Merkle tree:

```
Leaf nodes   = commitmentHash of each revealed vote
Merkle root  = keccak256 of all leaves (deterministic, sortPairs: true)
On-chain     = root stored via anchorOffChainData() in Voting.sol
```

**Student verification steps:**
1. After voting, a `verificationCode` is shown on the Success page
2. Enter the code in **Verify My Vote** on VotePage
3. System returns: candidate name, TX hash, Merkle root, inclusion proof
4. Proof verified on-chain via `verifyOffChainRecord()` in Voting.sol

**Public Verifier page** (`/verify`) — no login required.  
Any voter, auditor, or examiner can paste a `commitmentHash` and independently verify it against the on-chain Merkle root.

---

## 🚨 Fraud Detection Algorithm

Three-layer behavioral and rule-based system:

| Layer | Signal | Threshold | Effect |
|---|---|---|---|
| 1 — Duplicate vote | DB check + `contract.hasVoted(didHash)` | Any | `handleFraud()` + report to chain |
| 2 — IP rate detection | Same IP in FraudLog (1-hour window) | > 3 entries | `riskScore +15`, added to `suspiciousIPs[]`, FraudLog severity = high |
| 3 — Rapid attempt | Time between requests | < 60 seconds | `failedAttempts +1`, `riskScore +10`, FraudLog severity = medium |

**Auto-blacklist:**
```
failedAttempts >= 3  →  isBlacklisted = true  →  blacklistVoter(didHash) on-chain
```

Admin dashboard features:
- **Fraud severity counts** (HIGH / MEDIUM / LOW) — live from FraudLog aggregation
- **Risk Score Leaderboard** — top 5 students by riskScore
- **Full fraud log table** — IP, reason, severity, timestamp

---

## 🔗 Layer-2 and Sidechain Architecture

The system implements both Layer-2 rollup concepts and sidechain checkpoint patterns — directly addressing both claims in the project abstract.

### Layer-2 Inspired Design

All vote data is processed off-chain; only cryptographic proofs go on-chain:

| What | Where | Why |
|---|---|---|
| Full vote records | MongoDB (off-chain) | ~99% gas cost reduction |
| Student and candidate data | MongoDB (off-chain) | Privacy + performance |
| 32-byte Merkle root | Ethereum (on-chain) | Tamper-evident immutable proof |
| DID hashes + fraud flags | Ethereum (on-chain) | Identity + fraud integrity |

This mirrors how Optimism and Arbitrum post state roots to Ethereum mainnet. A single `anchorOffChainData()` call proves the integrity of all off-chain votes.

### Sidechain Checkpoint Ledger ✅

The system explicitly implements the **sidechain checkpoint pattern** — every time a vote is revealed, the backend:

1. Computes the Merkle tree over all revealed votes — this is the **sidechain state root**
2. Posts the 32-byte root to Ethereum via `anchorOffChainData()` — this is the **checkpoint transaction**
3. Saves a `SidechainCheckpoint` record to MongoDB — this is the **permanent checkpoint ledger**

This is exactly how **Polygon PoS** works:
- Our private Hardhat node = the sidechain (isolated chain with its own rules)
- `anchorOffChainData()` = the checkpoint posted to the settlement layer
- `SidechainCheckpoint` collection = the checkpoint ledger
- Ethereum contract = the settlement / parent chain

**Checkpoint record fields:**

| Field | Description |
|---|---|
| `checkpointNumber` | Sequential ID (#1, #2, #3...) |
| `merkleRoot` | 32-byte state root anchored on Ethereum |
| `txHash` | Ethereum TX hash of the anchor call |
| `blockNumber` | Block number on our private chain |
| `voteCount` | Number of votes covered by this checkpoint |
| `triggeredBy` | `"auto"` (from reveal-vote) or `"manual"` (admin Re-Anchor) |
| `createdAt` | Timestamp of the checkpoint |

**Checkpoint flow:**
```
Student reveals vote
       ↓
anchorMerkleRoot("auto") called
       ↓
Merkle tree built from all revealed votes  →  state root computed
       ↓
anchorOffChainData(root) posted to Ethereum  →  checkpoint TX on-chain
       ↓
SidechainCheckpoint saved to MongoDB  →  checkpoint ledger updated
       ↓
Admin Dashboard → Analytics → Sidechain Checkpoint Ledger panel updated
```

**API endpoint:**
```
GET /api/voter/sidechain-checkpoints
```
Returns the full checkpoint ledger — public endpoint, no login required. Any auditor can independently verify each checkpoint root matches the on-chain stored value.

**Viva answer for sidechain:**
> *"Our private Hardhat node is the sidechain. Every vote reveal triggers an automatic checkpoint — the Merkle root is posted to Ethereum via `anchorOffChainData()`. This checkpoint log is visible in the admin dashboard. This mirrors Polygon PoS: process transactions locally on the sidechain, commit state checkpoints to Ethereum periodically."*

> **Scope note:** The system runs on a **local Hardhat private network** demonstrating the sidechain pattern. Production deployment on a recognised sidechain like Polygon PoS is future work. See [Limitations](#%EF%B8%8F-limitations--future-work).

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register-student` | None | Register with credentials |
| POST | `/api/auth/login` | None | Password login → sends OTP |
| POST | `/api/auth/verify-otp` | None | Verify OTP → issues JWT |
| POST | `/api/auth/verify-did` | Student JWT | Verify DID on-chain |
| POST | `/api/auth/logout` | Student JWT | Clear MFA session |

### Voter

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/voter/status` | Student JWT | Eligibility + vote status |
| POST | `/api/voter/commit-vote` | Student JWT | Phase 1 — submit commitment hash |
| POST | `/api/voter/reveal-vote` | Student JWT | Phase 2 — reveal + anchor Merkle root + save checkpoint |
| POST | `/api/voter/verify-my-vote` | Student JWT | Verify vote + Merkle proof |
| GET | `/api/voter/merkle-root` | None | Live Merkle root + on-chain sync status |
| GET | `/api/voter/merkle-proof/:hash` | None | Merkle inclusion proof for any hash |
| GET | `/api/voter/verify-receipt/:code` | None | Public receipt check |
| GET | `/api/voter/sidechain-checkpoints` | None | ✅ Full sidechain checkpoint ledger |
| GET | `/api/voter/results` | None | Election results + Merkle root |
| GET | `/api/voter/winner` | None | Election winner |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/students` | Admin JWT | All students with riskScore |
| PATCH | `/api/admin/approve/:id` | Admin JWT | Approve + register DID on-chain |
| PATCH | `/api/admin/reject/:id` | Admin JWT | Reject student |
| PATCH | `/api/admin/blacklist/:id` | Admin JWT | Blacklist on DB + blockchain |
| PATCH | `/api/admin/unblacklist/:id` | Admin JWT | Restore eligibility |
| PATCH | `/api/admin/resync-did/:id` | Admin JWT | Re-push DID to blockchain |
| GET | `/api/admin/fraud-logs` | Admin JWT | All fraud logs |
| POST | `/api/admin/report-fraud/:id` | Admin JWT | Report fraud to blockchain |
| GET | `/api/admin/vote-analytics` | Admin JWT | Votes, turnout, topRiskStudents |
| GET | `/api/admin/voter-status/:id` | Admin JWT | Blockchain status + ZKP proof |
| POST | `/api/admin/toggle-election` | Superadmin JWT | Open/close election |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Installation

```bash
# Clone
git clone https://github.com/chaitu-ux/E-voting-System.git
cd E-voting-System

# Root dependencies (Hardhat)
npm install

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment Setup

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/evoting
PORT=5000
JWT_SECRET=your_jwt_secret_key

# Email (OTP delivery)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Blockchain
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<paste after deploy>
DID_SALT=evoting_did_salt_2024
```

### Run the Application

```bash
# Terminal 1 — Hardhat local blockchain (keep running)
npx hardhat node

# Terminal 2 — Deploy contract (run once after Terminal 1 starts)
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
# Copy the printed address into CONTRACT_ADDRESS in .env

# Terminal 3 — Backend
cd backend && node server.js

# Terminal 4 — Frontend
cd frontend && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Public Verifier | http://localhost:5173/verify |
| Sidechain Checkpoint API | http://localhost:5000/api/voter/sidechain-checkpoints |

---

## 🧪 End-to-End Test Checklist

```
1.  Admin → Toggle election OPEN

2.  Register Student 1 → verify OTP → admin approves
    → DID registered on-chain ✅

3.  Student 1 → commits vote (Phase 1)
    → commitmentHash on blockchain ✅

4.  Student 1 → reveals vote (Phase 2)
    → terminal: "✅ Merkle root anchored on-chain" ✅
    → terminal: "⛓️  Sidechain checkpoint #1 saved — 1 votes, trigger: auto" ✅

5.  Repeat for Student 2 and Student 3
    → checkpoint #2 and #3 created automatically ✅

6.  Admin → Analytics → Merkle panel
    → 3 votes, DB Root == On-chain Root (green banner) ✅

7.  Admin → Analytics → Sidechain Checkpoint Ledger
    → Total Checkpoints: 3, all triggeredBy: auto ✅
    → Table shows #1 (1 vote), #2 (2 votes), #3 (3 votes) ✅

8.  Admin → Click Re-Anchor button
    → terminal: "⛓️  Sidechain checkpoint #4 saved — trigger: manual" ✅
    → Sidechain panel shows new entry with orange "manual" badge ✅

9.  Browser → http://localhost:5000/api/voter/sidechain-checkpoints
    → Returns JSON with totalCheckpoints and full checkpoint array ✅

10. Student 1 → Verify My Vote → enter verificationCode
    → candidate name, TX hash, proof.verified = true ✅

11. Open /verify → paste any commitmentHash
    → proof shown, no login required ✅

12. Test fraud: wrong OTP 3 times → Student auto-blacklisted ✅

13. Admin → Fraud tab → Risk leaderboard updated ✅
```

---

## 📜 Smart Contract Reference

```solidity
// DID Management
function registerVoterDID(bytes32 _didHash) public
function setVoterEligibility(bytes32 _didHash, bool _eligible) public
function getVoterStatus(bytes32 _didHash) public view
    returns (bool registered, bool eligible, bool voted, bool blacklisted, uint fraudScore)

// Commit-Reveal Voting
function commitVote(bytes32 _didHash, bytes32 _commitmentHash) public
function revealVote(bytes32 _didHash, uint _candidateId, bytes32 _nonce) public

// Merkle Anchoring (used for both Layer-2 and Sidechain checkpoints)
function anchorOffChainData(bytes32 _dataRoot) public
function verifyOffChainRecord(bytes32 _recordHash, bytes32[] memory _proof) public view returns (bool)
function latestOffChainDataRoot() public view returns (bytes32)
function anchorCount() public view returns (uint)
function lastAnchorBlock() public view returns (uint)

// Fraud Control
function blacklistVoter(bytes32 _didHash, string _reason) public
function reportFraud(bytes32 _didHash, string _reason) public
```

---

## ⚠️ Limitations and Future Work

### Current Limitations

#### 1. ZKP-Inspired, Not Formal Zero-Knowledge Proofs

The system implements a **commit–reveal scheme inspired by ZKP concepts** — not formal zero-knowledge proof protocols (zk-SNARKs, zk-STARKs, Groth16, PLONK).

| What is implemented | What full ZKP would additionally require |
|---|---|
| `commitmentHash = keccak256(DID, candidateId, nonce)` | A formal ZK circuit (e.g. circom) |
| Phase 1 hides choice; Phase 2 reveals and verifies | Client-side proof generation via snarkjs |
| Proves voter knew their choice at commit time | On-chain ZK verifier contract |

The commit–reveal approach achieves the core privacy goal at a practical level appropriate for university elections. Full zk-SNARK integration is planned as future work.

#### 2. Private Development Network — Not a Production Sidechain

The system runs on a **local Hardhat node** demonstrating both the Layer-2 and sidechain checkpoint patterns. This is not a production deployment.

| Current | Future Work |
|---|---|
| Hardhat local node (`http://127.0.0.1:8545`) | Permissioned consortium chain (Besu, Quorum) |
| Single wallet, `.env` private key | HSM / vault-based key management |
| Sidechain checkpoint pattern demonstrated locally | Deployment on Polygon PoS as a recognised sidechain |
| Layer-2 inspired Merkle anchor pattern | Deployment on Arbitrum or Optimism |

Migrating to production requires only updating `CONTRACT_ADDRESS`, `PRIVATE_KEY`, and adding `RPC_URL` to `.env`.

#### 3. Rule-Based Fraud Detection — Not ML-Based

Fraud detection uses **deterministic rule-based heuristics**, not machine learning. This is intentional — election fraud decisions must be auditable and explainable, which ML black-box models cannot guarantee.

#### 4. Single Active Election

One election is supported at a time. Multi-election support is future work.

#### 5. No Production Key Management

Private key in `.env` is for development only. Production requires HSM or secrets vault.

---

### Future Work Roadmap

| Priority | Enhancement | Description |
|---|---|---|
| High | Production sidechain deployment | Deploy to Polygon PoS as a recognised sidechain |
| High | Production private chain | Deploy to Hyperledger Besu or Quorum consortium |
| High | Formal ZKP integration | zk-SNARK eligibility proofs via circom + snarkjs |
| High | HSM key management | Replace `.env` key with vault-based signing |
| Medium | ML fraud analytics | Anomaly detection layer on top of existing rules |
| Medium | Multi-election support | Concurrent elections with independent pools |
| Medium | Mobile application | React Native student portal |
| Low | Formal security audit | Third-party penetration testing |
| Low | Gas optimisation | Batch Merkle anchoring to reduce transaction costs |

---

## 👤 User Roles

### Student
- Register + email OTP verification
- Wait for admin approval (DID registered on-chain)
- Vote in two phases (commit → reveal)
- Verify vote using personal verification code
- Apply as election candidate, view live results

### Admin
- Approve / reject / blacklist / unblacklist students
- View fraud logs with severity, IP, and risk scores
- View Merkle tree integrity panel (sync status, re-anchor)
- View Sidechain Checkpoint Ledger (checkpoint history, trigger type)
- View ZKP proof for any voter in the status modal
- Report fraud to blockchain, toggle election

### Superadmin
- All admin privileges
- Create and manage admin accounts
- Transfer superadmin role

---

## 🐛 Implementation Notes

- **Nonce management** — Every Ethereum TX fetches a fresh nonce. Auto-retry on `NONCE_EXPIRED`. Queue resets after failure to prevent deadlocks.
- **DB-first pattern** — MongoDB is always saved before any blockchain call. If blockchain fails, vote is preserved. System is non-blocking throughout.
- **Auto-heal DID** — `commit-vote` automatically re-registers DID and sets eligibility if missing. Handles Hardhat restart scenarios gracefully.
- **Rate limiting** — Separate limiters for auth, status polling, and voting prevent abuse while avoiding 429 errors in normal usage.
- **Sidechain checkpoint non-fatal** — If the checkpoint save to MongoDB fails after a successful anchor, the anchor result is still returned. The checkpoint ledger failure never blocks voting.
- **Dual trigger support** — Checkpoints are created automatically on every `reveal-vote` (`triggeredBy: "auto"`) and also when admin clicks Re-Anchor (`triggeredBy: "manual"`), keeping the ledger complete.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Chaitanya** — MCA Final Year Project  
GitHub: [chaitu-ux](https://github.com/chaitu-ux/E-voting-System)
