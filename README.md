# 🗳️ University Blockchain E-Voting System

A decentralized electronic voting system for university student elections using **React**, **Node.js/Express**, **MongoDB**, and **Ethereum (Hardhat + Solidity)**.  
It combines a modern web stack with smart contracts to provide transparent, tamper-resistant, and privacy-preserving elections.

---

## 📋 Project Overview

This E-Voting System enables universities to run secure student elections with:

- **Transparency**: Votes and final results are cryptographically verifiable on-chain
- **Security**: Multi-factor authentication and fraud detection keep accounts safe
- **Privacy**: Commit–reveal voting and DID hashes hide who voted for whom
- **Integrity**: Merkle-root anchoring ties off-chain vote records to on-chain proofs
- **Usability**: Web-based portals for students, admins, and superadmins

Core capabilities:

- Student registration, login, and multi-factor authentication (password + OTP + DID)
- Candidate application (photo + manifesto) and admin approval
- Commit–reveal blockchain voting with end-to-end verification codes
- Real-time results dashboards with charts for students and admins
- Admin and superadmin consoles for managing elections, users, and fraud logs

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  • Student portal (register, vote, verify, results)            │
│  • Admin & Superadmin dashboards                               │
│  • Tailwind UI + Framer Motion animations                      │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express 5)              │
│  • REST API with JWT-authenticated routes                      │
│  • MongoDB via Mongoose models (Student, Candidate, Election,  │
│    Voter, FraudLog, Admin)                                     │
│  • OTP email delivery and fraud/risk scoring                   │
│  • Ethers.js integration with Ethereum smart contract          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN (Ethereum / Hardhat)               │
│  • Solidity Voting.sol contract                                │
│  • DID-style identity (hashed student IDs)                     │
│  • Commit–reveal voting with on-chain receipts                 │
│  • Merkle-root anchoring for off-chain votes                   │
│  • On-chain fraud reporting and blacklisting                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.x | UI framework |
| **React Router DOM** | 7.x | Client-side routing |
| **Axios** | 1.x | HTTP client for API calls |
| **Tailwind CSS** | 3.x | Styling |
| **Framer Motion** | 12.x | Page and component animations |
| **React Hot Toast** | 2.x | Toast notifications |
| **React Confetti** | 6.x | Success celebrations |
| **Chart.js** + `react-chartjs-2` | 4.x | Analytics and results charts |
| **React Loader Spinner** | 8.x | Loading indicators |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 5.x | Web framework |
| **MongoDB** | - | Database |
| **Mongoose** | 9.x | ODM for MongoDB |
| **JSON Web Token (JWT)** | 9.x | Authentication |
| **bcryptjs** | 3.x | Password hashing |
| **Nodemailer** | 8.x | OTP email delivery |
| **Multer** | 2.x | Candidate photo uploads |
| **Helmet** | 8.x | Security headers |
| **express-rate-limit** | 7.x | Rate limiting (auth/status/vote) |
| **Ethers.js** | 6.x | Ethereum interaction |
| **merkletreejs** | - | Merkle-tree based vote anchoring |

### Blockchain / Tooling

| Technology | Purpose |
|-----------|---------|
| **Solidity 0.8.20** | Smart contract language (`Voting.sol`) |
| **Hardhat** | Ethereum development environment |
| **Ethers.js v6** | Contract deployment and calls |
| **TypeScript** | Hardhat scripts and typings |
| **typechain-types** | Generated contract typings |

---

## 📁 Project Structure (Key Folders)

