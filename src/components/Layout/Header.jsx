import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getInitials = (email) => {
        if (!email) return '?';
        return email.charAt(0).toUpperCase();
    };

    return (
        <header className={`header ${scrolled ? 'scrolled' : ''}`} id="main-header">
            <div className="header-brand">
                <div className="header-logo">🛠️</div>
                <div>
                    <h1 className="header-title">IT Support Portal</h1>
                    <p className="header-subtitle">Issue Tracking & Resolution</p>
                </div>
            </div>

            {user && (
                <div className="header-actions">
                    <div className="header-user">
                        <div className="header-avatar">{getInitials(user.email)}</div>
                        <div className="header-user-info">
                            <span className="header-user-name">{user.email}</span>
                            <span className="header-user-id">EMP#{user.empNo}</span>
                        </div>
                    </div>
                    <button
                        className="header-logout-btn"
                        onClick={logout}
                        id="logout-button"
                        aria-label="Logout"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </header>
    );
}
