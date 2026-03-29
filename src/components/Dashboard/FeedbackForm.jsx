import { useState } from 'react';
import IssueStatus from './IssueStatus';
import LoadingSpinner from '../UI/LoadingSpinner';
import './FeedbackForm.css';

export default function FeedbackForm({ issue, onSubmit, submitting, error, success }) {
    const [comment, setComment] = useState('');
    const [fieldError, setFieldError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            setFieldError('Please share your feedback before submitting');
            return;
        }

        const feedbackText = comment.trim();

        try {
            await onSubmit(feedbackText);
        } catch (err) {
            // Error handled by parent
        }
    };

    return (
        <>
            {/* Show the issue details behind the modal as a faded background via CSS */}
            <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                <IssueStatus issue={issue} />
            </div>

            {/* Modal Overlay / Popup */}
            <div className="feedback-overlay">
                <div className="feedback-card" id="feedback-form">
                    <div className="feedback-header">
                        <span className="feedback-header-icon">🎉</span>
                        <h3>Task Finished!</h3>

                        <div className="feedback-issue-summary">
                            <p className="feedback-issue-topic">Topic: {issue.issueType}</p>
                            <p className="feedback-issue-status">Status: {issue.adminResolution || 'Completed'}</p>
                            <p className="feedback-issue-desc">"{issue.description}"</p>
                        </div>

                        <p className="feedback-prompt-text">Please take a moment to share your experience</p>
                    </div>

                    <form className="feedback-body" onSubmit={handleSubmit} noValidate>
                        {/* Messages */}
                        {success && (
                            <div className="form-message success">
                                ✅ {success}
                            </div>
                        )}
                        {error && (
                            <div className="form-message error">
                                ❌ {error}
                            </div>
                        )}

                        {/* Comment */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="feedback-comment">
                                <span className="form-label-icon">💬</span>
                                Your Feedback
                            </label>
                            <textarea
                                id="feedback-comment"
                                className="feedback-textarea"
                                placeholder="Share your experience with the IT team..."
                                value={comment}
                                onChange={(e) => {
                                    setComment(e.target.value);
                                    if (fieldError) setFieldError('');
                                }}
                                maxLength={500}
                            />
                            <div className="feedback-char-count">
                                {comment.length}/500
                            </div>
                            {fieldError && (
                                <div className="form-error">
                                    ⚠ {fieldError}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="feedback-submit-btn"
                            disabled={submitting}
                            id="submit-feedback-button"
                        >
                            {submitting ? (
                                <>
                                    <LoadingSpinner small />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Feedback
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
