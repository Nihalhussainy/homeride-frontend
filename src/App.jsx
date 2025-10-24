import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; // Import useLocation
import { NotificationProvider } from './context/NotificationContext.jsx';
import Navbar from './components/Navbar';
import RouteGuard from './components/RouteGuard';
import Chatbot from './components/Chatbot'; // <-- 1. Import the Chatbot
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OfferRidePage from './pages/OfferRidePage';
import SearchPage from './pages/SearchPage';
import RideDetailPage from './pages/RideDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import './App.css';
import './StaticPages.css';
import { useState, useEffect } from 'react'; // <-- Import useState, useEffect

function App() {
  const location = useLocation(); // <-- Get current location
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token')); // <-- Track login state

  // Update login state when token changes (e.g., after login/logout)
  // Or when location changes (in case of direct navigation after login)
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location]); // Re-check on route change

  return (
    <NotificationProvider>
      <div>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<RouteGuard><DashboardPage /></RouteGuard>} />
          <Route path="/profile" element={<RouteGuard><ProfilePage /></RouteGuard>} />
          <Route path="/offer-ride" element={<RouteGuard><OfferRidePage /></RouteGuard>} />
          <Route path="/search" element={<RouteGuard><SearchPage /></RouteGuard>} />
          <Route path="/ride/:id" element={<RouteGuard><RideDetailPage /></RouteGuard>} />

          {/* Admin Route */}
          <Route path="/admin" element={<RouteGuard adminOnly={true}><AdminDashboardPage /></RouteGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {/* 2. Conditionally render Chatbot if logged in */}
        {isLoggedIn && <Chatbot />}
      </div>
    </NotificationProvider>
  );
}

export default App;