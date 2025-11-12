import { app, db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==== PROFESSOR SECTION ====
const professorSearchInput = document.getElementById("searchInput");
const loader = document.getElementById("loader");
const professorCardContainer = document.getElementById("professorCardContainer");
const showMoreBtn = document.getElementById("showMoreBtn");

let allProfessors = [];
let visibleCount = 6;
let expanded = false;

async function loadProfessors() {
  if (!professorCardContainer) return;

  loader && (loader.style.display = "block");
  professorCardContainer.innerHTML = "";
  const noProfResults = document.getElementById("noResults");
  noProfResults && (noProfResults.style.display = "none");

  try {
    const querySnapshot = await getDocs(collection(db, "professors"));
    allProfessors = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      allProfessors.push({
        name: data.name || "N/A",
        cabinNo: data.cabinNo || "N/A",
        contact: data.email || data.contact || "N/A",
        department: data.department || "N/A",
        Designation: data.designation || data.Designation || "N/A",
        specialization: data.specialization || "N/A",
      });
    });

    window.trackEvent && window.trackEvent('professors_page_loaded', {
      total_professors: allProfessors.length
    });

    displayProfessors(allProfessors);
  } catch (error) {
    console.error("Error fetching professors:", error);
  } finally {
    loader && (loader.style.display = "none");
  }
}

function displayProfessors(professors) {
  professorCardContainer.innerHTML = "";
  const noProfResults = document.getElementById("noResults");

  professors.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    if (!expanded && i >= visibleCount) {
      card.classList.add("hidden-prof");
      card.style.display = "none";
    }
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <h3>${p.name}</h3>
          <p><strong>Designation:</strong><br>${p.Designation}</p>
          <p><strong>Cabin:</strong> ${p.cabinNo}</p>
        </div>
        <div class="card-back">
          <p><strong>Department:</strong> ${p.department}</p>
          <p><strong>Email:</strong><br><span class="email-text">${p.contact}</span>
          <button class="copy-btn" title="Copy Email">📋</button></p>
          <p><strong>Specialization:</strong><br>${p.specialization}</p>
        </div>
      </div>
    `;
    professorCardContainer.appendChild(card);
  });

  // Setup copy buttons after cards are created
  setTimeout(() => {
    setupCopyButtons();
  }, 100);

  if (professors.length <= visibleCount && showMoreBtn) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn && (showMoreBtn.style.display = "block");
  }
}

showMoreBtn?.addEventListener("click", () => {
  expanded = !expanded;
  window.trackEvent && window.trackEvent('show_more_clicked', {
    section: 'professors',
    action: expanded ? 'expand' : 'collapse',
    total_items: allProfessors.length
  });
  displayProfessors(allProfessors);
  showMoreBtn.textContent = expanded ? "Show Less" : "Show More Professors";
});

professorSearchInput?.addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  if (filter.length > 2) {
    window.trackSearch && window.trackSearch('professor', filter);
  }
  const noProfResults = document.getElementById("noResults");

  const sorted = [...allProfessors].sort((a, b) => {
    const exactA = a.name.toLowerCase() === filter ? -1 : 0;
    const exactB = b.name.toLowerCase() === filter ? -1 : 0;
    return exactB - exactA || a.name.localeCompare(b.name);
  });

  const filtered = sorted.filter(p =>
    Object.values(p).join(" ").toLowerCase().includes(filter)
  );

  expanded = true;
  displayProfessors(filtered);
  noProfResults.style.display = filtered.length === 0 ? "block" : "none";
});

loadProfessors();

// ==== CLASSROOM SECTION ====
const classroomSearchInput = document.getElementById("classroomSearchInput");
const classroomCardContainer = document.getElementById("classroomCardContainer");
const refreshClassroomsBtn = document.getElementById("refreshClassroomsBtn");
const noClassroomResults = document.getElementById("noClassroomResults");
const classroomLoader = document.getElementById("classroomLoader");

let allClassrooms = [];
let visibleClassroomCount = 6;
let classroomExpanded = false;

async function loadClassrooms() {
  classroomLoader && (classroomLoader.style.display = "block");
  try {
    const snapshot = await getDocs(collection(db, "classrooms"));
    allClassrooms = [];

    snapshot.forEach(doc => {
      const room = doc.data();
      allClassrooms.push({
        roomNo: room.roomNo || "N/A",
        classType: room.classType || "N/A",
        block: room.block || "N/A",
        floor: room.floor || "N/A",
        capacity: room.capacity || "N/A",
        labName: room.labName || "N/A",
        classcode: room.classcode || "N/A",
        ACStatus: room.ACStatus || "Unknown",
      });
    });

    window.trackEvent && window.trackEvent('classrooms_page_loaded', {
      total_classrooms: allClassrooms.length
    });

    displayClassrooms(allClassrooms);
  } catch (err) {
    console.error("Failed to load classrooms:", err);
  } finally {
    classroomLoader && (classroomLoader.style.display = "none");
  }
}

function displayClassrooms(classrooms) {
  if (!classroomCardContainer) return;
  classroomCardContainer.innerHTML = "";

  if (classrooms.length === 0) {
    noClassroomResults && (noClassroomResults.style.display = "block");
    return;
  }

  noClassroomResults && (noClassroomResults.style.display = "none");

  classrooms.forEach((room, i) => {
    const card = document.createElement("div");
    card.className = "card-3d";

    if (!classroomExpanded && i >= visibleClassroomCount) {
      card.style.display = "none";
      card.classList.add("hidden-room");
    }

   const renderField = (label, value) => {
  if (value && value !== "N/A" && value !== "Unknown") {
    return label
      ? `<p><strong>${label}:</strong> ${value}</p>`
      : `<p>${value}</p>`;
  }
  return "";
};


    const frontHTML = `
      ${renderField("",room.labName)}
      ${renderField("Block", room.block)}
      ${room.roomNo && room.roomNo !== "N/A" ? `<h3>Room : ${room.roomNo}</h3>` : ""}
      ${renderField("Code", room.classcode)}
    `;

    const backHTML = `
      ${renderField("Class Type", room.classType)}
      ${renderField("Floor", room.floor)}
      ${renderField("Capacity", room.capacity)}
      ${renderField("AC Status", room.ACStatus)}
    `;

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${frontHTML}</div>
        <div class="card-back">${backHTML}</div>
      </div>
    `;

    classroomCardContainer.appendChild(card);
  });

  const showMoreBtn = document.getElementById("showMoreBtn");
  if (classrooms.length <= visibleClassroomCount && showMoreBtn) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn && (showMoreBtn.style.display = "block");
  }
}