```text
E-votingSystem/
├── backend/                  # Node.js backend API
│   ├── models/               # MongoDB models
│   │   ├── Admin.js
│   │   ├── Candidate.js
│   │   ├── Election.js
│   │   ├── FraudLog.js
│   │   ├── Student.js
│   │   └── Voter.js
│   ├── routes/               # Express route handlers
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── candidateRoutes.js
│   │   ├── register.js         # Legacy public registration
│   │   ├── verifyEligibility.js# Legacy eligibility check
│   │   └── voterRoutes.js
│   ├── middleware/           # Auth & upload middleware
│   │   ├── authMiddleware.js
│   │   ├── studentAuthMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── server.js             # Express app entrypoint
│   └── package.json
│
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api.js
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── SuperAdminDashboard.jsx
│   │   │   └── student/
│   │   │       ├── CandidateApply.jsx
│   │   │       ├── OtpVerification.jsx
│   │   │       ├── ResultsPage.jsx
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── StudentLogin.jsx
│   │   │       ├── StudentRegister.jsx
│   │   │       ├── SuccessPage.jsx
│   │   │       ├── VotePage.jsx
│   │   │       └── WinnerPage.jsx
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── contracts/
│   └── Voting.sol            # Ethereum voting contract
├── scripts/
│   └── deploy.ts             # Hardhat deployment script
├── typechain-types/          # Generated contract typings
├── hardhat.config.ts         # Hardhat configuration
├── package.json              # Root (Hardhat/tooling) package.json
└── tsconfig.json             # TypeScript configuration
```

---

## 🔐 Identity, Privacy, and Security Model

### Decentralized Identity (DID-style)

- Each voter is represented by a **DID-like identifier**:
  - `didHash = keccak256(studentId + DID_SALT)`
  - `did = "did:university:" + didHash`
- Only hashed identifiers are used on-chain; personal data stays in MongoDB.
- The backend recomputes and validates DID hashes during auth and voting.

### Commit–Reveal Voting (ZKP-Inspired)

- **Phase 1 – Commit**:
  - Student submits `commitmentHash = keccak256(didHash, candidateId, nonce)` via `/api/voter/commit-vote`.
  - Contract stores the commitment only (no plaintext vote).
- **Phase 2 – Reveal**:
  - Student later calls `/api/voter/reveal-vote` with `candidateId` and `nonce`.
  - Contract recomputes the hash and verifies it matches the stored commitment before counting the vote.
- This proves a valid vote was cast while hiding which candidate a specific voter chose.

### Multi-Factor Authentication

1. **Password** – bcrypt-hashed password verified at login.
2. **OTP** – 6-digit code emailed via Nodemailer, short-lived expiry.
3. **DID** – on-chain identity verification, tied to eligibility.

Student-facing flows and admin actions are additionally protected by:

- **JWT authentication** for both students and admins.
- **Role-based access control** for admin/superadmin routes.
- **Rate limiting**:
  - Global: 500 requests / 15 min
  - Auth: 50 requests / 15 min
  - Status: 300 requests / 15 min
  - Vote: 20 requests / 15 min

### Fraud Detection & Risk Scoring

- Tracks:
  - Rapid login/vote attempts
  - Suspicious IPs per student
  - Risk scores per student and event logs
- Automatically:
  - Logs suspicious events in `FraudLog`
  - Raises risk scores and can **blacklist** students at thresholds
  - Reports severe fraud to the smart contract (on-chain evidence)

### Merkle-Root Anchoring & Integrity

- Off-chain `Voter` records for revealed votes are periodically:
  - Aggregated into a Merkle tree via `merkletreejs`
  - Anchored on-chain by storing the Merkle root in `Voting.sol`
- Verifiers can:
  - Fetch the Merkle root and proofs via backend endpoints
  - Recompute proofs and cross-check with on-chain roots for integrity

---

## 📱 Main Application Flows

### Student Journey (End-to-End)

1. **Registration**
   - Use the student registration page (`/student/register`).
   - Backend creates a `Student` with pending status and hashed password.
2. **Login + MFA**
   - Login with student ID + password → `/api/auth/login` (Factor 1).
   - Receive OTP via email and submit it → `/api/auth/verify-otp` (Factor 2).
   - DID is validated or registered on-chain as part of subsequent flows (Factor 3).
