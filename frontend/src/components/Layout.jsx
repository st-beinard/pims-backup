// frontend/src/components/Layout.jsx
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Get location object

    const handleLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (error) { console.error("Layout: Failed to log out", error); }
    };

    if (!currentUser && !useAuth().loadingAuth) {
        return <navigate to="/login" replace />;
    }

    // --- Determine Page Title based on current path ---
    let currentPageTitle = ""; // Default to empty string (this makes Topbar blank if no match)
    const path = location.pathname.toLowerCase();

    if (path === '/dashboard' || path === '/') {
        currentPageTitle = "Dashboard Overview"; // Or "Dashboard Overview"
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
    }
    // --- End Page Title Determination ---

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    pageTitle={currentPageTitle} // Pass the determined title
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