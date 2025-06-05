// frontend/src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'; // Firebase auth functions

// Placeholder icons (YOUR EXISTING ICONS)
const KeyIcon = () => <span className="text-gray-500">🔑</span>;
const ShieldIcon = () => <span className="text-gray-500">🛡️</span>;
const BellSettingsIcon = () => <span className="text-gray-500">🔔</span>;

// SettingsActionRow (YOUR EXISTING COMPONENT)
const SettingsActionRow = ({ label, valueText, onClick, icon }) => (
    <button
        onClick={onClick}
        className="w-full flex justify-between items-center py-4 px-4 text-left border-b border-gray-200 last:border-b-0 hover:bg-gray-50 focus:outline-none focus:bg-gray-100 transition-colors duration-150"
    >
        <div className="flex items-center">
            {icon && <span className="mr-3 text-lg">{icon}</span>}
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center">
            {valueText && <span className="text-sm text-gray-500 mr-2">{valueText}</span>}
            <span className="text-gray-400">❯</span>
        </div>
    </button>
);

// --- NEW: ChangePasswordForm Component ---
const ChangePasswordForm = ({ onSubmit, onCancel, isSubmitting }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormSuccess('');

        if (!currentPassword) {
            setFormError("Current password is required.");
            return;
        }
        if (newPassword.length < 6) {
            setFormError("New password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setFormError("New passwords do not match.");
            return;
        }

        try {
            await onSubmit(currentPassword, newPassword); // Pass to parent handler
            setFormSuccess("Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            // Optionally close the modal after a delay or let parent handle
            // setTimeout(onCancel, 2000);
        } catch (error) {
            console.error("ChangePasswordForm error:", error);
            if (error.code === 'auth/wrong-password') {
                setFormError("Incorrect current password.");
            } else if (error.code === 'auth/requires-recent-login') {
                setFormError("This action requires a recent login. Please log out and log back in to change your password.");
            } else {
                setFormError(`Failed to update password: ${error.message}`);
            }
        }
    };

    const inputStyle = "mt-1 block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    const labelStyle = "block text-sm font-medium text-gray-700";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white rounded-xl shadow-2xl w-full max-w-md space-y-5">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
                {formError && <p className="text-red-600 bg-red-100 p-3 rounded text-sm border border-red-300">{formError}</p>}
                {formSuccess && <p className="text-green-600 bg-green-50 p-3 rounded text-sm border border-green-300">{formSuccess}</p>}

                {!formSuccess && ( // Hide form fields after success
                    <>
                        <div>
                            <label htmlFor="currentPassword" className={labelStyle}>Current Password <span className="text-red-500">*</span></label>
                            <input type="password" id="currentPassword" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className={labelStyle}>New Password <span className="text-red-500">*</span></label>
                            <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" className={labelStyle}>Confirm New Password <span className="text-red-500">*</span></label>
                            <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className={inputStyle} />
                        </div>
                    </>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                    <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">
                        {formSuccess ? "Close" : "Cancel"}
                    </button>
                    {!formSuccess && (
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50">
                            {isSubmitting ? "Updating..." : "Update Password"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
// --- End ChangePasswordForm ---


export default function SettingsPage() {
    // const navigate = useNavigate(); // Not used if modals handle actions
    const { currentUser } = useAuth(); // Get currentUser from context

    // --- NEW STATE for Change Password Modal ---
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState(''); // For errors from the main page calling the auth function
    // --- End New State ---

    // MODIFIED: Opens the Change Password modal
    const handleChangePasswordClick = () => {
        setChangePasswordError(''); // Clear previous errors
        setShowChangePasswordModal(true);
    };

    // NEW: Handles the actual password update logic
    const handlePasswordUpdateSubmit = async (currentPassword, newPassword) => {
        if (!currentUser) {
            throw new Error("User not authenticated."); // Should be caught by form's catch block
        }
        setIsSubmittingPassword(true);
        setChangePasswordError(''); // Clear page-level error

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            // Re-authenticate user - This is a crucial security step for changing passwords
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // If re-authentication is successful, update the password
            await updatePassword(user, newPassword);
            console.log("SettingsPage: Password updated successfully.");
            // Success message is handled within the form; form can also call onCancel after delay
            // setShowChangePasswordModal(false); // Optionally close modal from here too
        } catch (error) {
            console.error("SettingsPage: Error updating password:", error);
            // Rethrow error so it can be caught and displayed by ChangePasswordForm
            throw error;
        } finally {
            setIsSubmittingPassword(false);
        }
    };


    const handleTwoFactorAuth = () => {
        alert("Two-Factor Authentication setup/management to be implemented.");
    };
    const handleNotificationSettings = () => {
        alert("Notification Settings page/management to be implemented.");
    };

    return (
        <div className="p-6 md:p-8">
            {/* --- NEW: Render ChangePasswordForm Modal --- */}
            {showChangePasswordModal && (
                <ChangePasswordForm
                    onSubmit={handlePasswordUpdateSubmit}
                    onCancel={() => {
                        setShowChangePasswordModal(false);
                        setChangePasswordError(''); // Clear any page-level error when closing
                    }}
                    isSubmitting={isSubmittingPassword}
                />
            )}
            {/* --- End ChangePasswordForm Modal --- */}


            <div className="max-w-2xl mx-auto">
                {/* Removed redundant page title h2 as Topbar handles it */}
                {changePasswordError && ( // Display page-level errors if any (e.g., if re-auth fails fundamentally)
                    <p className="text-red-600 bg-red-100 p-3 rounded text-sm mb-4 border border-red-300">{changePasswordError}</p>
                )}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-700 px-6 py-4 border-b">Security Settings</h3>
                    <div className="divide-y divide-gray-200">
                        <SettingsActionRow
                            label="Change Password"
                            onClick={handleChangePasswordClick} // MODIFIED to open modal
                            icon={<KeyIcon />}
                        />
                        <SettingsActionRow
                            label="Two-Factor Authentication"
                            valueText="Disabled"
                            onClick={handleTwoFactorAuth}
                            icon={<ShieldIcon />}
                        />
                        <SettingsActionRow
                            label="Notification Settings"
                            onClick={handleNotificationSettings}
                            icon={<BellSettingsIcon />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}