// Firebase Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

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
        // TeacherCode: data.TeacherCode || "N/A",
        cabinNo: data.cabinNo || "N/A",
        contact: data.email || data.contact || "N/A",
        department: data.department || "N/A",
        Designation: data.designation || data.Designation || "N/A",
        specialization: data.specialization || "N/A",
        // experience: data.experience || "Experienced Faculty Member"
      });
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
// ✅ Copy Email Button
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    const email = this.parentElement.querySelector(".email-text").textContent.trim();
    navigator.clipboard.writeText(email).then(() => {
      this.textContent = "✅";
      setTimeout(() => (this.textContent = "📋"), 1500);
    }).catch(err => {
      console.error("Failed to copy email:", err);
    });
  });
});


  if (professors.length <= visibleCount && showMoreBtn) {
    showMoreBtn.style.display = "none";
  } else {
    showMoreBtn.style.display = "block";
  }
}

showMoreBtn?.addEventListener("click", () => {
  expanded = !expanded;
  displayProfessors(allProfessors);
  showMoreBtn.textContent = expanded ? "Show Less" : "Show More Professors";
});

professorSearchInput?.addEventListener("input", function () {
  const filter = this.value.toLowerCase();
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
    noClassroomResults.style.display = "block";
    return;
  }

  noClassroomResults.style.display = "none";

  classrooms.forEach((room, i) => {
    const card = document.createElement("div");
    card.className = "card-3d";

    if (!classroomExpanded && i >= visibleClassroomCount) {
      card.style.display = "none";
      card.classList.add("hidden-room");
    }

    // Helper function to render a field only if it's valid
    const renderField = (label, value) => {
      if (value && value !== "N/A" && value !== "Unknown") {
        return `<p><strong>${label}:</strong> ${value}</p>`;
      }
      return "";
    };

    // Construct front and back HTML conditionally
    const frontHTML = `
      ${renderField("LAB", room.labName)}
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
    showMoreBtn.style.display = "block";
  }
}


classroomSearchInput?.addEventListener("input", function () {
  const filter = this.value.toLowerCase();

  const sorted = [...allClassrooms].sort((a, b) => {
    const exactA = a.roomNo.toLowerCase() === filter ? -1 : 0;
    const exactB = b.roomNo.toLowerCase() === filter ? -1 : 0;
    return exactB - exactA || a.roomNo.localeCompare(b.roomNo);
  });

  const filtered = sorted.filter(room =>
    Object.values(room).join(" ").toLowerCase().includes(filter)
  );

  classroomExpanded = true;
  displayClassrooms(filtered);
});

refreshClassroomsBtn?.addEventListener("click", loadClassrooms);

document.getElementById("showMoreBtn")?.addEventListener("click", () => {
  classroomExpanded = !classroomExpanded;
  displayClassrooms(allClassrooms);
  document.getElementById("showMoreBtn").textContent = classroomExpanded ? "Show Less" : "Show More Classrooms";
});

if (classroomCardContainer) {
  loadClassrooms();
}



// Highlight active link in navbar, sidebar, and footer
const allLinks = document.querySelectorAll("a");

// Get the current file name (ignore folders like "Public/")
let currentPath = window.location.pathname.split("/").pop() || "index.html";

// If no extension, normalize to .html
if (!currentPath.includes(".")) {
  currentPath += ".html";
}

console.log("Fixed currentPath →", currentPath);

allLinks.forEach(link => {
  let href = link.getAttribute("href");
  if (!href) return;

  // Skip logo link
if (link.querySelector("h2")) return;

  // Remove leading/trailing slashes
  let normalizedHref = href.replace(/^\/|\/$/g, "");
  if (!normalizedHref.endsWith(".html")) {
    normalizedHref += ".html";
  }

  console.log("Checking:", href, "→", normalizedHref);

  if (normalizedHref === currentPath) {
    console.log("✅ Match found →", href);
    link.classList.add("active");
  }
});






// Flip cards on click (works on desktop + iOS Safari)

document.addEventListener("pointerdown", (e) => {
  const clickedCard = e.target.closest(".card-3d");

  // Close other flipped cards
  document.querySelectorAll(".card-3d.flipped").forEach(card => {
    if (card !== clickedCard) card.classList.remove("flipped");
  });

  if (clickedCard) {
    // e.preventDefault(); // stop Safari from text-selecting
    clickedCard.classList.toggle("flipped");
  }
});
