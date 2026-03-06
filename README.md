# 🗳️ University Blockchain E-Voting System

A decentralized electronic voting system built for university student elections using **Blockchain technology**, **React**, **Node.js**, and **MongoDB**. The system ensures transparency, security, and tamper-proof voting through Ethereum smart contracts with advanced privacy features.

---

## 📋 Project Overview

This E-Voting System is designed to conduct fair and transparent student elections in universities. It combines traditional web technologies with blockchain to ensure:

- **Transparency**: All votes are recorded on the blockchain and can be verified
- **Security**: Cryptographic hashing protects student identities
- **Privacy**: ZKP-inspired commit-reveal scheme hides votes until verification
- **Anti-Fraud**: Blockchain prevents vote tampering with fraud detection
- **Accessibility**: Web-based interface for easy participation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  • Student Portal (Vote, Register, View Results)              │
│  • Admin Dashboard (Manage Elections, Candidates, Voters)     │
│  • Real-time Updates with Framer Motion Animations             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express 5)              │
│  • REST API Endpoints                                          │
│  • MongoDB Database with Mongoose ODM                          │
│  • JWT Authentication                                          │
│  • OTP Email Verification                                      │
│  • Ethers.js Blockchain Integration                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN (Ethereum/Hardhat)                 │
│  • Smart Contract (Voting.sol) - Solidity 0.8.20             │
│  • DID-inspired Identity Management                           │
│  • Commit-Reveal Voting (ZKP-inspired Privacy)                │
│  • E2E Vote Verification                                        │
│  • On-chain Fraud Detection                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Advanced Blockchain Features

### 1. DID-Inspired Decentralized Identity
- Each voter is represented by a **DID (Decentralized Identifier)** = `keccak256(studentId + secret salt)`
- Personal data never touches the blockchain — only identity commitments
- Backend verifies identity off-chain; only DID hash stored on-chain

### 2. ZKP-Inspired Privacy (Commit-Reveal Scheme)
- **Phase 1 - Commit**: Voter submits `keccak256(didHash + candidateId + nonce)`
- **Phase 2 - Reveal**: Voter reveals actual vote; contract verifies against commitment
- Proves voter knew their choice without revealing WHO voted for WHOM

### 3. E2E Verifiable Voting
- Every voter receives a unique **verificationCode** after voting
- Voters can independently confirm their vote is correctly recorded
- Privacy maintained — only the voter knows their verification code

### 4. On-Chain Fraud Detection
- Double vote prevention (hasVoted mapping)
- Commitment-without-reveal detection (time-based)
- Fraud scoring system with automatic blacklisting
- All suspicious activities emit events for monitoring

### 5. Layer-2 Inspired Architecture
- Only cryptographic proofs & vote counts stored on-chain
- Full voter data, candidate profiles, images stored off-chain (MongoDB)
- Merkle-root style batch proofs anchor off-chain data integrity

---

## 🛠️ Technologies Used

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Framework |
| **React Router DOM** | 7.x | Client-side routing |
| **Axios** | 1.x | HTTP client for API calls |
| **Tailwind CSS** | 3.x | Styling |
| **Framer Motion** | 12.x | Animations |
| **React Hot Toast** | 2.x | Toast notifications |
| **React Confetti** | 6.x | Celebration effects |
| **Chart.js** | 4.x | Results visualization |
| **React Loader Spinner** | 8.x | Loading states |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 5.x | Web framework |
| **MongoDB** | - | Database |
| **Mongoose** | 9.x | ODM for MongoDB |
| **JSON Web Token (JWT)** | 9.x | Authentication |
| **Bcryptjs** | 3.x | Password hashing |
| **Nodemailer** | 8.x | Email sending (OTP) |
| **Multer** | 2.x | File uploads |
| **Helmet** | 8.x | Security headers |
| **Express Rate Limit** | 7.x | Rate limiting |
| **Ethers.js** | 6.x | Ethereum blockchain interaction |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Solidity 0.8.20** | Smart contract language |
| **Hardhat** | Ethereum development environment |
| **Ethers.js v6** | Blockchain interaction library |
| **TypeScript** | Type-safe development |

---

## 📱 Application Flow

