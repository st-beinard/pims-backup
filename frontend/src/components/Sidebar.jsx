// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// NavItem component (This should be the version that handles isSubItem and exact props if you're using them)
const NavItem = ({ to, icon, label, isSubItem = false, exact = false }) => {
    const location = useLocation();
    let isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    if (to === "/home" && location.pathname === "/") isActive = true;
    // Adjust if /dashboard should not be active when a sub-item like /events is active
    if (to === "/dashboard" && (location.pathname !== "/dashboard" && location.pathname.startsWith("/dashboard/"))) {
        // Example: if /dashboard/overview is a sub-route, this might need tweaking
        // For now, /dashboard will be active if path starts with /dashboard.
    }
     if (isSubItem && location.pathname !== to) isActive = false; // Sub-items only active on exact match

    return (
        <Link to={to} className="block">
            <li className={`
                p-3 rounded-md cursor-pointer flex items-center space-x-3 
                transition-colors duration-150 ease-in-out
                ${isSubItem ? 'pl-7 text-xs' : 'text-sm'}
                ${isActive 
                    ? (isSubItem ? 'bg-blue-500 text-white font-medium' : 'bg-blue-600 text-white font-semibold shadow-md')
                    : (isSubItem ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600')
                }`}
            >
                {icon && <span className={`text-lg ${isSubItem ? 'text-base leading-none' : ''}`}>{icon}</span>}
                <span>{label}</span>
            </li>
        </Link>
    );
};

const Sidebar = () => {
    const { userData } = useAuth();
    const userRole = userData?.role || null;
    const location = useLocation();

    const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(
        location.pathname.startsWith("/dashboard") ||
        ["/events", "/tasks", "/projects", "/attendance"].some(p => location.pathname.startsWith(p))
    );

    const toggleDashboardDropdown = (e) => {
        // If the target is the Link to /dashboard, let it navigate and ensure dropdown is open
        let targetElement = e.target;
        while(targetElement && targetElement.tagName !== 'A') {
            targetElement = targetElement.parentElement;
        }
        if (targetElement && targetElement.getAttribute('href') === '/dashboard') {
            setIsDashboardDropdownOpen(true); 
            // Allow Link's default navigation
        } else {
             // If clicking on the div/span for toggle, prevent <a> if it's just a toggle
            if (!(targetElement && targetElement.getAttribute('href'))) {
                 e.preventDefault();
            }
            setIsDashboardDropdownOpen(prev => !prev);
        }
    };
    
    const isAnyDashboardPageActive = location.pathname === "/dashboard" || // Exact match for overview
                                   location.pathname.startsWith("/events") ||
                                   location.pathname.startsWith("/tasks") ||
                                   location.pathname.startsWith("/projects") ||
                                   location.pathname.startsWith("/attendance");

    return (
        <div className="w-60 h-screen bg-white p-4 border-r shadow-lg flex-shrink-0 flex flex-col">
            <div className="mb-8 text-center">
                <Link to="/home" className="inline-block">
                    <h1 className="text-3xl font-bold text-blue-600">PiMS</h1>
                </Link>
            </div>
            <nav className="flex-grow">
                <ul className="space-y-1">
                    <NavItem to="/home" label="Home" icon="🏠" exact={true} />

                    {/* Dashboard Dropdown */}
                    <li>
                        <div // Changed to div for click area
                            onClick={toggleDashboardDropdown}
                            className={`
                                p-3 rounded-md cursor-pointer flex items-center justify-between space-x-3 text-sm 
                                transition-colors duration-150 ease-in-out
                                ${isAnyDashboardPageActive 
                                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                                    : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                                }`}
                            role="button"
                            aria-expanded={isDashboardDropdownOpen}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleDashboardDropdown(e); }}
                        >
                            <Link to="/dashboard" className="flex items-center space-x-3 flex-grow"> {/* Link wrapping text and icon */}
                                <span className="text-lg">📊</span>
                                <span>Dashboard</span>
                            </Link>
                            <span className={`transform transition-transform duration-200 ${isDashboardDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                        </div>
                        {isDashboardDropdownOpen && (
                            <ul className="pl-3 mt-1 space-y-0.5">
                                <NavItem to="/dashboard" label="Overview" icon="📈" isSubItem={true} exact={true}/>
                                <NavItem to="/events" label="Events" icon="📅" isSubItem={true} exact={true}/>
                                <NavItem to="/tasks" label="Tasks" icon="✔️" isSubItem={true} exact={true}/>
                                <NavItem to="/projects" label="Projects" icon="📁" isSubItem={true} exact={true}/>
                                <NavItem to="/attendance" label="Attendance" icon="👥" isSubItem={true} exact={true}/>
                            </ul>
                        )}
                    </li>

                    {/* "My Profile" and "Settings" are INTENTIONALLY REMOVED from this list */}

                    {(userRole === 'Super_Admin' || userRole === 'Admin') && (
                        <>
                            <hr className="my-3 border-gray-300" />
                            <NavItem to="/admin" label="Admin Panel" icon={"🛠️"} exact={true}/>
                        </>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;