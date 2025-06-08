// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Assuming this path is now correct: src/contexts/AuthContext.jsx

// Page Imports
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AttendancePage from './pages/AttendancePage';
import EventsPage from './pages/EventsPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import AdminPanelPage from './pages/admin/AdminPanelPage'; // Make sure this file exists at this path

// Component Imports
import Layout from './components/Layout';

// --- ProtectedRoute ---
function ProtectedRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-gray-700">Loading Authentication...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- PublicRoute ---
function PublicRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-gray-700">Loading Authentication...</div>;
  }
  // If user is logged in, redirect them from public routes (like login/signup) to home
  if (currentUser) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// --- AdminRoute ---
function AdminRoute({ children }) {
  const { currentUser, userData, loadingAuth } = useAuth();
  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-gray-700">Loading Authentication...</div>;
  }
  if (!currentUser) { // Should be caught by ProtectedRoute if Layout wraps AdminRoute too
    return <Navigate to="/login" replace />;
  }
  // Check for specific admin roles
  if (userData?.role !== 'Super_Admin' && userData?.role !== 'Admin') {
    console.warn("AdminRoute: Access denied. User role:", userData?.role);
    return <Navigate to="/home" replace />; // Or to an unauthorized page
  }
  return children;
}
// --- End Route HOCs ---

function App() {
  const { currentUser, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">Initializing PIMS...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Protected Routes use the Layout component --- */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminRoute><AdminPanelPage /></AdminRoute>} />
        </Route>
        {/* --- End Protected Routes with Layout --- */}

        {/* --- Public Routes (do not use the Layout) --- */}
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        {/* --- End Public Routes --- */}

        {/* Root path redirect based on auth state */}
        <Route path="/" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;