classroomSearchInput?.addEventListener("input", function () {
  const rawFilter = this.value.toLowerCase();

  // Remove non-alphanumeric chars for flexible matching (e.g., "b107" == "b-107")
  const normalizedFilter = rawFilter.replace(/[^a-z0-9]/g, "");

  if (rawFilter.length > 1) {
    window.trackSearch && window.trackSearch('classroom', normalizedFilter);
  }

  const filtered = allClassrooms.filter(room => {
    // Join all values and normalize by removing non-alphanumeric chars
    const normalizedRoomData = Object.values(room)
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ""); // 🔑 normalization
    return normalizedRoomData.includes(normalizedFilter);
  });

  classroomExpanded = true;
  displayClassrooms(filtered);
});

refreshClassroomsBtn?.addEventListener("click", loadClassrooms);

document.getElementById("showMoreBtn")?.addEventListener("click", () => {
  classroomExpanded = !classroomExpanded;
  window.trackEvent && window.trackEvent('show_more_clicked', {
    section: 'classrooms',
    action: classroomExpanded ? 'expand' : 'collapse',
    total_items: allClassrooms.length
  });
  displayClassrooms(allClassrooms);
  document.getElementById("showMoreBtn").textContent = classroomExpanded ? "Show Less" : "Show More Classrooms";
});

if (classroomCardContainer) {
  loadClassrooms();
}

// ==== NAVIGATION ACTIVE LINKS ====
const allLinks = document.querySelectorAll("a");
let currentPath = window.location.pathname.split("/").pop() || "index.html";

if (!currentPath.includes(".")) {
  currentPath += ".html";
}

allLinks.forEach(link => {
  let href = link.getAttribute("href");
  if (!href || link.querySelector("h2")) return;

  let normalizedHref = href.replace(/^\/|\/$/g, "");
  if (!normalizedHref.endsWith(".html")) {
    normalizedHref += ".html";
  }

  if (normalizedHref === currentPath) {
    link.classList.add("active");
  }
});

// ==== CLICK-ONLY CARD FLIP FUNCTIONALITY ====
document.addEventListener("click", (e) => {
  // Don't flip if clicking on copy button
  if (e.target.classList.contains('copy-btn') || 
      e.target.closest('.copy-btn')) {
    return;
  }

  // Find the clicked card
  const clickedCard = e.target.closest(".card") || e.target.closest(".card-3d");

  if (clickedCard) {
    // Toggle the flipped state on click only
    clickedCard.classList.toggle("flipped");
    
    // Track card interaction
    const isClassroom = clickedCard.querySelector('.card-front h3')?.textContent.includes('Room');
    const cardType = isClassroom ? 'classroom' : 'professor';
    window.trackCardInteraction && window.trackCardInteraction(cardType, 'flip_card');
  }
});

// ==== COPY EMAIL FUNCTIONALITY ====
function setupCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      e.preventDefault();
      
      const email = this.parentElement.querySelector(".email-text").textContent.trim();
      copyToClipboardSafari(email, this);
      window.trackCardInteraction && window.trackCardInteraction('professor', 'copy_email');
    });
  });
}

async function copyToClipboardSafari(text, buttonElement) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showCopySuccess(buttonElement);
    } else {
      // Fallback for Safari
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      if (document.execCommand('copy')) {
        showCopySuccess(buttonElement);
      } else {
        throw new Error('Copy failed');
      }
      
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.log("Copy failed:", error);
    alert(`Copy this email: ${text}`);
    showCopySuccess(buttonElement);
  }
}

function showCopySuccess(buttonElement) {
  buttonElement.textContent = "✅";
  setTimeout(() => (buttonElement.textContent = "📋"), 1500);
}