const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

class SheetsApiService {
    constructor() {
        this.baseUrl = API_URL;
    }

    async _checkConfig() {
        if (!this.baseUrl || this.baseUrl === 'dummy') {
            throw new Error('Google Apps Script URL is not configured. Please contact the administrator.');
        }
    }

    async _get(action, params = {}) {
        await this._checkConfig();
        try {
            const queryParams = new URLSearchParams({
                action,
                ...params,
                _t: Date.now().toString()
            });
            const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`, {
                method: 'GET',
                redirect: 'follow',
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`API Error [${action}]:`, error);
            throw new Error(`Failed to ${action}: ${error.message}`);
        }
    }

    async _post(action, data = {}) {
        await this._checkConfig();
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({ action, ...data }),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`API Error [${action}]:`, error);
            throw new Error(`Failed to ${action}: ${error.message}`);
        }
    }

    /**
     * Submit a new issue to Google Sheet
     */
    async submitIssue({ email, phone, issueType, description, screenshotUrl, displayName }) {
        return this._post('submitIssue', {
            email,
            phone,
            issueType,
            description,
            screenshotUrl: screenshotUrl || '',
            displayName: displayName || '',
        });
    }

    /**
     * Get the active issue for a specific user (by email)
     */
    async getActiveIssue(email) {
        return this._get('getActiveIssue', { email });
    }

    /**
     * Submit feedback for a completed issue
     */
    async submitFeedback({ email, feedback, rowIndex }) {
        return this._post('submitFeedback', {
            email,
            feedback,
            rowIndex,
        });
    }

    /**
     * Get queue status for display
     */
    async getQueueStatus(email) {
        return this._get('getQueueStatus', { email });
    }

    /**
     * Get all pending issues count for queue display
     */
    async getPendingCount() {
        return this._get('getPendingCount');
    }

    /**
     * Get issue history for a specific user (by email)
     */
    async getIssueHistory(email) {
        return this._get('getIssueHistory', { email });
    }
}

const sheetsApi = new SheetsApiService();
export default sheetsApi;
