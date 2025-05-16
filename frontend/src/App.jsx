// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProjectsPage from './pages/ProjectsPage'; // <-- UNCOMMENTED and ensure file exists
import TasksPage from './pages/TasksPage';     // Keep TasksPage if you have it

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  // Optional: Add a loading state check from your AuthContext if it provides one
  // if (authLoading) return <div>Loading Authentication...</div>;
  return currentUser ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  // Optional: Add a loading state check
  // if (authLoading) return <div>Loading Authentication...</div>;
  return !currentUser ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  const { currentUser } = useAuth(); 

  return (
    <BrowserRouter>
        <Routes>
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute><EventsPage /></ProtectedRoute>
          } />
          <Route path="/projects" element={ // <-- UNCOMMENTED and route activated
            <ProtectedRoute><ProjectsPage /></ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute><TasksPage /></ProtectedRoute>
          } />
          {/* Add other protected routes like /attendance here later */}


          {/* Root path navigation */}
          <Route
            path="/"
            element={
              currentUser !== undefined ?
                (currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)
                : <div>Loading...</div> // Or some other loading indicator
            }
          />

          {/* Public Routes */}
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

          {/* Catch-all route */}
          <Route
            path="*"
            element={
              currentUser !== undefined ?
                (currentUser ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />)
                : <div>Loading...</div>
            }
          />
        </Routes>
    </BrowserRouter>
  );
}

export default App;