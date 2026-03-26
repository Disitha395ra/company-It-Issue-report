import { useState, useEffect, useCallback, useRef } from 'react';
import sheetsApi from '../services/sheetsApi';
import { useAuth } from '../contexts/AuthContext';

const POLL_INTERVAL = 15000; // 15 seconds

export function useIssue() {
    const { user } = useAuth();
    const [activeIssue, setActiveIssue] = useState(null);
    const [queueInfo, setQueueInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const pollRef = useRef(null);

    const empNo = user?.empNo || '';

    // Fetch active issue for user
    const fetchActiveIssue = useCallback(async () => {
        if (!empNo) return;

        try {
            const result = await sheetsApi.getActiveIssue(empNo);
            if (result.success && result.issue) {
                setActiveIssue(result.issue);
            } else {
                setActiveIssue(null);
            }
        } catch (err) {
            console.error('Error fetching active issue:', err);
        }
    }, [empNo]);

    // Fetch queue status
    const fetchQueueStatus = useCallback(async () => {
        if (!empNo) return;

        try {
            const result = await sheetsApi.getQueueStatus(empNo);
            if (result.success) {
                setQueueInfo(result);
            }
        } catch (err) {
            console.error('Error fetching queue:', err);
        }
    }, [empNo]);

    // Combined fetch
    const refreshData = useCallback(async () => {
        await Promise.all([fetchActiveIssue(), fetchQueueStatus()]);
    }, [fetchActiveIssue, fetchQueueStatus]);

    // Initial fetch
    useEffect(() => {
        if (empNo) {
            setLoading(true);
            refreshData().finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [empNo, refreshData]);

    // Polling
    useEffect(() => {
        if (empNo) {
            pollRef.current = setInterval(refreshData, POLL_INTERVAL);
        }

        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
            }
        };
    }, [empNo, refreshData]);

    // Submit new issue
    const submitIssue = async ({ issueType, description, screenshotUrl }) => {
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const result = await sheetsApi.submitIssue({
                empNo,
                email: user?.email || '',
                issueType,
                description,
                screenshotUrl,
            });

            if (result.success) {
                setSuccess('Issue submitted successfully! Your queue number is ' + (result.queueNumber || 'assigned.'));
                await refreshData();
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
                empNo,
                feedback,
                rowIndex: activeIssue.rowIndex,
            });

            if (result.success) {
                setSuccess('Thank you for your feedback!');
                setActiveIssue(null);
                await refreshData();
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

    return {
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
        hasActiveIssue: !!activeIssue,
        isCompleted: activeIssue?.status === 'Completed',
        needsFeedback: activeIssue?.status === 'Completed' && !activeIssue?.feedback,
    };
}

export default useIssue;