### Student Flow
```
┌─────────────────┐
│  Role Selection │ ────► Choose Student
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Registration │ ────► Enter Student Details + Password
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Login        │ ────► Password Verification (Factor 1)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OTP Verification│ ────► Email OTP (Factor 2)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Approval │ ────► Approve + Register DID on Chain
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Dashboard    │ ────► View Options
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│ Apply │ │  View    │
│Candidate│ │ Results │
└───────┘ └──────────┘
    │
    ▼
┌─────────────────┐
│   Commit Vote   │ ────► Submit Commitment Hash
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Reveal Vote  │ ────► Verify Commitment + Record
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get Verify Code│ ────► E2E Vote Verification
└─────────────────┘
```

### Admin Flow
```
┌─────────────────┐
│  Role Selection │ ────► Choose Admin
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Login       │ ────► Authenticate
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Dashboard    │
└────────┬────────┘
         │
    ┌────┴────────────────┐
    ▼                     ▼
┌─────────┐         ┌────────────┐
│Manage   │         │  Super     │
│Elections│         │  Admin     │
└─────────┘         └────────────┘
    │
    ▼
┌─────────────────┐
│ • Create Election│
│ • Approve Voters │
│ • Add Candidates │
│ • View Results   │
│ • Monitor Fraud  │
└─────────────────┘
```

---

## 📁 Project Structure

```
E-votingSystem/
├── backend/                    # Node.js Backend
│   ├── models/                # MongoDB Models
│   │   ├── Admin.js          # Admin schema
│   │   ├── Candidate.js      # Candidate schema
│   │   ├── Election.js       # Election schema
│   │   ├── FraudLog.js       # Fraud detection log
│   │   ├── Student.js        # Student/Voter schema
│   │   └── Voter.js          # Vote records schema
│   ├── routes/               # API Routes
│   │   ├── adminRoutes.js    # Admin endpoints
│   │   ├── authRoutes.js     # Authentication & MFA
│   │   ├── candidateRoutes.js
│   │   ├── register.js       # Student registration
│   │   ├── verifyEligibility.js
│   │   └── voterRoutes.js    # Voting endpoints
│   ├── middleware/           # Middleware
│   │   ├── authMiddleware.js
│   │   ├── studentAuthMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── uploads/             # File uploads
│   │   └── candidates/      # Candidate images
│   ├── server.js            # Main server file
│   └── package.json
│
├── frontend/                 # React Frontend
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── api.js          # API configuration
│   │   ├── components/     # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── admin/      # Admin pages
│   │   │   │   ├── AdminLogin.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── SuperAdminDashboard.jsx
│   │   │   └── student/     # Student pages
│   │  Apply.jsx
 │       ├── Candidate│   │   │       ├── OtpVerification.jsx
│   │   │       ├── ResultsPage.jsx
│   │   │       ├── StudentDashboard.jsx
│   │   │       ├── StudentLogin.jsx
│   │   │       ├── StudentRegister.jsx
│   │   │       ├── SuccessPage.jsx
│   │   │       ├── VotePage.jsx
│   │   │       └── WinnerPage.jsx
│   │   ├── App.js          # Main app component
│   │   ├── index.js        # Entry point
│   │   └── index.css       # Global styles
│   └── package.json
│
├── contracts/                # Smart Contracts
│   └── Voting.sol           # Ethereum Voting Contract
│
├── scripts/                  # Deployment Scripts
│   └── deploy.ts            # Hardhat deployment script
│
├── typechain-types/          # Generated TypeScript types
├── hardhat.config.ts        # Hardhat configuration
├── package.json             # Root package.json
└── tsconfig.json            # TypeScript configuration
```

---

## 🔒 Security Features

### Multi-Factor Authentication
1. **Factor 1**: Password (bcrypt hashed)
2. **Factor 2**: OTP (6-digit, 5-minute expiry, email delivery)
3. **Factor 3**: DID Identity Verification (on-chain)

### Rate Limiting
- **Global**: 500 requests/15 min
- **Auth**: 50 requests/15 min (login/OTP)
- **Status**: 300 requests/15 min (dashboard polling)
- **Vote**: 20 requests/15 min (commit/reveal)

