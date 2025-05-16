// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ensure this path is correct (AuthContext.jsx)
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // Make sure login is correctly destructured from useAuth()
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/'); // Navigate to dashboard or home after login
    } catch (err) {
      console.error("Login Page Error:", err); // Log the full error object
      let friendlyMessage = 'Failed to log in. Please check your credentials.';
      if (err.code) { // Check if err.code exists (Firebase errors have it)
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

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px', border: '1px solid #ccc', marginTop: '50px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Log In</h2>
      
      {error && <p style={{ color: 'red', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button 
          disabled={loading} 
          type="submit" 
          style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#ccc' : 'blue', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Logging In...' : 'Log In'}
        </button>
      </form>
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <Link to="/forgot-password" style={{ color: 'blue' }}>Forgot Password?</Link>
      </div>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        Need an account? <Link to="/signup" style={{ color: 'blue' }}>Sign Up</Link>
      </div>
    </div>
  );
}