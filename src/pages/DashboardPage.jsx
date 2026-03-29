import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Layout/Header';
import IssueForm from '../components/Dashboard/IssueForm';
import IssueStatus from '../components/Dashboard/IssueStatus';
import FeedbackForm from '../components/Dashboard/FeedbackForm';
import QueueDisplay from '../components/Dashboard/QueueDisplay';
import UserProfile from '../components/Dashboard/UserProfile';
import IssueHistory from '../components/Dashboard/IssueHistory';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import useIssue from '../hooks/useIssue';
import { getGreeting } from '../utils/helpers';
import './DashboardPage.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const {
        activeIssue,
        queueInfo,
        issueHistory,
        historyLoading,
        historyStats,
        loading,
        submitting,
        error,
        success,
        submitIssue,
        submitFeedback,
        refreshData,
        refreshHistory,
        clearMessages,
        hasActiveIssue,
        isCompleted,
        needsFeedback,
    } = useIssue();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setTimeout(() => setRefreshing(false), 500);
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="dashboard-page">
                    <LoadingSpinner text="Loading your dashboard..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="dashboard-page" id="dashboard-page">
                <div className="dashboard-container">
                    {/* Greeting */}
                    <div className="dashboard-greeting">
                        <h2>{getGreeting()}, {user?.email?.split('@')[0] || 'User'} 👋</h2>
                        <p>Employee #{user?.empNo} • Manage your IT support requests below</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="dashboard-tabs">
                        <button
                            className={`dashboard-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                            id="tab-dashboard"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Dashboard
                        </button>
                        <button
                            className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                            id="tab-history"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            History
                            {issueHistory.length > 0 && (
                                <span className="tab-badge">{issueHistory.length}</span>
                            )}
                        </button>
                        <button
                            className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                            id="tab-profile"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Profile
                        </button>
                    </div>

                    {/* ===== Tab: Dashboard ===== */}
                    {activeTab === 'dashboard' && (
                        <div className="dashboard-tab-content">
                            {/* Stats Row */}
                            <div className="dashboard-stats">
                                <div className="stat-card">
                                    <div className="stat-icon primary">📋</div>
                                    <div>
                                        <div className="stat-value">{(hasActiveIssue && !isCompleted) ? 1 : 0}</div>
                                        <div className="stat-label">Active Issues</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon accent">📊</div>
                                    <div>
                                        <div className="stat-value">
                                            {activeIssue?.queueNumber || '—'}
                                        </div>
                                        <div className="stat-label">Queue Position</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon warning">⏱️</div>
                                    <div>
                                        <div className="stat-value">
                                            {queueInfo?.totalPending || 0}
                                        </div>
                                        <div className="stat-label">Pending in Queue</div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon info">📁</div>
                                    <div>
                                        <div className="stat-value">{historyStats.totalIssues}</div>
                                        <div className="stat-label">Total Submitted</div>
                                    </div>
                                </div>
                            </div>

                            {/* Refresh Bar */}
                            <div className="dashboard-refresh-bar">
                                <div className="refresh-info">
                                    <span className="refresh-dot"></span>
                                    Auto-refreshing every 15 seconds
                                </div>
                                <button
                                    className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    id="refresh-button"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>

                            {/* Main Content Grid */}
                            <div className="dashboard-main-grid">
                                {/* Left Column: Form + Active Status */}
                                <div className="dashboard-left-col">
                                    <IssueForm
                                        onSubmit={submitIssue}
                                        submitting={submitting}
                                        error={error}
                                        success={success}
                                        clearMessages={clearMessages}
                                        hasActiveIssue={hasActiveIssue}
                                    />
                                </div>

                                {/* Right Column: Status + Queue + Profile Summary */}
                                <div className="dashboard-right-col">
                                    {hasActiveIssue && !isCompleted && (
                                        <>
                                            <IssueStatus issue={activeIssue} />
                                            <QueueDisplay queueInfo={queueInfo} issue={activeIssue} />
                                        </>
                                    )}

                                    {/* Sidebar Profile Mini */}
                                    <UserProfile historyStats={historyStats} />
                                </div>
                            </div>

                            {/* Feedback Modal */}
                            {hasActiveIssue && needsFeedback && (
                                <FeedbackForm
                                    issue={activeIssue}
                                    onSubmit={submitFeedback}
                                    submitting={submitting}
                                    error={error}
                                    success={success}
                                />
                            )}
                        </div>
                    )}

                    {/* ===== Tab: History ===== */}
                    {activeTab === 'history' && (
                        <div className="dashboard-tab-content">
                            <div className="dashboard-history-layout">
                                <IssueHistory
                                    issues={issueHistory}
                                    loading={historyLoading}
                                    onRefresh={refreshHistory}
                                />
                            </div>
                        </div>
                    )}

                    {/* ===== Tab: Profile ===== */}
                    {activeTab === 'profile' && (
                        <div className="dashboard-tab-content">
                            <div className="dashboard-profile-layout">
                                <UserProfile historyStats={historyStats} />

                                {/* Recent Activity */}
                                <div className="profile-recent-activity">
                                    <div className="recent-activity-header">
                                        <h3>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                            </svg>
                                            Recent Activity
                                        </h3>
                                    </div>
                                    <div className="recent-activity-list">
                                        {issueHistory.length === 0 ? (
                                            <div className="recent-activity-empty">
                                                <p>No activity to display yet.</p>
                                            </div>
                                        ) : (
                                            issueHistory.slice(0, 5).map((issue, idx) => (
                                                <div key={idx} className="recent-activity-item">
                                                    <div className="recent-activity-dot-wrapper">
                                                        <div className={`recent-activity-dot ${issue.status === 'Completed' ? 'completed' : 'pending'}`}></div>
                                                        {idx < Math.min(issueHistory.length, 5) - 1 && <div className="recent-activity-line"></div>}
                                                    </div>
                                                    <div className="recent-activity-content">
                                                        <div className="recent-activity-title">
                                                            {issue.status === 'Completed' ? 'Resolved' : 'Submitted'}: {issue.issueType}
                                                        </div>
                                                        <div className="recent-activity-time">
                                                            {issue.timestamp ? new Date(issue.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
