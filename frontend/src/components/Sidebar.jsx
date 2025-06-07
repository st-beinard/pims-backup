// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react'; // Added useState
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// NavItem component (YOUR EXISTING CODE - can remain as is or be slightly adapted for sub-items if needed)
const NavItem = ({ to, icon, label, isSubItem = false }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to === "/home" && location.pathname === "/");

    return (
        <Link to={to} className="block">
            <li className={`
                p-3 rounded-md cursor-pointer flex items-center space-x-3 text-sm 
                transition-colors duration-150 ease-in-out
                ${isSubItem ? 'pl-8 text-xs' : ''} 
                ${isActive
                    ? (isSubItem ? 'bg-blue-500 text-white font-medium' : 'bg-blue-600 text-white font-semibold shadow-md')
                    : (isSubItem ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600')
                }`}
            >
                {icon && <span className={`text-lg ${isSubItem ? 'text-xs' : ''}`}>{icon}</span>}
                <span>{label}</span>
            </li>
        </Link>
    );
};


const Sidebar = () => {
    const { userData } = useAuth();
    const userRole = userData?.role || null;
    const location = useLocation(); // For highlighting the main "Dashboard" item

    // --- NEW STATE for Dashboard dropdown visibility ---
    const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
    // --- End New State ---

    const toggleDashboardDropdown = (e) => {
        // Prevent navigation if it's just a dropdown toggle
        // If "/dashboard" itself is also a clickable page, this logic might need adjustment
        e.preventDefault();
        setIsDashboardDropdownOpen(prev => !prev);
    };

    // Determine if the main "Dashboard" link or any of its sub-items are active
    const isDashboardSectionActive = [
        "/dashboard",
        "/events",
        "/tasks",
        "/projects",
        "/attendance"
    ].includes(location.pathname);


    return (
        <div className="w-60 h-screen bg-white p-4 border-r shadow-lg flex-shrink-0 flex flex-col">
            <div className="mb-8 text-center">
                <Link to="/home" className="inline-block"> {/* Assuming /home is the main landing */}
                    <h1 className="text-3xl font-bold text-blue-600">PIMS</h1>
                </Link>
            </div>
            <nav className="flex-grow">
                <ul className="space-y-1">
                    <NavItem to="/home" label="Home" icon="🏠" />

                    {/* --- MODIFIED "Go to Dashboard" to be a Dropdown Toggle --- */}
                    <li> {/* Wrap in li for consistent spacing if NavItem was an li */}
                        <a
                            href="/dashboard" // Or can be "#" if it ONLY toggles and dashboard itself isn't a page
                            onClick={toggleDashboardDropdown}
                            className={`
                                p-3 rounded-md cursor-pointer flex items-center justify-between space-x-3 text-sm 
                                transition-colors duration-150 ease-in-out
                                ${isDashboardSectionActive 
                                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                                    : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                                }`}
                            aria-expanded={isDashboardDropdownOpen}
                        >
                            <div className="flex items-center space-x-3">
                                <span className="text-lg">📊</span> {/* Dashboard Icon */}
                                <span>Dashboard Sections</span> {/* Changed Label */}
                            </div>
                            <span className={`transform transition-transform duration-200 ${isDashboardDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span> {/* Dropdown arrow */}
                        </a>
                        {/* --- Dashboard Submenu --- */}
                        {isDashboardDropdownOpen && (
                            <ul className="pl-4 mt-1 space-y-0.5"> {/* Indent sub-items */}
                                <NavItem to="/dashboard" label="Main Dashboard" icon="📈" isSubItem={true} />
                                <NavItem to="/events" label="Events" icon="📅" isSubItem={true} />
                                <NavItem to="/tasks" label="Tasks" icon="✔️" isSubItem={true} />
                                <NavItem to="/projects" label="Projects" icon="📁" isSubItem={true} />
                                <NavItem to="/attendance" label="Attendance" icon="👥" isSubItem={true} />
                            </ul>
                        )}
                        {/* --- End Dashboard Submenu --- */}
                    </li>
                    {/* --- End MODIFIED "Go to Dashboard" --- */}

                    {/* My Profile and Settings are REMOVED from here as they are in Topbar */}
                    {/* <NavItem to="/profile" label="My Profile" icon="👤" /> */}
                    {/* <NavItem to="/settings" label="Settings" icon="⚙️" /> */}


                    {/* --- YOUR EXISTING ROLE-BASED LINKS --- */}
                    {(userRole === 'Admin' || userRole === 'Facilitator') && (
                        <NavItem to="/team-management" label="Team Management" icon="👨‍👩‍👧‍👦" />
                    )}
                    {(userRole === 'Admin' || userRole === 'Super_Admin') && (
                        <>
                            <hr className="my-3 border-gray-300" />
                            <NavItem to="/admin" label="Admin Panel" icon={"🛠️"} />
                        </>
                    )}
                    {/* --- END ROLE-BASED LINKS --- */}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;