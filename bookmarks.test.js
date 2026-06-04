import assert from "node:assert";
import test from "node:test";
import { 
    getBookmarksReverseChronological, 
    addBookmark, 
    incrementLike, 
    getLikeCount,
    isValidUrl,
    copyToClipboard,
    getUserBookmarks,
    saveUserBookmarks
} from "./script.js";
import { clearData, getUserIds } from "./storage.js";

// Helper to clear test data
function clearTestData() {
    const userIds = getUserIds();
    userIds.forEach(id => clearData(id));
}

// Setup and teardown
test.beforeEach(() => {
    clearTestData();
});

test.afterEach(() => {
    clearTestData();
});

// Task 1.4: Test reverse chronological sorting
test("Bookmarks are sorted in reverse chronological order", () => {
    const userId = "1";
    const now = Date.now();
    const oldBookmark = {
        id: "1",
        title: "Old",
        url: "https://old.com",
        description: "Old bookmark",
        timestamp: now - 10000,
        likes: 0
    };
    const newBookmark = {
        id: "2",
        title: "New",
        url: "https://new.com",
        description: "New bookmark",
        timestamp: now,
        likes: 0
    };
    
    saveUserBookmarks(userId, [oldBookmark, newBookmark]);
    const sorted = getBookmarksReverseChronological(userId);
    
    assert.equal(sorted.length, 2);
    assert.equal(sorted[0].id, "2");
    assert.equal(sorted[1].id, "1");
});

// Task 1.4: Test adding new bookmark
test("Add bookmark creates new bookmark with correct structure", () => {
    const userId = "1";
    const url = "https://example.com";
    const title = "Test Bookmark";
    const description = "Test Description";
    
    const newBookmark = addBookmark(userId, url, title, description);
    
    assert.ok(newBookmark.id);
    assert.equal(newBookmark.url, url);
    assert.equal(newBookmark.title, title);
    assert.equal(newBookmark.description, description);
    assert.ok(newBookmark.timestamp);
    assert.equal(newBookmark.likes, 0);
    
    const bookmarks = getUserBookmarks(userId);
    assert.equal(bookmarks.length, 1);
    assert.equal(bookmarks[0].id, newBookmark.id);
});

// Task 1.4: Test adding bookmark with missing required fields
test("Add bookmark throws error when URL or title missing", () => {
    const userId = "1";
    
    assert.throws(() => {
        addBookmark(userId, "", "Title", "Desc");
    }, /URL and title are required/);
    
    assert.throws(() => {
        addBookmark(userId, "https://example.com", "", "Desc");
    }, /URL and title are required/);
});

// Task 1.4: Test like counter increment
test("Increment like increases like count by 1", () => {
    const userId = "1";
    const bookmark = addBookmark(userId, "https://example.com", "Test", "Desc");
    
    assert.equal(getLikeCount(userId, bookmark.id), 0);
    
    incrementLike(userId, bookmark.id);
    assert.equal(getLikeCount(userId, bookmark.id), 1);
    
    incrementLike(userId, bookmark.id);
    assert.equal(getLikeCount(userId, bookmark.id), 2);
});

// Task 1.4: Test like persistence across sessions (simulated)
test("Like count persists after saving and reloading", () => {
    const userId = "1";
    const bookmark = addBookmark(userId, "https://example.com", "Test", "Desc");
    
    incrementLike(userId, bookmark.id);
    incrementLike(userId, bookmark.id);
    
    // Simulate page reload by clearing in-memory and reloading from storage
    const freshBookmarks = getUserBookmarks(userId);
    assert.equal(freshBookmarks[0].likes, 2);
});

// Task 1.4: Test increment like on non-existent bookmark
test("Increment like throws error for non-existent bookmark", () => {
    const userId = "1";
    
    assert.throws(() => {
        incrementLike(userId, "non-existent-id");
    }, /Bookmark not found/);
});

// Task 1.4: Test URL validation
test("URL validation correctly identifies valid and invalid URLs", () => {
    assert.ok(isValidUrl("https://example.com"));
    assert.ok(isValidUrl("http://example.com"));
    assert.ok(isValidUrl("https://sub.example.co.uk/path?query=1"));
    
    assert.equal(isValidUrl("not-a-url"), false);
    assert.equal(isValidUrl("ftp://example.com"), false);
    assert.equal(isValidUrl(""), false);
});

// Task 1.4: Test multiple users have separate bookmarks
test("Bookmarks are isolated per user", () => {
    const user1 = "1";
    const user2 = "2";
    
    addBookmark(user1, "https://user1.com", "User1 Bookmark", "Desc");
    addBookmark(user2, "https://user2.com", "User2 Bookmark", "Desc");
    
    const user1Bookmarks = getUserBookmarks(user1);
    const user2Bookmarks = getUserBookmarks(user2);
    
    assert.equal(user1Bookmarks.length, 1);
    assert.equal(user2Bookmarks.length, 1);
    assert.equal(user1Bookmarks[0].url, "https://user1.com");
    assert.equal(user2Bookmarks[0].url, "https://user2.com");
});

// Task 1.4: Test empty bookmarks return empty array
test("Get user bookmarks returns empty array for user with no bookmarks", () => {
    const userId = "1";
    const bookmarks = getUserBookmarks(userId);
    assert.deepEqual(bookmarks, []);
});

// Task 1.4: Test getLikeCount returns 0 for non-existent bookmark
test("Get like count returns 0 for non-existent bookmark", () => {
    const userId = "1";
    const likeCount = getLikeCount(userId, "non-existent");
    assert.equal(likeCount, 0);
});

