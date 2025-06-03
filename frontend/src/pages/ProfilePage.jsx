// frontend/src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Placeholder icons - replace with actual icons
const UserIcon = () => <span className="text-5xl text-gray-700">👤</span>;
// KeyIcon, ShieldIcon, BellSettingsIcon are no longer needed here if section is removed
const LogoutIcon = () => <span className="mr-2">🚪</span>;
const ArchiveIcon = () => <span className="mr-2">🗄️</span>;

// Reusable component for list items in Account Details
const InfoRow = ({ label, value }) => ( // Removed isButton and onClick as they were for security settings
    <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 last:border-b-0">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-800">{value}</span>
    </div>
);

export default function ProfilePage() {
    const { currentUser, userData, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("ProfilePage: Failed to log out", error);
        }
    };

    const memberSince = userData?.memberSince || // Assuming you might have 'memberSince' in userData
                       (currentUser?.metadata?.creationTime
                           ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                           : "January 2025"); // Fallback

    const lastLogin = userData?.lastLoginAt || // Assuming you might have 'lastLoginAt' in userData
                      (currentUser?.metadata?.lastSignInTime
                          ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                          : "Today at 9:30 AM"); // Fallback

    // Placeholder navigation functions for security settings are REMOVED
    // const handleChangePassword = () => { /* ... */ };
    // const handleSecuritySettings = () => { /* ... */ };
    // const handleNotificationSettings = () => { /* ... */ };

    const handleArchiveAccounts = () => {
        alert("Archive Accounts functionality (admin only) to be implemented.");
    };

    if (!currentUser) {
        return <div className="p-6 text-center">Loading user data or not authenticated...</div>;
    }

    return (
        <div className="p-6 md:p-8 bg-gray-50 min-h-full">
            {/* User Header Section */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 sm:p-8 rounded-xl shadow-lg mb-8 flex items-center space-x-6">
                {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Profile" className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md" />
                ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-md">
                        <UserIcon />
                    </div>
                )}
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">{userData?.displayName || currentUser.email}</h2>
                    <p className="text-sm text-gray-600">{userData?.role || "User"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"> {/* Changed to lg:grid-cols-3, Account Details will take more space now */}
                {/* Account Details Section (now takes up more relative space) */}
                {/* To make it take 2/3 of the space if only one other column, or full if no other column, adjust col-span */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg"> {/* Changed to lg:col-span-3 to take full width since security settings is removed */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-3">Account Details</h3>
                    <div className="divide-y divide-gray-200">
                        <InfoRow label="Account Type" value={userData?.role || "User"} />
                        <InfoRow label="Member Since" value={memberSince} />
                        <InfoRow label="Last Login" value={lastLogin} />
                        <InfoRow label="Email" value={currentUser.email} />
                    </div>
                </div>

                {/* --- SECURITY SETTINGS SECTION REMOVED --- */}
                {/*
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-3">Security Settings</h3>
                    <div className="divide-y divide-gray-200">
                        <InfoRow label="Change Password" value="" isButton={true} onClick={handleChangePassword} icon={<KeyIcon />} />
                        <InfoRow label="Two-Factor Auth" value="Disabled" isButton={true} onClick={handleSecuritySettings} icon={<ShieldIcon />} />
                        <InfoRow label="Notification Settings" value="" isButton={true} onClick={handleNotificationSettings} icon={<BellSettingsIcon />} />
                    </div>
                </div>
                */}
                {/* --- END SECURITY SETTINGS SECTION REMOVED --- */}
            </div>

            {/* Action Buttons at the bottom */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                    onClick={handleLogout}
                    className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                >
                    <LogoutIcon />
                    Logout
                </button>
                {userData?.role === 'Admin' && (
                    <button
                        onClick={handleArchiveAccounts}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-sm transition-colors"
                    >
                       <ArchiveIcon />
                        Archive Accounts
                    </button>
                )}
            </div>
        </div>
    );
}