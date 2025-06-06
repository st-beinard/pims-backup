// frontend/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ensure this path is correct
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate for potential future use

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { resetPassword, loadingAuth } = useAuth(); // Assuming loadingAuth is available from context
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // For form submission loading state
    // const navigate = useNavigate(); // Not used in current logic, but might be later

    async function handleSubmit(e) {
        e.preventDefault();
        // Clear previous messages before new attempt
        setMessage('');
        setError('');
        setLoading(true);
        try {
            await resetPassword(email);
            setMessage('Check your inbox for further instructions to reset your password.');
        } catch (err) {
            console.error("Forgot Password Error:", err);
            let friendlyMessage = 'Failed to send password reset email.';
            if (err.code) {
                if (err.code === 'auth/user-not-found') {
                    friendlyMessage = 'No user found with this email address.';
                } else if (err.code === 'auth/invalid-email') {
                    friendlyMessage = 'The email address is not valid.';
                } else if (err.code === 'auth/too-many-requests') {
                    friendlyMessage = 'Too many requests. Please try again later.';
                }
            }
            setError(friendlyMessage);
        }
        setLoading(false);
    }

    if (loadingAuth) { // Display loading if initial auth state is still being determined
        return <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                {/* Titles Section - No logo as per previous request */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">PIMS</h1>
                    <p className="text-sm text-gray-500">Project and Event Management</p>
                    <h2 className="text-xl font-semibold text-gray-700 mt-4">Reset your Password</h2>
                </div>

                {!message && ( // Hide form if success message is shown
                    <p className="text-sm text-gray-600 mb-6 text-center">
                        Please provide the email address that you used when you signed up for your account.
                        We will send you an email with instructions to reset your password.
                    </p>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                        {message}
                    </div>
                )}

                {!message && ( // Hide form if success message is shown
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="name@example.com"
                            />
                        </div>
                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Sending Email...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Back to Log In
                    </Link>
                </div>
                {/* Removed "Need an account? Sign Up" link as it's less common on a forgot password page for a specific admin type */}
            </div>
            <p className="mt-8 text-xs text-center text-gray-500">
                © {new Date().getFullYear()} PIMS. All rights reserved.
            </p>
        </div>
    );
}