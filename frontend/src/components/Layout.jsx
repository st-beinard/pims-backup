// frontend/src/components/Layout.jsx
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const { currentUser, userData, logout } = useAuth(); // logout is from context
    const navigate = useNavigate();
    const location = useLocation(); // Kept as you provided

    // --- THIS IS THE INTEGRATED/CONFIRMED FUNCTION ---
    const handleLogout = async () => {
        try {
            await logout(); // Call the logout function from AuthContext
            navigate('/login'); // Redirect to login page after successful logout
            console.log("Layout: User logged out and redirected to /login");
        } catch (error) {
            console.error("Layout: Failed to log out", error);
            // Optionally, display an error message to the user
        }
    };
    // --- END INTEGRATION ---

    // Your existing loadingAuth check (make sure loadingAuth is provided by your useAuth if you use this)
    // if (!currentUser && !useAuth().loadingAuth) { /* ... existing check ... */ }
    // Simpler check based on what's destructured:
    if (!currentUser && !useAuth().loading) { // Assuming your context uses 'loading' not 'loadingAuth'
        console.warn("Layout: No currentUser and context is not loading, redirecting to login. This might be unexpected if ProtectedRoute should have handled it.");
        return <Navigate to="/login" replace />;
    }


    // Your existing page title logic (VERBATIM)
    let currentPageTitle = "";
    const path = location.pathname.toLowerCase();
    if (path === '/home' || (path === '/' && currentUser) ) { currentPageTitle = "Home Overview"; }
    else if (path.startsWith('/dashboard')) { currentPageTitle = "Dashboard Overview"; }
    else if (path.startsWith('/events')) { currentPageTitle = "Events Management"; }
    else if (path.startsWith('/tasks')) { currentPageTitle = "Task Management"; }
    else if (path.startsWith('/projects')) { currentPageTitle = "Project Management"; }
    else if (path.startsWith('/attendance')) { currentPageTitle = "Attendance Records"; }
    else if (path.startsWith('/profile')) { currentPageTitle = "My Profile"; }
    else if (path.startsWith('/settings')) { currentPageTitle = "Settings"; }
    else if (path.startsWith('/admin')) { currentPageTitle = "Admin Panel"; }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    pageTitle={currentPageTitle}
                    user={currentUser}
                    userData={userData}
                    onLogout={handleLogout} // This passes the now fully defined handleLogout
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;