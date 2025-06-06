// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
// import PimsLogo from '../assets/PIMS_LOGO.png'; // <<< LOGO IMPORT REMOVED

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loadingAuth } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error("Login Page Error:", err);
      let friendlyMessage = 'Failed to log in. Please check your credentials.';
      if (err.code) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          friendlyMessage = 'Invalid email or password.';
        } else if (err.code === 'auth/too-many-requests') {
          friendlyMessage = 'Access to this account has been temporarily disabled. Please try again later or reset your password.';
        } else if (err.code === 'auth/network-request-failed'){
          friendlyMessage = 'Network error. Please check your internet connection.';
        }
      }
      setError(friendlyMessage);
    }
    setLoading(false);
  }

  if (loadingAuth) {
      return <div className="flex justify-center items-center h-screen text-lg font-semibold text-gray-700">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          {/* <img src={PimsLogo} alt="PIMS Logo" className="w-20 h-20 mx-auto mb-2" /> */} {/* <<< LOGO IMG TAG REMOVED/COMMENTED */}
          <h1 className="text-2xl font-bold text-gray-800">PIMS</h1>
          <p className="text-sm text-gray-500">Project and Event Management</p>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Super Administrator</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
       <p className="mt-8 text-xs text-center text-gray-500">
           © {new Date().getFullYear()} PIMS. All rights reserved.
       </p>
    </div>
  );
}