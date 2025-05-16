// frontend/src/components/Topbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Assuming you use this for logout and user info

const Topbar = ({ pageTitle = "Dashboard" }) => { // Accept pageTitle as a prop
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out:", error);
            // Handle logout error (e.g., display a message)
        }
    };

    return (
        <header className="h-16 bg-white shadow-sm flex justify-between items-center px-4 sm:px-6 border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
            {/* Left Side: Page Title or Search (can be made dynamic) */}
            <div>
                <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
                {/* Or a Search Input:
                <div className="relative">
                    <input type="search" placeholder="Search..." className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
                */}
            </div>

            {/* Right Side: Notifications, User Menu */}
            <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Notification Bell */}
                <button className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors">
                    <span className="sr-only">View notifications</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        id="user-menu-button"
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                    >
                        <span className="sr-only">Open user menu</span>
                        {/* Placeholder for user avatar - replace with actual image or initials */}
                        <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-semibold">
                            {userData?.displayName ? userData.displayName.charAt(0).toUpperCase() : currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="hidden sm:inline ml-2 text-sm font-medium text-gray-700">{userData?.displayName || currentUser?.email}</span>
                        <svg className={`hidden sm:inline ml-1 h-5 w-5 text-gray-400 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Dropdown menu */}
                    {dropdownOpen && (
                        <div
                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="user-menu-button"
                            tabIndex="-1"
                        >
                            <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={() => setDropdownOpen(false)}>Your Profile</Link>
                            <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex="-1" onClick={() => setDropdownOpen(false)}>Settings</Link>
                            <button
                                onClick={() => { handleLogout(); setDropdownOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                                tabIndex="-1"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;