3. **Admin Approval**
   - Admin approves the student; DID is registered and marked eligible on-chain.
4. **Optional: Apply as Candidate**
   - From the student dashboard, apply with manifesto and photo → `/student/apply`.
5. **Voting (Commit–Reveal)**
   - **Phase 1 – Commit**: Choose candidate and commit vote.
   - **Phase 2 – Reveal**: Confirm and reveal vote, get a verification code.
6. **End-to-End Verification**
   - Use the verification code in the dashboard or results pages to:
     - Check vote inclusion in the Merkle tree.
     - Confirm consistency between DB and blockchain.

### Admin & Superadmin Flows

- **Admin**
  - Login via `/admin`.
  - Manage students (approve/reject/blacklist/unblacklist/delete).
  - Approve or reject candidate applications.
  - View detailed analytics: turnout, results, fraud statistics.
  - Monitor fraud logs and, if needed, report fraud on-chain.

- **Superadmin**
  - All admin capabilities, plus:
  - Create and manage other admin accounts.
  - Toggle the election (open/close) and read final winner from contract.
  - Configure system-wide aspects related to elections and admins.

---

## 📡 API Overview (Selected Endpoints)

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register-student` | Register a student with credentials |
| POST | `/api/auth/login` | Password login, issues OTP |
| POST | `/api/auth/send-otp` | Re-send OTP (if supported) |
| POST | `/api/auth/verify-otp` | Verify OTP and issue JWT |
| POST | `/api/auth/verify-did` | Verify DID identity on-chain |
| POST | `/api/auth/logout` | Clears MFA session state |

### Voter

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voter/status` | Get eligibility / vote status |
| POST | `/api/voter/commit-vote` | Commit vote (phase 1) |
| POST | `/api/voter/reveal-vote` | Reveal vote (phase 2) |
| POST | `/api/voter/verify-my-vote` | Verify own vote via code |
| GET | `/api/voter/verify-receipt/:code` | Public receipt verification |
| GET | `/api/voter/results` | Aggregated election results |
| GET | `/api/voter/winner` | Election winner (DB + chain) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/setup` | One-time superadmin creation |
| POST | `/api/admin/login` | Admin/superadmin login |
| POST | `/api/admin/create` | Create admin (superadmin-only) |
| GET | `/api/admin/all` | List admins |
| DELETE | `/api/admin/delete/:id` | Delete admin |
| PATCH | `/api/admin/transfer-superadmin/:id` | Transfer superadmin role |
| GET | `/api/admin/students` | List students |
| PATCH | `/api/admin/approve/:id` | Approve student + register DID |
| PATCH | `/api/admin/reject/:id` | Reject student |
| PATCH | `/api/admin/blacklist/:id` | Blacklist student |
| PATCH | `/api/admin/unblacklist/:id` | Remove blacklist |
| DELETE | `/api/admin/delete-student/:id` | Delete student |
| POST | `/api/admin/toggle-election` | Open/close election (and sync chain) |
| GET | `/api/admin/election-result` | Election result (admin view) |
| GET | `/api/admin/fraud-logs` | Fraud logs listing |
| POST | `/api/admin/report-fraud/:studentId` | Report fraud on-chain |
| GET | `/api/admin/vote-analytics` | Vote and risk analytics |
| GET | `/api/admin/voter-status/:studentId` | Blockchain voter status |

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Legacy/basic registration endpoint |
| GET | `/api/election-status` | Check if an election is open |
| GET | `/api/health` | Health check for monitoring |

---

## 📊 Feature Summary

### Core Features

- Student registration and secure login
- 3-factor authentication (password + OTP + DID)
- Student dashboard with election status and verification tools
- Candidate application workflow with admin approval
- Commit–reveal blockchain voting
- End-to-end verifiable receipts and Merkle proofs
- Real-time results and winner pages
- Admin and Superadmin dashboards

### Security & Reliability Features

- JWT-based auth for students and admins
- Granular rate limiting for auth, status, and voting endpoints
- Fraud detection (rapid attempts, IP correlation)
- Risk scoring and automatic blacklisting
- On-chain fraud reporting and blacklisting
- Auto-healing Ethereum transactions with nonce management

### Technical / UX Features

- RESTful API with clear role separation
- MongoDB persistence with rich models and indexes
- Tailwind-based responsive UI with animations
- File upload support for candidate photos
- Hardhat local blockchain environment and scripts

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB** (local `mongod` or Atlas)
- **Hardhat** (installed via dev dependencies)

### 1. Clone the Repository

```bash
git clone <your-repo-url>.git
cd E-votingSystem
```

### 2. Install Dependencies

```bash
# Root (Hardhat/tooling)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/evoting
PORT=5000
JWT_SECRET=your_jwt_secret_key_here

