import { useState } from 'react';
import { formatDate, getIssueIcon } from '../../utils/helpers';
import './IssueHistory.css';

export default function IssueHistory({ issues, loading, onRefresh }) {
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'

    const filteredIssues = issues.filter((issue) => {
        if (filter === 'completed') return issue.status === 'Completed' || issue.status === 'Not Completed';
        if (filter === 'pending') return issue.status === 'Pending' || issue.status === 'In Progress';
        return true;
    });

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="history-card" id="issue-history">
                <div className="history-header">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Issue History
                    </h3>
                </div>
                <div className="history-loading">
                    <div className="history-loading-spinner"></div>
                    <p>Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="history-card" id="issue-history">
            {/* Header */}
            <div className="history-header">
                <div className="history-header-left">
                    <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Issue History
                    </h3>
                    <span className="history-count">{filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}</span>
                </div>
                <button className="history-refresh-btn" onClick={onRefresh} title="Refresh history">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="history-filters">
                <button
                    className={`history-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`history-filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    ✅ Resolved
                </button>
                <button
                    className={`history-filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    ⏳ Pending
                </button>
            </div>

            {/* Issue List */}
            <div className="history-list">
                {filteredIssues.length === 0 ? (
                    <div className="history-empty">
                        <div className="history-empty-icon">📭</div>
                        <h4>No issues found</h4>
                        <p>
                            {filter === 'all'
                                ? "You haven't submitted any issues yet."
                                : `No ${filter} issues to display.`}
                        </p>
                    </div>
                ) : (
                    filteredIssues.map((issue, index) => (
                        <div
                            key={issue.rowIndex || index}
                            className={`history-item ${expandedId === (issue.rowIndex || index) ? 'expanded' : ''}`}
                            onClick={() => toggleExpand(issue.rowIndex || index)}
                        >
                            <div className="history-item-main">
                                <div className="history-item-icon">
                                    {getIssueIcon(issue.issueType)}
                                </div>
                                <div className="history-item-info">
                                    <div className="history-item-type">{issue.issueType}</div>
                                    <div className="history-item-date">{formatDate(issue.timestamp)}</div>
                                </div>
                                <div className="history-item-right">
                                    <span className={`history-status-badge ${
                                        issue.status === 'Completed' ? 'resolved' : 
                                        issue.status === 'Not Completed' ? 'rejected' : 
                                        issue.status === 'In Progress' ? 'in-progress' : 'pending'
                                    }`}>
                                        {issue.status === 'Completed' ? '✅ Resolved' : 
                                         issue.status === 'Not Completed' ? '❌ Not Completed' :
                                         issue.status === 'In Progress' ? '🔄 In Progress' : '⏳ Pending'}
                                    </span>
                                    <svg className={`history-item-chevron ${expandedId === (issue.rowIndex || index) ? 'rotated' : ''}`}
                                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {expandedId === (issue.rowIndex || index) && (
                                <div className="history-item-detail" onClick={(e) => e.stopPropagation()}>
                                    <div className="history-detail-row">
                                        <span className="history-detail-label">Description</span>
                                        <span className="history-detail-value">{issue.description}</span>
                                    </div>
                                    {issue.queueNumber && (
                                        <div className="history-detail-row">
                                            <span className="history-detail-label">Queue #</span>
                                            <span className="history-detail-value">#{issue.queueNumber}</span>
                                        </div>
                                    )}
                                    {issue.phone && (
                                        <div className="history-detail-row">
                                            <span className="history-detail-label">Contact</span>
                                            <span className="history-detail-value">{issue.phone}</span>
                                        </div>
                                    )}
                                    {issue.adminResolution && (
                                        <div className="history-detail-row">
                                            <span className="history-detail-label">Resolution</span>
                                            <span className="history-detail-value highlight">{issue.adminResolution}</span>
                                        </div>
                                    )}
                                    {issue.feedback && (
                                        <div className="history-detail-row">
                                            <span className="history-detail-label">Your Feedback</span>
                                            <span className="history-detail-value feedback">"{issue.feedback}"</span>
                                        </div>
                                    )}
                                    {issue.screenshotUrl && (
                                        <div className="history-detail-row">
                                            <span className="history-detail-label">Screenshot</span>
                                            <a href={issue.screenshotUrl} target="_blank" rel="noopener noreferrer" className="history-screenshot-link">
                                                View Screenshot →
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
