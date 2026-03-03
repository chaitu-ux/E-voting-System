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

/* ===============================
   👤 ADMIN PAGES
================================ */
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";

/* ===============================
   🔐 ROUTE PROTECTION COMPONENTS
================================ */
import ProtectedRoute from "./components/ProtectedRoute"; // Student vote protection
import RoleProtectedRoute from "./components/RoleProtectedRoute"; // Admin role protection


import CandidateApply from "./pages/student/CandidateApply";
import StudentDashboard from "./pages/student/StudentDashboard";
import WinnerPage from "./pages/student/WinnerPage";


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

            {/* ===============================
                🌐 PUBLIC ROUTES
            ================================ */}
            <Route path="/" element={<RoleSelection />} />


            {/* ===============================
                🎓 STUDENT FLOW
            ================================ */}

            <Route path="/student" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/student/otp" element={<OtpVerification />} />
            <Route path="/student/success" element={<SuccessPage />} />
            <Route path="/results" element={<ResultsPage />} />

            {/* 🔐 Protected Vote Page (Student must verify OTP first) */}
            <Route
              path="/student/vote"
              element={
                <ProtectedRoute>
                  <VotePage />
                </ProtectedRoute>
              }
            />


              <Route path="/student/apply" element={<CandidateApply />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/winner" element={<WinnerPage />} />



            {/* ===============================
                👤 ADMIN FLOW
            ================================ */}

            {/* Admin Login */}
            <Route path="/admin" element={<AdminLogin />} />

            {/* 👤 Normal Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
                  <Dashboard />
                </RoleProtectedRoute>
              }
            />

            {/* 👑 Superadmin Dashboard */}
            <Route
              path="/superadmin/dashboard"
              element={
                <RoleProtectedRoute allowedRoles={["superadmin"]}>
                  <SuperAdminDashboard />
                </RoleProtectedRoute>
              }
            />


            {/* ===============================
                🚫 FALLBACK ROUTE
            ================================ */}
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
      {/* Global Toast Notification */}
      <Toaster position="top-center" />

      {/* Router Wrapper */}
      <Router>
        <AnimatedRoutes />
      </Router>
    </>
  );
}

export default App;