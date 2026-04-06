import { useState, useEffect, useCallback, useRef } from 'react';
import sheetsApi from '../services/sheetsApi';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 3000; // 3 seconds for real-time updates

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
    const pollRef = useRef(null);

    const userEmail = user?.email || '';

    // Fetch active issue for user (by email)
    const fetchActiveIssue = useCallback(async () => {
        if (!userEmail) return;

        try {
            const result = await sheetsApi.getActiveIssue(userEmail);
            if (result.success && result.issue) {
                setActiveIssue(result.issue);
            } else {
                setActiveIssue(null);
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

    // Combined fetch
    const refreshData = useCallback(async () => {
        await Promise.all([fetchActiveIssue(), fetchQueueStatus(), fetchIssueHistory(true)]);
    }, [fetchActiveIssue, fetchQueueStatus, fetchIssueHistory]);

    // Initial fetch
    useEffect(() => {
        if (userEmail) {
            setLoading(true);
            refreshData().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [userEmail, refreshData]);

    // Polling active data
    useEffect(() => {
        if (userEmail) {
            pollRef.current = setInterval(refreshData, POLL_INTERVAL);
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
            }
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
                setSuccess('Thank you for your feedback!');
                setActiveIssue(null);
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
        needsFeedback: !!activeIssue?.adminResolution && !activeIssue?.feedback,
    };
}

export default useIssue;
