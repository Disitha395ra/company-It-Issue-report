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

    async _request(action, data = {}) {
        await this._checkConfig();
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({ action, ...data }),
            });

            // With no-cors, we can't read the response
            // So we'll use GET requests with query params for reads
            // and POST for writes, then verify via GET
            return { success: true };
        } catch (error) {
            console.error(`API Error [${action}]:`, error);
            throw new Error(`Failed to ${action}: ${error.message}`);
        }
    }

    async _get(action, params = {}) {
        await this._checkConfig();
        try {
            // Add _t query param to bust aggressive browser cache of GET requests
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
    async submitIssue({ empNo, email, phone, issueType, description, screenshotUrl }) {
        return this._post('submitIssue', {
            empNo,
            email,
            phone,
            issueType,
            description,
            screenshotUrl: screenshotUrl || '',
        });
    }

    /**
     * Get the active issue for a specific employee
     */
    async getActiveIssue(empNo) {
        return this._get('getActiveIssue', { empNo });
    }

    /**
     * Submit feedback for a completed issue
     */
    async submitFeedback({ empNo, feedback, rowIndex }) {
        return this._post('submitFeedback', {
            empNo,
            feedback,
            rowIndex,
        });
    }

    /**
     * Get queue status for display
     */
    async getQueueStatus(empNo) {
        return this._get('getQueueStatus', { empNo });
    }

    /**
     * Get all pending issues count for queue display
     */
    async getPendingCount() {
        return this._get('getPendingCount');
    }

    /**
     * Get issue history for a specific employee
     * Returns all past submitted issues (completed + feedback given)
     */
    async getIssueHistory(empNo) {
        return this._get('getIssueHistory', { empNo });
    }
}

const sheetsApi = new SheetsApiService();
export default sheetsApi;