# Email (OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Blockchain
PRIVATE_KEY=your_ethereum_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
DID_SALT=evoting_did_salt_2024
```

Notes:

- `PRIVATE_KEY` should correspond to an account funded on the Hardhat network.
- `CONTRACT_ADDRESS` will be filled after deployment in the next step.

### 4. Start Blockchain and Deploy Contract

In the project root:

```bash
# Terminal 1 – start local node
npx hardhat node

# Terminal 2 – compile & deploy
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed `Voting` contract address into `CONTRACT_ADDRESS` in `backend/.env`.

### 5. Start Backend

```bash
cd backend
npm start        # or: npm run dev (if nodemon configured)
```

Backend runs at `http://localhost:5000`.

### 6. Start Frontend

```bash
cd frontend
npm start
```

Frontend runs at `http://localhost:3000`.

---

## 🧪 Manual Test Scenarios

### First-Time Admin Setup

1. Open `http://localhost:3000`.
2. Select **Admin** role and use the superadmin setup/login flow.
3. From the Superadmin dashboard:
   - Create additional admin accounts if needed.
   - Use **Toggle Election** to open an election.

### Student Registration & Voting

1. Select **Student** role.
2. Register with your student details and password.
3. Log in with student ID + password.
4. Enter the OTP received via email.
5. Wait for admin approval.
6. Optionally apply as a candidate.
7. When the election is open:
   - Commit your vote.
   - Reveal your vote.
8. Save your verification code and use the verification section to confirm your vote.

---

## 🐛 Notable Fixes & Implementation Notes

- **Nonce/Transaction Handling**
  - Every Ethereum transaction fetches a fresh nonce.
  - Automatic retry on nonce-related failures to avoid `NONCE_EXPIRED` errors.
  - Transaction queues are reset safely to avoid deadlocks.
- **Rate-Limit Tuning**
  - Separate limiters for auth, status polling, and voting to prevent 429s in normal usage.
- **Auto-Healing DID Registration**
  - Voting endpoints auto-register DIDs and eligibility on-chain when missing.
  - Prevents failures when admin/chain operations fall briefly out of sync.
- **Schema/Index Clean-Up**
  - Removed redundant indexes where `unique: true` already implied them.

---

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -m 'Add my feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Chaitanya**  
- GitHub: `https://github.com/chaita-ux`  
- MCA Final Year Project

---

## 📈 System Diagrams (Conceptual)

### Student Voting Process

```text
Login (password)
   ↓
OTP verification (email)
   ↓
Admin approval + DID registration
   ↓
Dashboard (apply as candidate / vote / results)
   ↓
Commit vote (hash on-chain)
   ↓
Reveal vote (count on-chain)
   ↓
Verification code (E2E check)
```

### Blockchain Interactions (High Level)

```text
Admin:   registerVoterDID
         setVoterEligibility
         toggleElection
         reportFraud
         blacklistVoter

Student: commitVote
         revealVote
         verifyMyVote / verifyReceiptExists
```


