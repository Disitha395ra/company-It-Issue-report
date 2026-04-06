import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import './LoginPage.css';

export default function LoginPage() {
    const { loginWithGoogle, error: authError, clearError } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleGoogleSignIn = async () => {
        clearError();
        setIsSigningIn(true);
        try {
            await loginWithGoogle();
        } catch (err) {
            // Error already set in AuthContext
        } finally {
            setIsSigningIn(false);
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
                        <li>Status updates &amp; notifications</li>
                        <li>Quick feedback system</li>
                    </ul>
                </div>
            </div>

            {/* Form Panel */}
            <div className="login-form-panel">
                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <h1>Welcome</h1>
                        <p>Sign in with your <strong>@scot.lk</strong> Google account to continue</p>
                    </div>

                    {authError && (
                        <div className="login-alert">
                            <span className="login-alert-icon">⚠️</span>
                            <span className="login-alert-text">{authError}</span>
                        </div>
                    )}

                    <div className="login-google-section">
                        <button
                            id="google-signin-button"
                            className="login-google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                        >
                            {isSigningIn ? (
                                <>
                                    <LoadingSpinner small />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Sign in with Google</span>
                                </>
                            )}
                        </button>

                        <div className="login-domain-notice">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            Only authorized <strong>@scot.lk</strong> accounts can access this portal
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
