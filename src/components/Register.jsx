import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthService from '../utils/authService';

const Register = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await AuthService.register(email, password, username);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="login-header">
                    <h1>MoFASA Tools</h1>
                    <p>Create your account</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        Registration successful! Please check your email to verify your account.
                        Redirecting to login...
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="login-form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            required
                        />
                    </div>

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

                    <div className="login-form-group">
                        <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        required
                    />
                    <div className="password-requirements">
                        <p>Password must contain:</p>
                        <ul>
                            <li className={password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                            <li className={/[A-Z]/.test(password) ? 'met' : ''}>One uppercase letter</li>
                            <li className={/[a-z]/.test(password) ? 'met' : ''}>One lowercase letter</li>
                            <li className={/\d/.test(password) ? 'met' : ''}>One number</li>
                            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'met' : ''}>One special character</li>
                        </ul>
                    </div>
                </div>

                    <div className="login-form-group">
                        <label>Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                        required
                    />
                </div>

                    <button type="submit" className="login-button">
                        Register
                    </button>

                    <div className="login-links">
                        <Link to="/login">Already have an account? Login</Link>
                </div>
            </form>
            </div>

            <div className="login-footer">
                <p>© {new Date().getFullYear()} MoFASA Tools. All rights reserved.</p>
            </div>
        </div>
    );
};

export default Register; 