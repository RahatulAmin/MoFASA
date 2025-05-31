import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../utils/authService';

const ResetPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            await AuthService.resetPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>MoFASA Tools</h1>
                    <p>Reset your password</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        Password reset email sent. Please check your inbox.
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="login-form-group">
                        <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                        required
                    />
                </div>

                    <button type="submit" className="login-button">
                        Send Reset Link
                    </button>

                    <div className="login-links">
                        <Link to="/login">Remember your password? Login</Link>
                </div>
            </form>
            </div>

            <div className="login-footer">
                <p>© {new Date().getFullYear()} MoFASA Tools. All rights reserved.</p>
            </div>
        </div>
    );
};

export default ResetPassword; 