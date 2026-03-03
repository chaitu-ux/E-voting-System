import React from "react";
import { Navigate } from "react-router-dom";

function RoleProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default RoleProtectedRoute;