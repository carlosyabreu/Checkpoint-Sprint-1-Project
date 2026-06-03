import { getUserIds, getBookmarksForUser } from "./storage.js";

window.onload = function () {
  const users = getUserIds();
  const select = document.getElementById("user-select");

  // populate the dropdown
  users.forEach(userId => {
    const option = document.createElement("option");
    option.value = userId;
    option.textContent = userId;
    select.appendChild(option);
  });

  // listen for selection changes
  select.addEventListener("change", function () {
    loadBookmarksForUser(this.value);
  });

  // load initial state for the first user 
  if (users.length > 0) loadBookmarksForUser(users[0]);
};

function loadBookmarksForUser(userId) {
  const bookmarks = getBookmarksForUser(userId);
  const container = document.getElementById("bookmarks-container");

  if (!bookmarks || bookmarks.length === 0) {
    container.innerHTML = "No bookmarks for this user yet. Get started below!;
  } else {
    container.innerHTML = bookmarks
      .map(b => `<li><a href="${b.url}">${b.title}</a></li>`)
      .join("");
  }
}