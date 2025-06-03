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
import ProfilePage from './pages/ProfilePage'; // <<< --- NEW: IMPORT ProfilePage ---

// Component Imports
import Layout from './components/Layout'; // <<< IMPORT THE LAYOUT COMPONENT

// --- ProtectedRoute and PublicRoute ---
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

function PublicRoute({ children }) {
  const { currentUser, loadingAuth } = useAuth();
  if (loadingAuth) {
    return <div className="flex justify-center items-center h-screen text-gray-700">Loading Authentication...</div>;
  }
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
// --- End Protected/Public ---

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/profile" element={<ProfilePage />} /> {/* <<< --- NEW: ADDED PROFILE ROUTE --- */}
          {/* Add any other pages that should have the sidebar and topbar here */}
        </Route>
        {/* --- End Protected Routes with Layout --- */}

        {/* --- Public Routes (do not use the Layout) --- */}
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        {/* --- End Public Routes --- */}

        {/* Root path redirect based on auth state */}
        <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;