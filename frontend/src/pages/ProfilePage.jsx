// frontend/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react'; // <<< ADDED useEffect
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuth, updateProfile as updateAuthProfile } from 'firebase/auth'; // <<< NEW IMPORT
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // <<< NEW IMPORT
import { db } from '../firebaseConfig'; // <<< NEW IMPORT for db instance

// Placeholder icons - replace with actual icons
const UserIcon = () => <span className="text-5xl text-gray-700">👤</span>;
const LogoutIcon = () => <span className="mr-2">🚪</span>;
const ArchiveIcon = () => <span className="mr-2">🗄️</span>;
const EditIcon = () => <span className="ml-2 text-sm text-blue-500 hover:text-blue-700 cursor-pointer">✏️</span>; // <<< NEW ICON

// Reusable component for list items in Account Details
const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 px-4 border-b border-gray-200 last:border-b-0">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-800">{value}</span>
    </div>
);

export default function ProfilePage() {
    const { currentUser, userData, logout, setUserData } = useAuth(); // <<< ADDED setUserData from context
    const navigate = useNavigate();

    // --- NEW STATE for editing display name ---
    const [isEditingName, setIsEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState(''); // Initialized empty, will be set by useEffect
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');
    const [isSubmittingName, setIsSubmittingName] = useState(false);
    // --- End New State ---

    // --- NEW useEffect to initialize newDisplayName ---
    useEffect(() => {
        if (userData?.displayName) {
            setNewDisplayName(userData.displayName);
        } else if (currentUser?.displayName) {
            setNewDisplayName(currentUser.displayName);
        } else if (currentUser?.email) {
            // Fallback to email if no displayName is set anywhere
            setNewDisplayName(currentUser.email.split('@')[0]); // Or just currentUser.email
        }
    }, [userData, currentUser]); // Re-run if userData or currentUser changes
    // --- End New useEffect ---


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("ProfilePage: Failed to log out", error);
        }
    };

    const memberSince = userData?.memberSince ||
                       (currentUser?.metadata?.creationTime
                           ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                           : "January 2025");

    const lastLogin = userData?.lastLoginAt ||
                      (currentUser?.metadata?.lastSignInTime
                          ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                          : "Today at 9:30 AM");

    const handleArchiveAccounts = () => {
        alert("Archive Accounts functionality (admin only) to be implemented.");
    };

    // --- NEW FUNCTION to handle display name update ---
    const handleNameUpdate = async (e) => {
        e.preventDefault();
        if (!newDisplayName.trim()) {
            setNameError("Display name cannot be empty.");
            return;
        }
        if (!currentUser) {
            setNameError("User not found. Please re-login.");
            return;
        }

        setIsSubmittingName(true);
        setNameError('');
        setNameSuccess('');
        const auth = getAuth();

        try {
            // 1. Update Firebase Authentication display name
            await updateAuthProfile(auth.currentUser, {
                displayName: newDisplayName.trim(),
            });
            console.log("ProfilePage: Firebase Auth displayName updated.");

            // 2. Update displayName in your Firestore 'users' document
            const userDocRef = doc(db, "users", currentUser.uid);
            await updateDoc(userDocRef, {
                displayName: newDisplayName.trim(),
            });
            console.log("ProfilePage: Firestore 'users' document displayName updated.");

            // 3. Update local context's userData
            if (setUserData) { // Check if setUserData is provided by context
                // Option A: Fetch the full updated document
                const updatedUserDocSnap = await getDoc(userDocRef);
                if (updatedUserDocSnap.exists()) {
                    setUserData({ uid: currentUser.uid, ...updatedUserDocSnap.data() });
                } else {
                // Option B: More direct update if you know the structure (less robust if other fields changed)
                    setUserData(prevUserData => ({
                        ...prevUserData,
                        displayName: newDisplayName.trim(),
                        // Ensure other fields from prevUserData are preserved
                        uid: currentUser.uid, // ensure uid is there if not in prevUserData
                        email: currentUser.email, // ensure email is there
                    }));
                }
            } else {
                console.warn("ProfilePage: setUserData not available from AuthContext. UI might not update immediately elsewhere.");
            }


            setNameSuccess("Display name updated successfully!");
            setIsEditingName(false);
        } catch (error) {
            console.error("ProfilePage: Error updating display name:", error);
            setNameError(`Failed to update name: ${error.message}`);
        } finally {
            setIsSubmittingName(false);
        }
    };
    // --- End New Function ---


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
                    {/* ***** MODIFIED Display Name Section ***** */}
                    {!isEditingName ? (
                        <div className="flex items-center group"> {/* Added group for hover effect on icon */}
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                {newDisplayName || currentUser.email} {/* Display newDisplayName if available */}
                            </h2>
                            <button 
                                onClick={() => { 
                                    setIsEditingName(true); 
                                    // setNewDisplayName is already set by useEffect or user typing
                                    setNameError(''); 
                                    setNameSuccess(''); 
                                }} 
                                className="ml-3 p-1 rounded opacity-50 group-hover:opacity-100 transition-opacity"
                                title="Edit display name"
                            >
                                <EditIcon />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleNameUpdate} className="flex flex-col sm:flex-row items-center gap-2">
                            <input
                                type="text"
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xl sm:text-2xl font-bold w-full sm:w-auto"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Escape') setIsEditingName(false);}}
                            />
                            <div className="flex gap-2 mt-2 sm:mt-0">
                                <button 
                                    type="submit" 
                                    disabled={isSubmittingName || !newDisplayName.trim()} 
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
                                >
                                    {isSubmittingName ? "Saving..." : "Save"}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsEditingName(false);
                                        // Reset newDisplayName to original if user cancels
                                        setNewDisplayName(userData?.displayName || currentUser?.displayName || currentUser.email.split('@')[0]);
                                        setNameError('');
                                        setNameSuccess('');
                                    }} 
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                    {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                    {nameSuccess && <p className="text-xs text-green-500 mt-1">{nameSuccess}</p>}
                    {/* ***** End MODIFIED Display Name Section ***** */}
                    <p className="text-sm text-gray-600">{userData?.role || "User"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-3">Account Details</h3>
                    <div className="divide-y divide-gray-200">
                        <InfoRow label="Account Type" value={userData?.role || "User"} />
                        <InfoRow label="Member Since" value={memberSince} />
                        <InfoRow label="Last Login" value={lastLogin} />
                        <InfoRow label="Email" value={currentUser.email} />
                    </div>
                </div>
            </div>

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