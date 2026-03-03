import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const hasVoted = localStorage.getItem("hasVoted");

  if (hasVoted === "true") {
    return <Navigate to="/student/success" replace />;
  }

  return children;
}

export default ProtectedRoute;