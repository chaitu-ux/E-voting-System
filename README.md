# 🗳️ University Blockchain E-Voting System

A decentralized electronic voting system built for university student elections using **Blockchain technology**, **React**, **Node.js**, and **MongoDB**. The system ensures transparency, security, and tamper-proof voting through Ethereum smart contracts.

---

## 📋 Project Overview

This E-Voting System is designed to conduct fair and transparent student elections in universities. It combines traditional web technologies with blockchain to ensure:

- **Transparency**: All votes are recorded on the blockchain and can be verified
- **Security**: Cryptographic hashing protects student identities
- **Anti-Fraud**: Blockchain prevents vote tampering
- **Accessibility**: Web-based interface for easy participation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  • Student Portal (Vote, Register, View Results)              │
│  • Admin Dashboard (Manage Elections, Candidates, Voters)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express)                 │
│  • REST API Endpoints                                          │
│  • MongoDB Database                                            │
│  • JWT Authentication                                          │
│  • OTP Verification                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN (Ethereum/Hardhat)                 │
│  • Smart Contract (Voting.sol)                                 │
│  • Vote Recording                                              │
│  • Winner Calculation                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **React Router DOM** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **React Hot Toast** | Toast notifications |
| **React Confetti** | Celebration effects |
| **Chart.js** | Results visualization |
| **React Loader Spinner** | Loading states |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | Database |
| **Mongoose** | ODM for MongoDB |
| **JSON Web Token (JWT)** | Authentication |
| **Bcryptjs** | Password hashing |
| **Nodemailer** | Email sending (OTP) |
| **Multer** | File uploads |
| **CORS** | Cross-origin resource sharing |
| **Ethers.js** | Ethereum blockchain interaction |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Solidity** | Smart contract language |
| **Hardhat** | Ethereum development environment |
| **Ethers.js** | Blockchain interaction library |
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
│   Registration │ ────► Enter Student Details
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OTP Verification│ ────► Verify Email
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Approval │ ────► Wait for Eligibility
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
│   Cast Vote     │ ────► Blockchain Transaction
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
│   │   ├── FraudLog.js      # Fraud detection log
│   │   ├── Student.js        # Student/Voter schema
│   │   └── Voter.js          # Voter schema
│   ├── routes/               # API Routes
│   │   ├── adminRoutes.js   # Admin endpoints
│   │   ├── authRoutes.js    # Authentication
│   │   ├── candidateRoutes.js
│   │   ├── register.js      # Student registration
│   │   ├── verifyEligibility.js
│   │   └── voterRoutes.js   # Voting endpoints
│   ├── middleware/           # Middleware
│   │   ├── authMiddleware.js
│   │   ├── studentAuthMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── uploads/             # File uploads
│   │   └── candidates/     # Candidate images
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
│   │   │   └── student/    # Student pages
│   │   │       ├── CandidateApply.jsx
│   │   │       ├── OtpVerification.jsx
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

## 🔐 Smart Contract Features

The **Voting.sol** smart contract provides:

1. **Candidate Management**
   - Add candidates dynamically
   - Track vote counts per candidate

2. **Voting Mechanism**
   - Hash-based voter identity (privacy)
   - One vote per student (prevent double voting)
   - Real-time vote recording

3. **Winner Determination**
   - Automatic winner calculation
   - View current vote standings

4. **Events**
   - `VoteCast` event for vote tracking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   
```
bash
   git clone https://github.com/chaitu-ux/E-voting-System.git
   cd E-voting-System
   
```

2. **Install Root Dependencies**
   
```
bash
   npm install
   
```

3. **Install Backend Dependencies**
   
```
bash
   cd backend
   npm install
   
```

4. **Install Frontend Dependencies**
   
```
bash
   cd ../frontend
   npm install
   
```

### Configuration

1. **Backend Environment Variables** (`backend/.env`)
   
```
env
   MONGO_URI=mongodb://localhost:27017/evoting
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   
```

2. **Deploy Smart Contract** (Optional - for blockchain)
   
```
bash
   npx hardhat compile
   npx hardhat run scripts/deploy.ts
   
```

### Running the Application

1. **Start Backend**
   
```
bash
   cd backend
   npm start
   
```
   Backend runs on `http://localhost:5000`

2. **Start Frontend**
   
```
bash
   cd frontend
   npm start
   
```
   Frontend runs on `http://localhost:3000`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Student registration |
| POST | `/api/student/login` | Student login |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/verify-otp` | Verify OTP |

### Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vote` | Cast a vote |
| GET | `/api/results` | Get election results |
| GET | `/api/winner` | Get winner |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | List all students |
| PUT | `/api/admin/approve/:id` | Approve student |
| POST | `/api/admin/election` | Create election |
| GET | `/api/admin/results` | View results |

---

## 🔒 Security Features

1. **JWT Authentication** - Secure admin and student sessions
2. **OTP Verification** - Email-based identity verification
3. **Password Hashing** - Bcrypt encryption
4. **Blockchain Immutability** - Votes cannot be altered
5. **Hash-based Identity** - Student privacy maintained
6. **Role-based Access** - Admin and student permissions

---

## 🖥️ User Roles

### Student
- Register and verify email
- Apply as candidate
- View election candidates
- Cast vote (one per election)
- View results

### Admin
- Manage elections
- Approve/reject students
- Add/remove candidates
- View voting results
- Monitor fraud attempts

### Super Admin
- All admin privileges
- Manage other admins
- System-wide settings

---

## 📊 Features

- ✅ Student Registration & Login
- ✅ OTP Email Verification
- ✅ Admin Dashboard
- ✅ Super Admin Dashboard
- ✅ Candidate Application
- ✅ Blockchain-based Voting
- ✅ Real-time Results
- ✅ Winner Announcement
- ✅ Vote History
- ✅ Fraud Detection
- ✅ Responsive Design
- ✅ Modern UI with Animations

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
- GitHub: [chaitu-ux](https://github.com/chaitu-ux)

---

## 🙏 Acknowledgments

- MongoDB for database
- Ethereum for blockchain
- React community
