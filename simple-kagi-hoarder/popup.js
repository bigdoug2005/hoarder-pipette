document.addEventListener('DOMContentLoaded', async () => {
    const hoarderUrlInput = document.getElementById('hoarderUrl');
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const testBtn = document.getElementById('testBtn');
    const statusDiv = document.getElementById('status');

    // Load saved settings
    const result = await chrome.storage.sync.get(['hoarderUrl', 'apiKey']);
    if (result.hoarderUrl) hoarderUrlInput.value = result.hoarderUrl;
    if (result.apiKey) apiKeyInput.value = result.apiKey;

    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${isError ? 'error' : 'success'}`;
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, 3000);
    }

    async function testConnection() {
        const url = hoarderUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!url || !apiKey) {
            showStatus('Please fill in both URL and API key', true);
            return;
        }

        try {
            testBtn.textContent = 'Testing...';
            testBtn.disabled = true;

            const response = await fetch(`${url}/api/v1/users/me`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showStatus('Connection successful!');
            } else {
                showStatus(`Connection failed: ${response.status}`, true);
            }
        } catch (error) {
            showStatus(`Connection error: ${error.message}`, true);
        } finally {
            testBtn.textContent = 'Test Connection';
            testBtn.disabled = false;
        }
    }

    async function saveSettings() {
        const url = hoarderUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!url || !apiKey) {
            showStatus('Please fill in both URL and API key', true);
            return;
        }

        try {
            await chrome.storage.sync.set({
                hoarderUrl: url,
                apiKey: apiKey
            });
            showStatus('Settings saved successfully!');
        } catch (error) {
            showStatus(`Save error: ${error.message}`, true);
        }
    }

    saveBtn.addEventListener('click', saveSettings);
    testBtn.addEventListener('click', testConnection);
});