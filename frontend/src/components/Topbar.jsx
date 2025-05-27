// frontend/src/components/Topbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Topbar = ({ pageTitle, user, userData, onLogout }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();

    const userDropdownRef = useRef(null);
    const userToggleRef = useRef(null);

    const userInitial = userData?.displayName?.charAt(0).toUpperCase() ||
                        user?.email?.charAt(0).toUpperCase() ||
                        'U';
    const userDisplayName = userData?.displayName || user?.email || 'User Menu';

    useEffect(() => {
        setDropdownOpen(false); // For user dropdown
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen &&
                userDropdownRef.current && !userDropdownRef.current.contains(event.target) &&
                userToggleRef.current && !userToggleRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    return (
        <div className="h-16 bg-white shadow-sm flex justify-between items-center px-6 border-b flex-shrink-0">
            {/* This will be empty if pageTitle from Layout.jsx is an empty string */}
            <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>

            <div className="flex items-center space-x-4 md:space-x-6">
                <button className="text-gray-500 hover:text-gray-700 relative">
                    <span>🔔</span> {/* Placeholder for notification bell */}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        ref={userToggleRef}
                        onClick={() => setDropdownOpen(prev => !prev)}
                        className="flex items-center space-x-2 focus:outline-none p-1 rounded-md hover:bg-gray-100"
                        aria-haspopup="true"
                        aria-expanded={dropdownOpen}
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                            {userInitial}
                        </div>
                        <span className="hidden md:inline text-sm font-medium text-gray-700">
                            {userDisplayName}
                        </span>
                        <span className={`hidden md:inline text-gray-500 text-xs transform transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {dropdownOpen && (
                        <div
                            ref={userDropdownRef}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-20 py-1 border"
                        >
                            <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">My Profile</Link>
                            <Link to="/settings" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">Settings</Link>
                            <button onClick={() => { onLogout(); setDropdownOpen(false); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Log Out</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Topbar;