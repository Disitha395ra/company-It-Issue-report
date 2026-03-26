import { formatDate, getIssueIcon } from '../../utils/helpers';
import './IssueStatus.css';

export default function IssueStatus({ issue }) {
    if (!issue) return null;

    const isPending = issue.status === 'Pending';
    const isCompleted = issue.status === 'Completed';

    return (
        <div className="issue-status-card" id="issue-status">
            <div className="issue-status-header">
                <h3>📋 Current Issue</h3>
                <span className={`status-badge ${isPending ? 'pending' : 'completed'}`}>
                    <span className="status-badge-dot"></span>
                    {issue.status}
                </span>
            </div>

            <div className="issue-status-body">
                <div className="issue-detail-grid">
                    <div className="issue-detail">
                        <span className="issue-detail-label">Issue Type</span>
                        <span className="issue-detail-value type">
                            {getIssueIcon(issue.issueType)} {issue.issueType}
                        </span>
                    </div>

                    <div className="issue-detail">
                        <span className="issue-detail-label">Submitted</span>
                        <span className="issue-detail-value">
                            {formatDate(issue.timestamp)}
                        </span>
                    </div>

                    <div className="issue-detail">
                        <span className="issue-detail-label">Queue Number</span>
                        <span className="issue-detail-value">
                            #{issue.queueNumber || '—'}
                        </span>
                    </div>

                    <div className="issue-detail">
                        <span className="issue-detail-label">Contact Phone</span>
                        <span className="issue-detail-value">
                            {issue.phone || '—'}
                        </span>
                    </div>

                    <div className="issue-detail">
                        <span className="issue-detail-label">Status</span>
                        <span className="issue-detail-value">
                            {isPending ? '⏳ Awaiting Resolution' : '✅ Resolved'}
                        </span>
                    </div>

                    {issue.adminResolution && (
                        <div className="issue-detail full-width">
                            <span className="issue-detail-label">Admin Response</span>
                            <span className="issue-detail-value" style={{ fontWeight: 'bold', color: 'var(--primary-700)', padding: 'var(--space-2) 0' }}>
                                {issue.adminResolution}
                            </span>
                        </div>
                    )}

                    <div className="issue-detail full-width">
                        <span className="issue-detail-label">Description</span>
                        <span className="issue-detail-value description">
                            {issue.description}
                        </span>
                    </div>
                </div>

                {issue.screenshotUrl && (
                    <div className="issue-screenshot">
                        <img src={issue.screenshotUrl} alt="Issue screenshot" loading="lazy" />
                    </div>
                )}

                {isCompleted && !issue.feedback && (
                    <div className="completed-notice">
                        <span className="completed-notice-icon">🎉</span>
                        <h4>Your issue has been resolved!</h4>
                        <p>Please provide your feedback below to close this ticket.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
