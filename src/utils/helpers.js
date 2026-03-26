/**
 * Format a timestamp to a readable date string
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Get status badge color class
 */
export function getStatusColor(status) {
    switch (status?.toLowerCase()) {
        case 'pending':
            return 'status-pending';
        case 'completed':
            return 'status-completed';
        default:
            return 'status-default';
    }
}

/**
 * Get issue type icon
 */
export function getIssueIcon(type) {
    const icons = {
        'Laptop Issue': '💻',
        'Internet Issue': '🌐',
        'Printer Issue': '🖨️',
        'Mobile Line Issue': '📱',
        'Monitor Issue': '🖥️',
        'Software Application': '📦',
        'Fingerprint Issue': '👆',
        'Other': '🔧',
    };
    return icons[type] || '🔧';
}

/**
 * Issue type options
 */
export const ISSUE_TYPES = [
    'Laptop Issue',
    'Internet Issue',
    'Printer Issue',
    'Mobile Line Issue',
    'Monitor Issue',
    'Software Application',
    'Fingerprint Issue',
    'Other',
];

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Generate greeting based on time of day
 */
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

/**
 * Truncate text to a max length
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
