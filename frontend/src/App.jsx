// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

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
import HomePage from './pages/HomePage'; // Ensure this is imported
import AdminPanelPage from './pages/admin/AdminPanelPage'; // Assuming you have this for Admin roles

// Component Imports
import Layout from './components/Layout';

// --- ProtectedRoute, PublicRoute, AdminRoute (Keep as they were) ---
function ProtectedRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="flex justify-center items-center h-screen">Loading Auth...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="flex justify-center items-center h-screen">Loading Auth...</div>;
  if (currentUser) return <Navigate to="/home" replace />; // <<< Default to /home if logged in
  return children;
}

function AdminRoute({ children }) {
  const { currentUser, userData, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="flex justify-center items-center h-screen">Loading Auth...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userData?.role !== 'Super_Admin' && userData?.role !== 'Admin') {
    return <Navigate to="/home" replace />; // Default to /home if not admin
  }
  return children;
}
// --- End Route HOCs ---

function App() {
  const { currentUser, loadingAuth } = useAuth();

  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen">Initializing PIMS...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Protected Routes use the Layout component --- */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/home" element={<HomePage />} /> {/* <<< HOME PAGE */}
          <Route path="/dashboard" element={<DashboardPage />} /> {/* <<< DASHBOARD PAGE */}
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
        <Route path="/" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} /> {/* <<< REDIRECT TO /home */}

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} /> {/* <<< REDIRECT TO /home */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;