### Blockchain Security
- **Fresh Nonce Management**: Every transaction gets a fresh nonce to prevent NONCE_EXPIRED errors
- **Auto-Healing**: Failed blockchain calls auto-retry with fresh nonce
- **Dual Source of Truth**: Database is primary, blockchain is enhancement

### Fraud Prevention
- Rapid attempt detection
- IP tracking with suspicious list
- Risk scoring system
- Automatic blacklisting at threshold
- On-chain fraud reporting

---

## 🖥️ User Roles

### Student
- Register with student ID, email, department
- Login with password + OTP verification
- Apply as candidate (with photo & manifesto)
- View election candidates
- Commit & reveal vote (two-phase)
- Verify vote with unique code
- View real-time results

### Admin
- Manage elections (create, toggle open/close)
- Approve/reject students
- Approve/reject candidates
- View voting results & analytics
- Monitor fraud logs
- Report fraud to blockchain

### Super Admin
- All admin privileges
- Create/delete other admins
- Transfer superadmin role
- System-wide settings

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register-student` | Student registration with password |
| POST | `/api/auth/login` | Password verification → sends OTP |
| POST | `/api/auth/send-otp` | Send OTP for voting |
| POST | `/api/auth/verify-otp` | Verify OTP → issue JWT |
| POST | `/api/auth/verify-did` | Verify DID identity (Factor 3) |
| POST | `/api/auth/logout` | Clear MFA session |

### Voter
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voter/status` | Get voter status (eligibility, voted) |
| POST | `/api/voter/register-did` | Register DID on blockchain |
| POST | `/api/voter/set-eligibility` | Set voter eligibility |
| POST | `/api/voter/commit-vote` | Phase 1: Submit vote commitment |
| POST | `/api/voter/reveal-vote` | Phase 2: Reveal and record vote |
| POST | `/api/voter/verify-my-vote` | Verify vote with verification code |
| GET | `/api/voter/verify-receipt/:code` | Check receipt exists |
| GET | `/api/voter/results` | Get election results |
| GET | `/api/voter/winner` | Get election winner |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/setup` | Create superadmin (first time) |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/create` | Create new admin (superadmin only) |
| GET | `/api/admin/all` | List all admins |
| DELETE | `/api/admin/delete/:id` | Delete admin |
| PATCH | `/api/admin/transfer-superadmin/:id` | Transfer superadmin role |
| GET | `/api/admin/students` | List all students |
| PATCH | `/api/admin/approve/:id` | Approve student + register DID |
| PATCH | `/api/admin/reject/:id` | Reject student |
| PATCH | `/api/admin/blacklist/:id` | Blacklist student |
| PATCH | `/api/admin/unblacklist/:id` | Remove blacklist |
| DELETE | `/api/admin/delete-student/:id` | Delete student |
| POST | `/api/admin/toggle-election` | Toggle election open/close |
| GET | `/api/admin/election-result` | Get election result |
| GET | `/api/admin/fraud-logs` | Get fraud logs |
| POST | `/api/admin/report-fraud/:studentId` | Report fraud to blockchain |
| GET | `/api/admin/vote-analytics` | Get vote analytics |
| GET | `/api/admin/voter-status/:studentId` | Get voter blockchain status |

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Public registration endpoint |
| GET | `/api/election-status` | Check if election is open |
| GET | `/api/health` | Health check |

---

## 📊 Features

### Core Features
- ✅ Student Registration & Login
- ✅ 3-Factor Authentication (Password + OTP + DID)
- ✅ Admin Dashboard
- ✅ Super Admin Dashboard
- ✅ Candidate Application with Photo & Manifesto
- ✅ Blockchain-based Voting (Commit-Reveal)
- ✅ Real-time Results with Charts
- ✅ Winner Announcement
- ✅ E2E Vote Verification
- ✅ Vote Verification Codes

### Security Features
- ✅ JWT Authentication
- ✅ Rate Limiting
- ✅ Fraud Detection & Logging
- ✅ Risk Scoring System
- ✅ Automatic Blacklisting
- ✅ On-chain Fraud Reporting
- ✅ IP Tracking

