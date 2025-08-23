import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

// const auth = getAuth();
const ADMIN_UID = "zU571xDn7JO8eLLGvNlcmTMcxby1"; // Your UID from Firebase Console

onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
    // ✅ Load admin dashboard logic
    console.log("Welcome Admin");
    loadDashboard();
  } else {
    // ❌ Block or redirect if not admin
    alert("Access Denied");
    window.location.href = "admin-login.html";
  }
});

function loadDashboard() {
  document.getElementById("content-area").innerHTML = `
  <p>Welcome, ${auth.currentUser.email}</p>
`;

  // Your chart/data rendering logic here
}



document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const pageTitle = document.getElementById('page-title');
  const contentArea = document.getElementById('content-area');

  // Navigation handler
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const section = link.dataset.section;
      pageTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);
      loadSection(section);
    });
  });

 function loadSection(section) {
  contentArea.innerHTML = `<p>Loading ${section} section...</p>`;

  if (section === 'professors') {
    import('./professors.js').then(module => {
      module.loadProfessors(contentArea);
    });
  } else if (section === 'classrooms') {
    import('./classrooms.js').then(module => {
      module.loadClassrooms(contentArea);
    });
  } else if (section === 'academic') {
    import('./academic.js').then(module => {
      module.loadAcademic(contentArea);
    });
  } else if (section === 'contact') {
    import('./contact.js').then(module => {
      module.loadContactMessages(contentArea);
    });
  }
  else if (section === 'dashboard') {
    console.log("Loading dashboard...");
    import('./dashboard.js').then(module => {
      module.loadDashboard(contentArea);  // ✅ Correct this line!
    });
  }else {
    // ✅ Fallback for unknown sections
    contentArea.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: red;">
        <h2>⚠️ Section Not Found</h2>
        <p>The section <code>${section}</code> is not recognized.</p>
      </div>
      `;
  }
}


  // Theme toggle
  const toggleBtn = document.getElementById('theme-toggle');
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    toggleBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
});
