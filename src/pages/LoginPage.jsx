import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import './LoginPage.css';

export default function LoginPage() {
    const { login, error: authError, clearError, loading } = useAuth();
    const [empNo, setEmpNo] = useState('');
    const [email, setEmail] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const errors = {};
        if (!empNo.trim()) errors.empNo = 'Employee number is required';
        if (!email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await login(empNo.trim(), email.trim());
        } catch (err) {
            // Error is handled in AuthContext
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page" id="login-page">
            {/* Branding Panel */}
            <div className="login-branding">
                <div className="login-shape login-shape-1"></div>
                <div className="login-shape login-shape-2"></div>
                <div className="login-shape login-shape-3"></div>

                <div className="login-branding-content">
                    <div className="login-branding-icon">🛠️</div>
                    <h2>IT Support Portal</h2>
                    <p>Submit, track, and resolve IT issues quickly and efficiently.</p>
                    <ul className="login-features">
                        <li>Submit issues with screenshots</li>
                        <li>Real-time queue tracking</li>
                        <li>Status updates & notifications</li>
                        <li>Quick feedback system</li>
                    </ul>
                </div>
            </div>

            {/* Form Panel */}
            <div className="login-form-panel">
                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in with your employee credentials to continue</p>
                    </div>

                    {authError && (
                        <div className="login-alert">
                            <span className="login-alert-icon">⚠️</span>
                            <span className="login-alert-text">{authError}</span>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="empNo">
                                <span className="form-label-icon">🏢</span>
                                Employee Number
                            </label>
                            <input
                                id="empNo"
                                type="text"
                                className={`form-input ${fieldErrors.empNo ? 'error' : ''}`}
                                placeholder="e.g., EMP001"
                                value={empNo}
                                onChange={(e) => {
                                    setEmpNo(e.target.value);
                                    if (fieldErrors.empNo) setFieldErrors((p) => ({ ...p, empNo: '' }));
                                }}
                                autoComplete="username"
                            />
                            {fieldErrors.empNo && (
                                <div className="form-error">⚠ {fieldErrors.empNo}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                <span className="form-label-icon">📧</span>
                                Company Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                                }}
                                autoComplete="email"
                            />
                            {fieldErrors.email && (
                                <div className="form-error">⚠ {fieldErrors.email}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ display: 'none' }}>
                            {/* Password visually removed, internally driven by empNo */}
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={isSubmitting}
                            id="login-submit-button"
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner small />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
