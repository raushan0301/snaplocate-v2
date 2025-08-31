import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ----------------- FIREBASE -----------------
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDB2bm2KBo6geTRSlVHOhqhUQX-6Mozp1Y",
  authDomain: "snaplocateproject.firebaseapp.com",
  projectId: "snaplocateproject",
  storageBucket: "snaplocateproject.firebasestorage.app",
  messagingSenderId: "150513277214",
  appId: "1:150513277214:web:e7fef8e692bd89af65510f",
  measurementId: "G-5P19DM1V01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ----------------- CONSTANTS -----------------
const ACCENTS = {
  "Hostel": "var(--accent-hostel)",
  "Finance": "var(--accent-finance)",
  "Academics": "var(--accent-academics)",
  "IT Support": "var(--accent-it)",
  "Scholarship": "var(--accent-scholar)",
  "Student Life": "var(--accent-student)"
};

let DATA = {};
let ACTIVE_CAT = null;
let SEARCH = "";

// ----------------- ELEMENTS -----------------
const tabsEl = document.getElementById("tabs");
const gridEl = document.getElementById("grid");
const searchEl = document.getElementById("search");

// ----------------- INIT -----------------
(async function init() {
  await loadContacts();

  // Build tabs (ignore "Hostel Directory")
  const categories = Object.keys(DATA).filter(k => k !== "Hostel Directory");
  categories.forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.className = idx === 0 ? "active" : "";
    btn.addEventListener("click", () => setActive(cat));
    tabsEl.appendChild(btn);
  });

  setActive(categories[0]);
  setupSearch();
  renderHostelDirectory(DATA["Hostel Directory"]);
})();

// ----------------- LOAD DATA FROM FIRESTORE -----------------
async function loadContacts() {
  DATA = { "Hostel Directory": [] };

  // Fetch main contacts (Finance, Academics, IT, etc.)
  const snap = await getDocs(collection(db, "contacts"));
  snap.forEach(doc => {
    const cat = doc.id; // e.g., "Academics", "Finance"
    const data = doc.data();

    if (!DATA[cat]) DATA[cat] = [];

    if (Array.isArray(data.issues)) {
      data.issues.forEach(issue => {
        DATA[cat].push(issue);
      });
    }
  });

  // Fetch hostel directory
  const hostelSnap = await getDocs(collection(db, "hostels"));
  hostelSnap.forEach(doc => {
    DATA["Hostel Directory"].push(doc.data());
  });
}

// ----------------- RENDER TABS + CARDS -----------------
function setActive(cat) {
  ACTIVE_CAT = cat;
  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  const activeBtn = [...document.querySelectorAll(".tabs button")].find(b => b.textContent === cat);
  if (activeBtn) activeBtn.classList.add("active");
  renderCards();
}

function setupSearch() {
  if (!searchEl) return; 
  searchEl.addEventListener("input", e => {
    SEARCH = e.target.value.trim().toLowerCase();
    renderCards();
  });
}

function renderCards() {
  gridEl.innerHTML = "";
  const items = (DATA[ACTIVE_CAT] || []).filter(it => {
    const hay = `${it.query || ""} ${it.contact || ""} ${it.email || ""} ${it.whenToUse || ""}`.toLowerCase();
    return hay.includes(SEARCH);
  });

  items.forEach(it => {
    const card = document.createElement("div");
    card.className = "card";

    // Badge
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = ACTIVE_CAT;
    badge.style.background = ACCENTS[ACTIVE_CAT] || "#eee";

    // Inner content  btn, btn ghost, actions,pill,line,h3
    card.innerHTML = `
      <h3>${escapeHTML(it.query || "")}</h3>
      <p class="line"><strong>Contact:</strong> ${escapeHTML(it.contact || "")}</p>
      <p class="line"><strong>Email:</strong> ${escapeHTML(it.email || "")}</p>
      <span class="pill">When to use: ${escapeHTML(it.whenToUse || "")}</span>
      <div class="actions">
        <button class="btn" data-copy="${it.email || ""}">Copy Email</button>
        <button class="btn ghost" data-mailto="${firstEmail(it.email || "")}">Open Mail</button>
      </div>
    `;
    card.appendChild(badge);
    gridEl.appendChild(card);
  });

  // Wire buttons (Copy + Mail)
  gridEl.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-copy");
      if (email) {
        copy(email);
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy Email", 1100);
      }
    });
  });

  gridEl.querySelectorAll("[data-mailto]").forEach(btn => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-mailto");
      if (!email) return;
      if (email.startsWith("http")) {
        window.open(email, "_blank");
      } else {
        window.location.href = `mailto:${email}`;
      }
    });
  });
}

// ----------------- HOSTEL DIRECTORY -----------------
function renderHostelDirectory(rows = []) {
  const tbody = document.querySelector("#hostelTable tbody");
  const filterBox = document.getElementById("hostelSearch");

  function paint() {
    const q = (filterBox.value || "").toLowerCase();
    tbody.innerHTML = "";

    rows
      .filter(r => (r.hostel || "").toLowerCase().includes(q))
      .forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHTML(r.hostel || "")}</td>
          <td>${escapeHTML(r.caretaker || "")}</td>
          <td>${escapeHTML(r.warden || "")}</td>
          <td class="copy-row">
            <button class="btn" data-copy="${r.caretaker || ""}" data-role="Caretaker">Caretaker</button>
            <button class="btn ghost" data-copy="${r.warden || ""}" data-role="Warden">Warden</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    // Wire copy buttons
    tbody.querySelectorAll("[data-copy]").forEach(b => {
      b.addEventListener("click", () => {
        const text = b.getAttribute("data-copy");
        const role = b.getAttribute("data-role");
        if (text) {
          copy(text);
          b.textContent = "Copied!";
          setTimeout(() => b.textContent = role, 900);
        }
      });
    });
  }

  filterBox.addEventListener("input", paint);
  paint();
}

// ----------------- HELPERS -----------------
function copy(text) {
  navigator.clipboard.writeText(text).catch(err => console.error("Copy failed", err));
}

function firstEmail(text) {
  if (!text) return "";
  const parts = text.split(/[,\|]/).map(s => s.trim()).filter(Boolean);
  return parts[0] || "";
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}
