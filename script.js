// Import storage functions
import { getUserIds, getData, setData } from "./storage.js";

// Task 1.6: Timestamp Generation
function getCurrentTimestamp() {
    return Date.now();
}

// Task 1.2: Data Transformation - Format bookmark for storage
function formatBookmarkForStorage(url, title, description, timestamp = null) {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random(),
        url: url,
        title: title,
        description: description,
        timestamp: timestamp || getCurrentTimestamp(),
        likes: 0
    };
}

// Task 1.2: Get bookmarks for a user (returns empty array if none exist)
export function getUserBookmarks(userId) {
    const data = getData(userId);
    if (!data || !Array.isArray(data)) {
        return [];
    }
    return data;
}

// Task 1.2: Save bookmarks for a user
export function saveUserBookmarks(userId, bookmarks) {
    setData(userId, bookmarks);
}

// Task 1.2: Add new bookmark
export function addBookmark(userId, url, title, description) {
    if (!url || !title) {
        throw new Error('URL and title are required');
    }
    
    const bookmarks = getUserBookmarks(userId);
    const newBookmark = formatBookmarkForStorage(url, title, description);
    bookmarks.push(newBookmark);
    saveUserBookmarks(userId, bookmarks);
    return newBookmark;
}

// Task 1.2: Get bookmarks in reverse chronological order
export function getBookmarksReverseChronological(userId) {
    const bookmarks = getUserBookmarks(userId);
    return [...bookmarks].sort((a, b) => b.timestamp - a.timestamp);
}

// Task 1.3: Increment like count for a bookmark
export function incrementLike(userId, bookmarkId) {
    const bookmarks = getUserBookmarks(userId);
    const bookmarkIndex = bookmarks.findIndex(b => b.id === bookmarkId);
    
    if (bookmarkIndex === -1) {
        throw new Error('Bookmark not found');
    }
    
    bookmarks[bookmarkIndex].likes = (bookmarks[bookmarkIndex].likes || 0) + 1;
    saveUserBookmarks(userId, bookmarks);
    return bookmarks[bookmarkIndex].likes;
}

// Task 1.3: Get like count for a bookmark
export function getLikeCount(userId, bookmarkId) {
    const bookmarks = getUserBookmarks(userId);
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    return bookmark ? (bookmark.likes || 0) : 0;
}

