import './QueueDisplay.css';

export default function QueueDisplay({ queueInfo, issue }) {
    const queueNumber = issue?.queueNumber || 0;
    const totalPending = queueInfo?.totalPending || 0;
    const progressPercent = totalPending > 0
        ? Math.max(10, Math.round(((totalPending - queueNumber + 1) / totalPending) * 100))
        : 0;

    return (
        <div className="queue-card" id="queue-display">
            <div className="queue-header">
                <h3>🎯 Queue Position</h3>
            </div>

            <div className="queue-body">
                <div className="queue-position">
                    <div className="queue-number-display">
                        <span className="queue-number">{queueNumber || '—'}</span>
                    </div>
                    <div className="queue-position-label">
                        {queueNumber === 1 ? "You're next!" : `Position #${queueNumber}`}
                    </div>
                    <div className="queue-position-subtitle">
                        {totalPending > 0
                            ? `${totalPending} issue${totalPending > 1 ? 's' : ''} in queue today`
                            : 'Queue is empty'
                        }
                    </div>
                </div>

                {totalPending > 0 && (
                    <div className="queue-progress">
                        <div className="queue-progress-bar-container">
                            <div
                                className="queue-progress-bar"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="queue-progress-info">
                            <span>Position {queueNumber} of {totalPending}</span>
                            <span>{progressPercent}% closer</span>
                        </div>
                    </div>
                )}

                <div className="queue-message">
                    <span className="queue-message-icon">💡</span>
                    <span className="queue-message-text">
                        {queueNumber === 1
                            ? 'Your issue is being addressed next. The IT team will reach out to you shortly.'
                            : `There ${queueNumber - 1 === 1 ? 'is' : 'are'} ${queueNumber - 1} issue${queueNumber - 1 > 1 ? 's' : ''} ahead of you. Queue updates automatically in real-time.`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