### Technical Features
- ✅ MongoDB Database
- ✅ RESTful API
- ✅ Responsive Design
- ✅ Modern UI with Animations
- ✅ File Upload Support
- ✅ Hardhat Local Network
- ✅ Auto-Healing Blockchain Transactions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/chaitu-ux/E-voting-System.git
cd E-voting-System
```

2. **Install Root Dependencies**
```bash
npm install
```

3. **Install Backend Dependencies**
```bash
cd backend
npm install
```

4. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Configuration

1. **Create Backend Environment File** (`backend/.env`)
```env
MONGO_URI=mongodb://localhost:27017/evoting
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
PRIVATE_KEY=your_ethereum_wallet_private_key
CONTRACT_ADDRESS=deployed_contract_address
DID_SALT=evoting_did_salt_2024
```

2. **Start MongoDB** (if local)
```bash
mongod
```

3. **Deploy Smart Contract**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

### Running the Application

1. **Start Hardhat Local Node** (Terminal 1)
```bash
npx hardhat node
```

2. **Deploy Contract** (Terminal 2)
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
Copy the deployed contract address to your `.env` file.

3. **Start Backend** (Terminal 3)
```bash
cd backend
npm start
```
Backend runs on `http://localhost:5000`

4. **Start Frontend** (Terminal 4)
```bash
cd frontend
npm start
```
Frontend runs on `http://localhost:3000`

---

## 🧪 Testing the Application

### First Time Setup

1. Open `http://localhost:3000`
2. Select **Admin** role
3. Login as admin (or create superadmin first time)
4. Go to Super Admin Dashboard
5. Create additional admins if needed
6. Toggle election to **OPEN**

### Student Registration Flow

1. Select **Student** role
2. Click **Register** 
3. Fill in student details
4. Login with credentials
5. Enter OTP from email
6. Wait for admin approval
7. Once approved, apply as candidate (optional)
8. Vote when election is open
9. Save your verification code

---

## 🐛 Bug Fixes & Improvements

### Known Fixes Implemented

1. **NONCE_EXPIRED Errors**
   - Fresh nonce fetched before every blockchain transaction
   - Auto-retry mechanism with fresh nonce on failure
   - Queue reset after errors to prevent blocking

2. **Rate Limiting Issues**
   - Dashboard polling uses dedicated `statusLimiter` (300/15min)
   - Vote actions use strict `voteLimiter` (20/15min)
   - Prevents 429 errors during normal usage

3. **Auto-Healing DID Registration**
   - Commit-vote automatically registers DID if missing
   - Automatically sets eligibility on-chain
   - Prevents voting failures due to missed registration

4. **Duplicate Index Warnings**
   - Removed duplicate unique indexes in Mongoose schemas
   - Fields with `unique: true` already create indexes

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Chaitanya**
- GitHub: [chaita-ux](https://github.com/chaita-ux)
- MCA Final Year Project

---

## 🙏 Acknowledgments

- MongoDB for database
- Ethereum for blockchain
- React community
- Hardhat team for development tools

---

## 📈 System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STUDENT VOTING PROCESS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  Login   │───▶│  Verify  │───▶│  Check   │───▶│ Commit  │            │
│   │ Password │    │   OTP    │    │   DID    │    │  Vote   │            │
│   └──────────┘    └──────────┘    └──────────┘    └────┬─────┘            │
│        │               │               │                   │                │
│        ▼               ▼               ▼                   ▼                │
│   Factor 1         Factor 2        Factor 3         ┌──────────┐            │
│   (Knowledge)     (Ownership)     (Identity)       │ Reveal  │            │
│                                                    │  Vote   │            │
│                                                    └────┬─────┘            │
│                                                         │                   │
│                                                         ▼                   │
│                                              ┌──────────────────┐           │
│                                              │  Verification   │           │
│                                              │      Code       │           │
│                                              └──────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN TRANSACTIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Admin Actions:                    Student Actions:                        │
│   ────────────────                  ──────────────────                       │
│   • registerVoterDID()         ──▶  • commitVote()                         │
│   • setVoterEligibility()       ──▶  • revealVote()                        │
│   • addCandidate()                 • verifyMyVote()                        │
│   • createElection()              • verifyReceiptExists()                  │
│   • toggleElection()                                                     │
│   • reportFraud()                                                         │
│   • blacklistVoter()                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

