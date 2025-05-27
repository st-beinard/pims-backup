// frontend/src/components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to === "/dashboard" && location.pathname === "/");

    return (
        <Link to={to} className="block">
            <li className={`mb-1 p-3 rounded-md cursor-pointer flex items-center space-x-3 text-sm transition-colors duration-150 ease-in-out
                            ${isActive
                                ? 'bg-blue-600 text-white font-semibold shadow-md'
                                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-600'
                            }`}
            >
                {icon && <span className="text-lg">{icon}</span>}
                <span>{label}</span>
            </li>
        </Link>
    );
};

const Sidebar = () => {
    return (
        <div className="w-60 h-screen bg-white p-4 border-r shadow-lg flex-shrink-0 flex flex-col">
            <div className="mb-8 text-center">
                <Link to="/dashboard" className="inline-block">
                    <h1 className="text-3xl font-bold text-blue-600">PIMS</h1>
                </Link>
            </div>
            <nav className="flex-grow">
                <ul className="space-y-1">
                    <NavItem to="/dashboard" label="Dashboard" icon="🏠" />
                    <NavItem to="/events" label="Events" icon="📅" />
                    <NavItem to="/tasks" label="Tasks" icon="✔️" />
                    <NavItem to="/projects" label="Projects" icon="📁" />
                    <NavItem to="/attendance" label="Attendance" icon="👥" />
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;