// Task 1.5: Copy URL to clipboard
export async function copyToClipboard(url) {
    try {
        await navigator.clipboard.writeText(url);
        return true;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

// Task 1.2: Validate URL format
export function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Helper: Get userId from selected option value
function getSelectedUserId() {
    const userSelect = document.getElementById('userSelect');
    const selectedValue = userSelect.value;
    
    // Extract user ID from values like "user1" or just use as-is
    if (selectedValue.startsWith('user')) {
        return selectedValue.replace('user', '');
    }
    return selectedValue;
}

// Task 2.3: Format timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Task 2.3: Render bookmarks list
function renderBookmarks(userId) {
    const container = document.getElementById('bookmarksContainer');
    
    if (!userId) {
        container.innerHTML = '<div class="empty-message">Please select a user</div>';
        return;
    }
    
    const bookmarks = getBookmarksReverseChronological(userId);
    
    // Task 2.2: Handle empty state
    if (!bookmarks || bookmarks.length === 0) {
        container.innerHTML = '<div class="empty-message" role="status">No bookmarks yet. Add your first bookmark below!</div>';
        return;
    }
    
    // Task 2.3: Render each bookmark
    const bookmarksHtml = bookmarks.map(bookmark => `
        <div class="bookmark" data-bookmark-id="${bookmark.id}">
            <div class="bookmark-title">
                <a href="${escapeHtml(bookmark.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(bookmark.title)}</a>
            </div>
            <div class="bookmark-description">${escapeHtml(bookmark.description || 'No description')}</div>
            <div class="bookmark-timestamp">Added: ${formatTimestamp(bookmark.timestamp)}</div>
            <div class="bookmark-actions">
                <button class="like-button" data-action="like" data-id="${bookmark.id}" 
                        aria-label="Like this bookmark">❤️ <span class="like-count">${bookmark.likes || 0}</span></button>
                <button class="copy-button" data-action="copy" data-url="${escapeHtml(bookmark.url)}" 
                        data-id="${bookmark.id}" aria-label="Copy URL to clipboard">📋 Copy URL</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = bookmarksHtml;
    
    // Attach event listeners to buttons
    attachBookmarkEventListeners(userId);
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Task 2.3: Attach event listeners to bookmark buttons
function attachBookmarkEventListeners(userId) {
    // Like buttons
    document.querySelectorAll('.like-button').forEach(button => {
        button.removeEventListener('click', handleLikeClick);
        button.addEventListener('click', handleLikeClick);
    });
    
    // Copy buttons
    document.querySelectorAll('.copy-button').forEach(button => {
        button.removeEventListener('click', handleCopyClick);
        button.addEventListener('click', handleCopyClick);
    });
    
    function handleLikeClick(event) {
        const button = event.currentTarget;
        const bookmarkId = button.dataset.id;
        try {
            const newLikeCount = incrementLike(userId, bookmarkId);
            // Update the like count display
            const likeSpan = button.querySelector('.like-count');
            if (likeSpan) {
                likeSpan.textContent = newLikeCount;
            } else {
                button.innerHTML = `${newLikeCount}`;
            }
            // Provide visual feedback
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = '';
            }, 200);
        } catch (error) {
            console.error('Error updating like:', error);
        }
    }
    
    async function handleCopyClick(event) {
        const button = event.currentTarget;
        const url = button.dataset.url;
        const success = await copyToClipboard(url);
        if (success) {
            const originalText = button.innerHTML;
            button.innerHTML = '✓ Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        } else {
            button.innerHTML = 'Failed';
            setTimeout(() => {
                button.innerHTML = 'Copy URL';
            }, 2000);
        }
    }
}

// Task 2.2: Load user's bookmarks when user is selected
function onUserSelect() {
    const userId = getSelectedUserId();
    if (!userId) {
        const container = document.getElementById('bookmarksContainer');
        container.innerHTML = '<div class="empty-message">Please select a user</div>';
        return;
    }
    renderBookmarks(userId);
}

// Task 2.4: Handle form submission
function setupFormHandler() {
    const form = document.getElementById('bookmarkForm');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const userId = getSelectedUserId();
        
        if (!userId) {
            alert('Please select a user first');
            return;
        }
        
        const urlInput = document.getElementById('urlInput');
        const titleInput = document.getElementById('titleInput');
        const descriptionInput = document.getElementById('descriptionInput');
        
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        // Validate inputs
        if (!url) {
            alert('URL is required');
            return;
        }
        
        if (!isValidUrl(url)) {
            alert('Please enter a valid URL (e.g., https://example.com)');
            return;
        }
        
        if (!title) {
            alert('Title is required');
            return;
        }
        
        try {
            // Add bookmark
            addBookmark(userId, url, title, description);
            
            // Reset form
            form.reset();
            
            // Refresh display
            renderBookmarks(userId);
            
            // Announce success for screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.textContent = 'Bookmark added successfully';
            announcement.style.position = 'absolute';
            announcement.style.left = '-9999px';
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 3000);
            
        } catch (error) {
            console.error('Error adding bookmark:', error);
            alert('Failed to add bookmark: ' + error.message);
        }
    });
}

// Task 2.6: Initialize dropdown with users
function initializeUserDropdown() {
    const userSelect = document.getElementById('userSelect');
    
    // The HTML already has hardcoded options, but we need to ensure they map to correct user IDs
    // Convert from "user1" to "1" for storage
    const options = userSelect.querySelectorAll('option');
    options.forEach(option => {
        if (option.value && option.value.startsWith('user')) {
            // Keep as is, we'll convert in getSelectedUserId
            option.value = option.value;
        }
    });
    
    // Task 2.2: Set up change event listener
    userSelect.addEventListener('change', () => {
        onUserSelect();
    });
}

// Task 2.5: Ensure keyboard accessibility
function setupAccessibility() {
    // Add keyboard shortcut hints
    const form = document.getElementById('bookmarkForm');
    form.setAttribute('aria-label', 'Add new bookmark form');
    
    // Ensure all interactive elements are focusable
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
    interactiveElements.forEach(el => {
        if (!el.getAttribute('tabindex')) {
            el.setAttribute('tabindex', '0');
        }
    });
    
    // Add skip to content link for keyboard users
    if (!document.getElementById('skip-to-content')) {
        const skipLink = document.createElement('a');
        skipLink.id = 'skip-to-content';
        skipLink.href = '#bookmarksContainer';
        skipLink.textContent = 'Skip to bookmarks';
        skipLink.style.position = 'absolute';
        skipLink.style.left = '-9999px';
        skipLink.style.top = '-9999px';
        skipLink.addEventListener('focus', () => {
            skipLink.style.left = '10px';
            skipLink.style.top = '10px';
            skipLink.style.zIndex = '1000';
            skipLink.style.backgroundColor = '#fff';
            skipLink.style.padding = '10px';
            skipLink.style.border = '2px solid #007bff';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.left = '-9999px';
            skipLink.style.top = '-9999px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Ensure form can be submitted with Enter key
    const formInputs = document.querySelectorAll('#bookmarkForm input, #bookmarkForm textarea');
    formInputs.forEach(input => {
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
                event.preventDefault();
                const form = document.getElementById('bookmarkForm');
                const submitEvent = new Event('submit', { cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        });
    });
}

// Task 2.6: Initialize application
function initializeApp() {
    initializeUserDropdown();
    setupFormHandler();
    setupAccessibility();
    
    // Check if there's a selected user, if not, show empty state
    const userId = getSelectedUserId();
    if (userId) {
        renderBookmarks(userId);
    } else {
        const container = document.getElementById('bookmarksContainer');
        container.innerHTML = '<div class="empty-message">Please select a user from the dropdown above</div>';
    }
}

// Task 2.6: Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

