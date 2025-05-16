// frontend/src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { resetPassword } = useAuth();
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Check your inbox for further instructions.');
        } catch (err) {
            console.error(err);
            setError('Failed to reset password: ' + err.message);
        }
        setLoading(false);
    }

    return (
        <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
            <h2>Password Reset</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }}/>
                </div>
                <button disabled={loading} type="submit" style={{ width: '100%', padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none' }}>
                    {loading ? 'Sending...' : 'Reset Password'}
                </button>
            </form>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/login">Log In</Link>
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                Need an account? <Link to="/signup">Sign Up</Link>
            </div>
        </div>
    );
}