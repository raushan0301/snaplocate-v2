// sidebar.js
// Dynamically update user name after login or guest access

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Utility to capitalize first letter
function capitalizeName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Set default as Guest if not logged in
function updateUserName(name, role = "SnapLocate User") {
  const nameElem = document.getElementById('userName');
  const roleElem = document.querySelector('.user-role');

  if (nameElem && roleElem) {
    nameElem.textContent = capitalizeName(name);
    roleElem.textContent = role;
  }
}

onAuthStateChanged(auth, (user) => {
  if (user && user.displayName) {
    updateUserName(user.displayName, "Authenticated User");
  } else if (user && user.email) {
    const username = user.email.split('@')[0];
    updateUserName(username, "Authenticated User");
  } else {
    // Try localStorage guest ID fallback
    const guestId = localStorage.getItem('guestId') || 'Guest';
    updateUserName(guestId);
  }
});

// Sidebar toggle for mobile
window.toggleSidebar = function () {
  document.querySelector('.sidebar').classList.toggle('show');
  document.querySelector('.overlay')?.classList.toggle('active');
};







document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Highlight script loaded");

  const allLinks = document.querySelectorAll(".nav-links a, .sidebar a");

  let currentPath = window.location.pathname.split("/").pop() || "index.html";
  if (!currentPath.endsWith(".html")) {
    currentPath += ".html";
  }
  console.log("👉 Normalized currentPath =", currentPath);

  allLinks.forEach(link => {
    let href = link.getAttribute("href") || "";

    // Skip logo link
    if (link.querySelector("h2")) return;

    href = href.replace(/^\//, "");
    let normalizedHref = href.endsWith(".html") ? href : href + ".html";

    console.log(`Checking ${normalizedHref} vs ${currentPath}`);

    if (normalizedHref === currentPath) {
      link.classList.add("active");
    }
  });
});

