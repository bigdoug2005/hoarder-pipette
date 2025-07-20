// Content script for Kagi search pages
(function() {
    'use strict';

    let hoarderContainer = null;

    // Extract search query from Kagi URL
    function getSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q') || '';
    }

    // Create Hoarder API client
    async function createHoarderClient() {
        const result = await chrome.storage.sync.get(['hoarderUrl', 'apiKey']);
        if (!result.hoarderUrl || !result.apiKey) {
            return null;
        }
        
        return {
            baseUrl: result.hoarderUrl.replace(/\/$/, '') + '/api/v1',
            apiKey: result.apiKey
        };
    }

    // Search Hoarder bookmarks
    async function searchHoarderBookmarks(query) {
        const client = await createHoarderClient();
        if (!client) {
            throw new Error('Hoarder not configured');
        }

        const searchUrl = `${client.baseUrl}/bookmarks/search?q=${encodeURIComponent(query)}&limit=5`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${client.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.bookmarks || [];
    }

    // Create bookmark HTML element
    function createBookmarkElement(bookmark) {
        const div = document.createElement('div');
        div.className = 'hoarder-bookmark';
        
        const title = bookmark.title || (bookmark.content && bookmark.content.title) || 'Untitled';
        const url = bookmark.content && bookmark.content.url ? bookmark.content.url : '#';
        const description = bookmark.content && bookmark.content.description ? bookmark.content.description : '';
        
        div.innerHTML = `
            <a href="${url}" class="hoarder-bookmark-title" target="_blank">${escapeHtml(title)}</a>
            <div class="hoarder-bookmark-url">${escapeHtml(url)}</div>
            ${description ? `<div class="hoarder-bookmark-description">${escapeHtml(description)}</div>` : ''}
            ${bookmark.tags && bookmark.tags.length > 0 ? `
                <div class="hoarder-bookmark-tags">
                    ${bookmark.tags.map(tag => `<span class="hoarder-bookmark-tag">${escapeHtml(tag.name)}</span>`).join('')}
                </div>
            ` : ''}
        `;
        
        return div;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create Hoarder results container
    function createHoarderContainer() {
        const container = document.createElement('div');
        container.className = 'hoarder-results';
        container.innerHTML = `
            <h3>
                <span class="hoarder-icon"></span>
                Your Hoarder Bookmarks
            </h3>
            <div class="hoarder-content">
                <div class="hoarder-loading">Searching your bookmarks...</div>
            </div>
        `;
        return container;
    }

    // Update Hoarder container with results
    function updateHoarderContainer(bookmarks, error = null) {
        if (!hoarderContainer) return;
        
        const contentDiv = hoarderContainer.querySelector('.hoarder-content');
        
        if (error) {
            if (error.message === 'Hoarder not configured') {
                contentDiv.innerHTML = `
                    <div class="hoarder-error">
                        Hoarder not configured. 
                        <button class="hoarder-configure" onclick="chrome.runtime.openOptionsPage?.() || window.open(chrome.runtime.getURL('popup.html'))">
                            Configure
                        </button>
                    </div>
                `;
            } else {
                contentDiv.innerHTML = `<div class="hoarder-error">Error: ${escapeHtml(error.message)}</div>`;
            }
            return;
        }

        if (bookmarks.length === 0) {
            contentDiv.innerHTML = '<div class="hoarder-no-results">No matching bookmarks found</div>';
            return;
        }

        contentDiv.innerHTML = '';
        bookmarks.forEach(bookmark => {
            contentDiv.appendChild(createBookmarkElement(bookmark));
        });
    }

    // Find where to insert Hoarder results in Kagi
    function findInsertionPoint() {
        // Try to find the main search results container
        const searchResults = document.querySelector('#main') || 
                             document.querySelector('.search-result') ||
                             document.querySelector('[data-testid="web-results"]') ||
                             document.querySelector('.search-results');
        
        if (searchResults) {
            // Insert after the first result or at the beginning
            const firstResult = searchResults.querySelector('.search-result:first-child') ||
                               searchResults.querySelector('[data-testid="web-result"]:first-child') ||
                               searchResults.firstElementChild;
            
            return firstResult ? firstResult.nextSibling : searchResults.firstChild;
        }
        
        return null;
    }

    // Main function to inject Hoarder results
    async function injectHoarderResults() {
        const query = getSearchQuery();
        if (!query) return;

        // Remove existing container
        if (hoarderContainer) {
            hoarderContainer.remove();
        }

        // Create new container
        hoarderContainer = createHoarderContainer();
        
        // Find insertion point
        const insertionPoint = findInsertionPoint();
        if (!insertionPoint) {
            console.log('Could not find insertion point for Hoarder results');
            return;
        }

        // Insert container
        if (insertionPoint.parentNode) {
            insertionPoint.parentNode.insertBefore(hoarderContainer, insertionPoint);
        }

        // Search bookmarks
        try {
            const bookmarks = await searchHoarderBookmarks(query);
            updateHoarderContainer(bookmarks);
        } catch (error) {
            console.error('Hoarder search error:', error);
            updateHoarderContainer([], error);
        }
    }

    // Initialize when page loads
    function init() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Wait a bit for Kagi to render results
        setTimeout(() => {
            injectHoarderResults();
        }, 1000);
    }

    // Handle navigation changes (for SPA-like behavior)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(injectHoarderResults, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

    // Start
    init();
})();