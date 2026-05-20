import { useState, useCallback, useRef, useEffect } from 'react';
import sheetsApi from '../services/sheetsApi';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 3000;

// ─── SessionStorage helpers ──────────────────────────────────────────────────
// Persists feedback-submitted state across page refreshes (within the same session).
// Keyed by the sheet rowIndex so different issues don't interfere.
const FB_KEY = 'it_portal_fb_submitted_row';

function getFbRow() {
    try { return Number(sessionStorage.getItem(FB_KEY) || 0); } catch { return 0; }
}
function setFbRow(rowIndex) {
    try { sessionStorage.setItem(FB_KEY, String(rowIndex)); } catch {}
}
function clearFbRow() {
    try { sessionStorage.removeItem(FB_KEY); } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export function useIssue() {
    const { user } = useAuth();
    const [activeIssue, setActiveIssue] = useState(null);
    const [queueInfo, setQueueInfo] = useState(null);
    const [issueHistory, setIssueHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    // Blocks the feedback panel even after refresh — persisted via sessionStorage
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const pollRef = useRef(null);

    const userEmail = user?.email || '';

    // Fetch active issue for user (by email)
    const fetchActiveIssue = useCallback(async () => {
        if (!userEmail) return;

        try {
            const result = await sheetsApi.getActiveIssue(userEmail);
            if (result.success && result.issue) {
                setActiveIssue(result.issue);

                const submittedRow = getFbRow();

                if (result.issue.feedback) {
                    // Sheet has the feedback saved — panel should never show
                    setFeedbackSubmitted(false);
                    clearFbRow();
                } else if (submittedRow === result.issue.rowIndex) {
                    // User submitted feedback this session but sheet not yet updated —
                    // keep the panel blocked
                    setFeedbackSubmitted(true);
                } else {
                    setFeedbackSubmitted(false);
                }
            } else {
                // No active issue — clear everything
                setActiveIssue(null);
                setFeedbackSubmitted(false);
                clearFbRow();
            }
        } catch (err) {
            console.error('Error fetching active issue:', err);
        }
    }, [userEmail]);

    // Fetch queue status
    const fetchQueueStatus = useCallback(async () => {
        if (!userEmail) return;

        try {
            const result = await sheetsApi.getQueueStatus(userEmail);
            if (result.success) {
                setQueueInfo(result);
            }
        } catch (err) {
            console.error('Error fetching queue:', err);
        }
    }, [userEmail]);

    // Fetch issue history
    const fetchIssueHistory = useCallback(async (isBackground = false) => {
        if (!userEmail) return;

        if (!isBackground) setHistoryLoading(true);
        try {
            const result = await sheetsApi.getIssueHistory(userEmail);
            if (result.success && result.issues) {
                setIssueHistory(result.issues);
            } else {
                setIssueHistory([]);
            }
        } catch (err) {
            console.error('Error fetching issue history:', err);
            setIssueHistory([]);
        } finally {
            if (!isBackground) setHistoryLoading(false);
        }
    }, [userEmail]);

    // Combined fetch (used by polling and manual refresh)
    const refreshData = useCallback(async () => {
        await Promise.all([fetchActiveIssue(), fetchQueueStatus(), fetchIssueHistory(true)]);
    }, [fetchActiveIssue, fetchQueueStatus, fetchIssueHistory]);

    // Initial fetch on mount / user change
    useEffect(() => {
        if (userEmail) {
            setLoading(true);
            refreshData().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [userEmail, refreshData]);

    // Polling every 3 seconds
    useEffect(() => {
        if (userEmail) {
            pollRef.current = setInterval(refreshData, POLL_INTERVAL);
        }

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [userEmail, refreshData]);

    // Submit new issue
    const submitIssue = async ({ issueType, phone, description, screenshotUrl }) => {
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const result = await sheetsApi.submitIssue({
                email: userEmail,
                phone,
                issueType,
                description,
                screenshotUrl,
                displayName: user?.displayName || '',
            });

            if (result.success) {
                setSuccess('Issue submitted successfully! Your queue number is ' + (result.queueNumber || 'assigned.'));
                await refreshData();
                fetchIssueHistory();
                return result;
            } else {
                throw new Error(result.message || 'Failed to submit issue');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    // Submit feedback
    const submitFeedback = async (feedback) => {
        if (!activeIssue) return;
        setSubmitting(true);
        setError('');

        try {
            const result = await sheetsApi.submitFeedback({
                email: userEmail,
                feedback,
                rowIndex: activeIssue.rowIndex,
            });

            if (result.success) {
                // 1. Persist to sessionStorage FIRST — survives page refresh
                setFbRow(activeIssue.rowIndex);
                // 2. Immediately block the panel in React state
                setFeedbackSubmitted(true);
                setSuccess('Thank you for your feedback!');
                setActiveIssue(null);
                // 3. Re-fetch in background (sheet may not reflect yet — that's OK)
                await refreshData();
                fetchIssueHistory();
                return result;
            } else {
                throw new Error(result.message || 'Failed to submit feedback');
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    // Computed stats from history
    const historyStats = {
        totalIssues: issueHistory.length,
        resolvedIssues: issueHistory.filter(i => i.status === 'Completed' || i.status === 'Not Completed').length,
        pendingIssues: issueHistory.filter(i => i.status === 'Pending' || i.status === 'In Progress').length,
    };

    return {
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
        refreshHistory: () => fetchIssueHistory(false),
        clearMessages,
        hasActiveIssue: !!activeIssue,
        isCompleted: activeIssue?.status === 'Completed' || activeIssue?.status === 'Not Completed',
        // Panel blocked if: (1) feedback just submitted in this session  OR
        //                   (2) still waiting for sheet to reflect it on refresh
        needsFeedback: !!activeIssue?.adminResolution && !activeIssue?.feedback && !feedbackSubmitted,
    };
}

export default useIssue;
