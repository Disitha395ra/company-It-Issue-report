import { useState } from 'react';
import IssueStatus from './IssueStatus';
import LoadingSpinner from '../UI/LoadingSpinner';
import './FeedbackForm.css';

const STAR_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

export default function FeedbackForm({ issue, onSubmit, submitting, error, success }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [fieldError, setFieldError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setFieldError('Please select a rating');
            return;
        }

        const feedbackText = `Rating: ${rating}/5 ${STAR_LABELS[rating]}${comment ? ` | Comment: ${comment}` : ''}`;

        try {
            await onSubmit(feedbackText);
        } catch (err) {
            // Error handled by parent
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <>
            {/* Show the issue details behind the modal as a faded background via CSS */}
            <div style={{ filter: 'blur(3px)', pointerEvents: 'none' }}>
                <IssueStatus issue={issue} />
            </div>

            {/* Modal Overlay / Popup */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
                <div className="feedback-card" id="feedback-form" style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--surface-0)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-xl)' }}>
                    <div className="feedback-header">
                        <span className="feedback-header-icon" style={{ fontSize: '3rem', display: 'block', textAlign: 'center', marginBottom: 'var(--space-3)' }}>🎉</span>
                        <h3 style={{ textAlign: 'center', color: 'var(--text-900)' }}>Task Finished!</h3>

                        <div style={{ backgroundColor: 'var(--surface-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', margin: 'var(--space-4) 0', textAlign: 'center', border: '1px solid var(--surface-200)' }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--primary-700)' }}>Topic: {issue.issueType}</p>
                            <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-600)' }}>Status: {issue.adminResolution || 'Completed'}</p>
                            <p style={{ margin: 'var(--space-2) 0 0 0', color: 'var(--text-800)', fontSize: '0.9rem', fontStyle: 'italic', wordBreak: 'break-word' }}>"{issue.description}"</p>
                        </div>

                        <p style={{ textAlign: 'center', color: 'var(--text-600)' }}>Please take a moment to share your experience</p>
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

                        {/* Star Rating */}
                        <div className="form-group">
                            <label className="form-label" style={{ justifyContent: 'center' }}>
                                How would you rate the support?
                            </label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${star <= displayRating ? 'active' : ''}`}
                                        onClick={() => {
                                            setRating(star);
                                            setFieldError('');
                                        }}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>
                            <div className="star-label">
                                {displayRating > 0 ? STAR_LABELS[displayRating] : 'Select a rating'}
                            </div>
                            {fieldError && (
                                <div className="form-error" style={{ justifyContent: 'center' }}>
                                    ⚠ {fieldError}
                                </div>
                            )}
                        </div>

                        {/* Comment */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="feedback-comment">
                                <span className="form-label-icon">💬</span>
                                Additional Comments (Optional)
                            </label>
                            <textarea
                                id="feedback-comment"
                                className="feedback-textarea"
                                placeholder="Share your experience with the IT team..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={500}
                            />
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
