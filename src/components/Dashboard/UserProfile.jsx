import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

export default function UserProfile({ historyStats }) {
    const { user } = useAuth();

    if (!user) return null;

    const displayName = user.email?.split('@')[0] || 'User';
    const initials = displayName.charAt(0).toUpperCase();
    const domain = user.email?.split('@')[1] || '';
    const memberSince = new Date().getFullYear();

    return (
        <div className="profile-card" id="user-profile">
            {/* Profile Banner */}
            <div className="profile-banner">
                <div className="profile-banner-pattern"></div>
            </div>

            {/* Avatar */}
            <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                    <span className="profile-avatar-text">{initials}</span>
                </div>
                <div className="profile-status-indicator" title="Online"></div>
            </div>

            {/* User Info */}
            <div className="profile-info">
                <h3 className="profile-name">{displayName}</h3>
                <p className="profile-role">Employee</p>
            </div>

            {/* Details */}
            <div className="profile-details">
                <div className="profile-detail-item">
                    <div className="profile-detail-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                    </div>
                    <div className="profile-detail-content">
                        <span className="profile-detail-label">Email</span>
                        <span className="profile-detail-value">{user.email}</span>
                    </div>
                </div>

                <div className="profile-detail-item">
                    <div className="profile-detail-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                    </div>
                    <div className="profile-detail-content">
                        <span className="profile-detail-label">Employee ID</span>
                        <span className="profile-detail-value">EMP#{user.empNo}</span>
                    </div>
                </div>

                <div className="profile-detail-item">
                    <div className="profile-detail-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <div className="profile-detail-content">
                        <span className="profile-detail-label">Organization</span>
                        <span className="profile-detail-value">{domain || 'Company'}</span>
                    </div>
                </div>

                <div className="profile-detail-item">
                    <div className="profile-detail-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="profile-detail-content">
                        <span className="profile-detail-label">Member Since</span>
                        <span className="profile-detail-value">{memberSince}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="profile-quick-stats">
                <div className="profile-quick-stat">
                    <span className="profile-quick-stat-value">{historyStats?.totalIssues || 0}</span>
                    <span className="profile-quick-stat-label">Total</span>
                </div>
                <div className="profile-stat-divider"></div>
                <div className="profile-quick-stat">
                    <span className="profile-quick-stat-value resolved">{historyStats?.resolvedIssues || 0}</span>
                    <span className="profile-quick-stat-label">Resolved</span>
                </div>
                <div className="profile-stat-divider"></div>
                <div className="profile-quick-stat">
                    <span className="profile-quick-stat-value pending">{historyStats?.pendingIssues || 0}</span>
                    <span className="profile-quick-stat-label">Pending</span>
                </div>
            </div>
        </div>
    );
}
