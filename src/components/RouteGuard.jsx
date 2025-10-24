import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Helper function to check if a token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If token is invalid, treat as expired
  }
};

// Helper function to get the user's role from the token
const getRoleFromToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.role.replace('ROLE_', '');
  } catch (error) {
    return null;
  }
};

// This is our new, single component to protect all routes
function RouteGuard({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  // 1. Check if the user is logged in at all.
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token'); // Clean up any invalid token
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If this route is for admins only, check the user's role.
  if (adminOnly) {
    const userRole = getRoleFromToken(token);
    if (userRole !== 'ADMIN') {
      // If a non-admin tries to access an admin page, send them away.
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. If all checks pass, show the requested page.
  return children;
}

export default RouteGuard;
