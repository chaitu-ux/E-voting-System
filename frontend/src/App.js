import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";

/* ===============================
   📌 PUBLIC PAGES
================================ */
import RoleSelection from "./pages/RoleSelection";

/* ===============================
   🎓 STUDENT PAGES
================================ */
import StudentLogin from "./pages/student/StudentLogin";
import StudentRegister from "./pages/student/StudentRegister";
import OtpVerification from "./pages/student/OtpVerification";
import VotePage from "./pages/student/VotePage";
import SuccessPage from "./pages/student/SuccessPage";
import ResultsPage from "./pages/student/ResultsPage";
import CandidateApply from "./pages/student/CandidateApply";
import StudentDashboard from "./pages/student/StudentDashboard";
import WinnerPage from "./pages/student/WinnerPage";

/* ===============================
   👤 ADMIN PAGES
================================ */
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";

/* ===============================
   🔐 ROUTE PROTECTION COMPONENTS
================================ */
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

/* ===============================
   🎬 PAGE ANIMATION CONFIG
================================ */

const pageVariants = {
  initial: {
    x: "-100%",
    scale: 0.95,
    opacity: 0,
    filter: "blur(8px)",
  },
  animate: {
    x: 0,
    scale: 1,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    x: "100%",
    scale: 0.95,
    opacity: 0,
    filter: "blur(8px)",
  },
};

const pageTransition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
};

/* ===============================
   🎬 ANIMATED ROUTES WRAPPER
================================ */

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Routes location={location}>
            {/* PUBLIC */}
            <Route path="/" element={<RoleSelection />} />

            {/* STUDENT FLOW */}
            <Route path="/student" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/student/otp" element={<OtpVerification />} />
            <Route path="/student/success" element={<SuccessPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/student/apply" element={<CandidateApply />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/winner" element={<WinnerPage />} />

            <Route
              path="/student/vote"
              element={
                <ProtectedRoute>
                  <VotePage />
                </ProtectedRoute>
              }
            />

            {/* ADMIN FLOW */}
            <Route path="/admin" element={<AdminLogin />} />

            <Route
              path="/admin/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <Dashboard />
                </RoleProtectedRoute>
              }
            />

            <Route
              path="/superadmin/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </RoleProtectedRoute>
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<RoleSelection />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ===============================
   🚀 MAIN APP
================================ */

function App() {
  return (
    <>
      {/* 🔔 Premium Toast System */}
<Toaster
  position="top-right"
  reverseOrder={false}
  gutter={14}
  containerStyle={{
    top: 20,
    right: 20,
  }}
  toastOptions={{
    duration: 4500,
    style: {
      background:
        "linear-gradient(135deg, rgba(10,14,39,0.95), rgba(15,52,96,0.95))",
      color: "#EAEAEA",
      border: "1px solid rgba(0,212,255,0.25)",
      backdropFilter: "blur(16px)",
      borderRadius: "16px",
      padding: "16px 20px",
      boxShadow: "0 0 25px rgba(0,212,255,0.2)",
      fontSize: "14px",
      fontWeight: "500",
    },
    success: {
      iconTheme: {
        primary: "#00D4FF",
        secondary: "#0A0E27",
      },
      style: {
        borderLeft: "4px solid #10B981",
        boxShadow: "0 0 20px rgba(16,185,129,0.4)",
      },
    },
    error: {
      iconTheme: {
        primary: "#EF4444",
        secondary: "#0A0E27",
      },
      style: {
        borderLeft: "4px solid #EF4444",
        boxShadow: "0 0 20px rgba(239,68,68,0.4)",
      },
    },
    loading: {
      iconTheme: {
        primary: "#00D4FF",
        secondary: "#0A0E27",
      },
      style: {
        borderLeft: "4px solid #00D4FF",
        boxShadow: "0 0 20px rgba(0,212,255,0.4)",
      },
    },
  }}
/>
      {/* Router */}
      <Router>
        <AnimatedRoutes />
      </Router>
    </>
  );
}

export default App;