import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Layout/Header';
import IssueForm from '../components/Dashboard/IssueForm';
import IssueStatus from '../components/Dashboard/IssueStatus';
import FeedbackForm from '../components/Dashboard/FeedbackForm';
import QueueDisplay from '../components/Dashboard/QueueDisplay';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import useIssue from '../hooks/useIssue';
import { getGreeting } from '../utils/helpers';
import './DashboardPage.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const {
        activeIssue,
        queueInfo,
        loading,
        submitting,
        error,
        success,
        submitIssue,
        submitFeedback,
        refreshData,
        clearMessages,
        hasActiveIssue,
        isCompleted,
        needsFeedback,
    } = useIssue();

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

                    {/* Stats */}
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

                    {/* Content */}
                    <div className="dashboard-content">
                        {/* Issue Form (Always visible, but blocks if user has an active issue) */}
                        <IssueForm
                            onSubmit={submitIssue}
                            submitting={submitting}
                            error={error}
                            success={success}
                            clearMessages={clearMessages}
                            hasActiveIssue={hasActiveIssue}
                        />

                        {/* Active Issue - Pending → Show Status */}
                        {hasActiveIssue && !isCompleted && (
                            <div className="dashboard-status-section">
                                <IssueStatus issue={activeIssue} />
                                <QueueDisplay queueInfo={queueInfo} issue={activeIssue} />
                            </div>
                        )}

                        {/* Active Issue - Completed, Needs Feedback */}
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
                </div>
            </div>
        </>
    );
}
