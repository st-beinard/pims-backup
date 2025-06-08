// frontend/src/components/Layout.jsx
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => { /* ... your existing logout ... */ };

    if (!currentUser && !useAuth().loadingAuth) { /* ... existing check ... */ }

    let currentPageTitle = "";
    const path = location.pathname.toLowerCase();

    if (path === '/home' || (path === '/' && currentUser) ) { // If root redirects to /home
        currentPageTitle = "Home Overview"; // Or just "Home" or empty
    } else if (path.startsWith('/dashboard')) { // Use startsWith if /dashboard has sub-routes later
        currentPageTitle = "Dashboard Overview"; // <<< SETS TITLE FOR /dashboard
    } else if (path.startsWith('/events')) {
        currentPageTitle = "Events Management";
    } else if (path.startsWith('/tasks')) {
        currentPageTitle = "Task Management";
    } else if (path.startsWith('/projects')) {
        currentPageTitle = "Project Management";
    } else if (path.startsWith('/attendance')) {
        currentPageTitle = "Attendance Records";
    } else if (path.startsWith('/profile')) {
        currentPageTitle = "My Profile";
    } else if (path.startsWith('/settings')) {
        currentPageTitle = "Settings";
    } else if (path.startsWith('/admin')) {
        currentPageTitle = "Admin Panel";
    }
    // Add more conditions for other pages

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    pageTitle={currentPageTitle}
                    user={currentUser}
                    userData={userData}
                    onLogout={handleLogout}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;