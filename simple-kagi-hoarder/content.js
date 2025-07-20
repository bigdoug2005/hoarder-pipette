// Content script for Kagi search pages
(function() {
    'use strict';

    let hoarderContainer = null;
    let rightColumn = null;

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

    // Create fixed right column for Hoarder results
    function createRightColumn() {
        // Check if we already have a right column
        if (rightColumn && document.body.contains(rightColumn)) {
            return rightColumn;
        }

        // Create the fixed right column
        rightColumn = document.createElement('div');
        rightColumn.className = 'hoarder-right-column';
        
        // Append to body for fixed positioning
        document.body.appendChild(rightColumn);

        return rightColumn;
    }

    // Add margin to main content to make space for fixed right column
    function addMainContentMargin() {
        // Find Kagi's main content containers
        const mainContainers = [
            document.querySelector('.center-content-box'),
            document.querySelector('.app-content-box'),
            document.querySelector('#main'),
            document.querySelector('._0_content-area'),
            document.querySelector('.main-app-content')
        ].filter(el => el);

        mainContainers.forEach(container => {
            if (container && !container.classList.contains('hoarder-main-content-margin')) {
                container.classList.add('hoarder-main-content-margin');
            }
        });
    }

    // Remove margin from main content
    function removeMainContentMargin() {
        const containers = document.querySelectorAll('.hoarder-main-content-margin');
        containers.forEach(container => {
            container.classList.remove('hoarder-main-content-margin');
        });
    }

    // Find or create insertion point for Hoarder results
    function findInsertionPoint() {
        // First try existing Kagi right sidebar (if it exists and is visible)
        const existingRightSidebar = document.querySelector('.right-content-box ._0_right_sidebar') ||
                                    document.querySelector('.right-content-box');
        
        if (existingRightSidebar && existingRightSidebar.offsetWidth > 50) {
            // Use existing sidebar if it's actually visible/wide enough
            removeMainContentMargin(); // Don't need margin if using existing sidebar
            return existingRightSidebar;
        }

        // Create our fixed right column and add margin to main content
        addMainContentMargin();
        return createRightColumn();
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
        
        // Find or create the right column for Hoarder results
        const targetColumn = findInsertionPoint();
        if (!targetColumn) {
            console.log('Could not create right column for Hoarder results');
            return;
        }

        // Insert container into the right column
        targetColumn.appendChild(hoarderContainer);

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

        // Wait for Kagi to render its layout, try multiple times if needed
        let attempts = 0;
        const maxAttempts = 5;
        
        function tryInject() {
            attempts++;
            
            // Check if right sidebar exists or main content is available
            const rightSidebar = document.querySelector('.right-content-box') || 
                                document.querySelector('._0_right_sidebar');
            const mainContent = document.querySelector('#main') ||
                               document.querySelector('._0_main-search-results');
            
            if (rightSidebar || mainContent || attempts >= maxAttempts) {
                injectHoarderResults();
            } else {
                // Wait a bit longer and try again
                setTimeout(tryInject, 500);
            }
        }
        
        // Start with initial delay
        setTimeout(tryInject, 1000);
    }

    // Cleanup function
    function cleanup() {
        if (hoarderContainer) {
            hoarderContainer.remove();
            hoarderContainer = null;
        }
        if (rightColumn) {
            rightColumn.remove();
            rightColumn = null;
        }
        removeMainContentMargin();
    }

    // Handle navigation changes (for SPA-like behavior)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            cleanup(); // Clean up before reinserting
            setTimeout(injectHoarderResults, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Start
    init();
})();