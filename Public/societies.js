// societies.js
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allSocieties = [];
let filteredSocieties = [];
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 9;

// Society icons mapping
const societyIcons = {
  default: "🏛️",
  academic: "📚",
  technical: "💻",
  cultural: "🎭",
  sports: "⚽",
  music: "🎵",
  dance: "💃",
  drama: "🎬",
  photography: "📷",
  robotics: "🤖",
  coding: "👨‍💻",
  literature: "📖",
  art: "🎨",
  science: "🔬",
  innovation: "💡"
};

// Get icon based on society name or objective
function getSocietyIcon(societyName, objective) {
  const text = (societyName + " " + (objective || "")).toLowerCase();

if (text.includes("robot") || text.includes("automation") || text.includes("mechatron") || text.includes("autonomous") || text.includes("embedded")) return societyIcons.robotics;
if (text.includes("code") || text.includes("program") || text.includes("software") || text.includes("developer") || text.includes("coding") || text.includes("app") || text.includes("web") || text.includes("algorithm")) return societyIcons.coding;
if (text.includes("music") || text.includes("band") || text.includes("vocal") || text.includes("choir") || text.includes("orchestra")) return societyIcons.music;
if (text.includes("dance") || text.includes("bhangra") || text.includes("hip hop") || text.includes("classical dance")) return societyIcons.dance;
if (text.includes("drama") || text.includes("theater") || text.includes("theatre") || text.includes("acting") || text.includes("film") || text.includes("movie") || text.includes("cinema")) return societyIcons.drama;
if (text.includes("photo") || text.includes("photography") || text.includes("camera") || text.includes("videography")) return societyIcons.photography;
if (text.includes("literature") || text.includes("writing") || text.includes("author") || text.includes("poetry") || text.includes("debate") || text.includes("oratory")) return societyIcons.literature;
if (text.includes("art") || text.includes("painting") || text.includes("drawing") || text.includes("sketch") || text.includes("sculpt") || text.includes("design")) return societyIcons.art;
if (text.includes("science") || text.includes("research") || text.includes("lab") || text.includes("physics") || text.includes("chemistry") || text.includes("biology") || text.includes("astronomy") || text.includes("math")) return societyIcons.science;
if (text.includes("sport") || text.includes("athlet") || text.includes("fitness") || text.includes("cricket") || text.includes("football") || text.includes("basketball") || text.includes("gym") || text.includes("marathon") || text.includes("yoga")) return societyIcons.sports;
if (text.includes("cultur") || text.includes("tradition") || text.includes("heritage") || text.includes("festival") || text.includes("language") || text.includes("community")) return societyIcons.cultural;
if (text.includes("tech") || text.includes("engineer") || text.includes("computer") || text.includes("electronics") || text.includes("electrical") || text.includes("mechanical") || text.includes("civil") || text.includes("industrial") || text.includes("standard")) return societyIcons.technical;
if (text.includes("academic") || text.includes("study") || text.includes("education") || text.includes("scholar") || text.includes("learn") || text.includes("seminar")) return societyIcons.academic;
if (text.includes("innovat") || text.includes("startup") || text.includes("entrepreneur") || text.includes("venture") || text.includes("incubat") || text.includes("ideation") || text.includes("pitch") || text.includes("hackathon")) return societyIcons.innovation;
  return societyIcons.default;
}

// Determine category
function getSocietyCategory(type) {
  if (!type) return "other";
  return type.toLowerCase(); // returns "academic", "technical", "cultural"
}


// Load societies from Firestore
async function loadSocieties() {
  const loadingEl = document.getElementById('loadingState');
  const gridEl = document.getElementById('societiesGrid');
  const errorEl = document.getElementById('errorState');
  const emptyEl = document.getElementById('emptyState');

  try {
    loadingEl.style.display = 'flex';
    gridEl.innerHTML = '';
    errorEl.style.display = 'none';
    emptyEl.style.display = 'none';

    console.log("🔄 Loading societies from Firestore...");

    // Try both possible collection names
    let snapshot;
    try {
      const socRef = collection(db, "societies");
      const q = query(socRef, orderBy("societyName"));
      snapshot = await getDocs(q);
      console.log(`✅ Found ${snapshot.docs.length} societies in 'societies' collection`);
    } catch (e) {
      console.log("⚠️ 'societies' collection not found, trying 'Societies'...");
      const socRef = collection(db, "Societies");
      const q = query(socRef, orderBy("societyName"));
      snapshot = await getDocs(q);
      console.log(`✅ Found ${snapshot.docs.length} societies in 'Societies' collection`);
    }

    allSocieties = snapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    category: getSocietyCategory(data.TYPE || data.type)
  };
});


    filteredSocieties = [...allSocieties];
    updateStats();
    renderSocieties();

    if (allSocieties.length === 0) {
      emptyEl.style.display = 'block';
    }

  } catch (error) {
    console.error("❌ Error loading societies:", error);
    errorEl.style.display = 'block';
    gridEl.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 50px; background: white; border-radius: 1rem;">
        <h3>❌ Error Loading Societies</h3>
        <p>${error.message}</p>
        <p style="font-size: 0.9rem; color: #6b7280; margin-top: 10px;">Please check your Firebase configuration and collection name.</p>
      </div>
    `;
  } finally {
    loadingEl.style.display = 'none';
  }
}

// Update statistics
function updateStats() {
  const totalEl = document.getElementById('totalSocieties');
  const displayedEl = document.getElementById('displayedSocieties');

  if (totalEl) totalEl.textContent = allSocieties.length;
  if (displayedEl) displayedEl.textContent = filteredSocieties.length;
}

// Render societies grid with pagination
function renderSocieties() {
  const gridEl = document.getElementById('societiesGrid');
  const emptyEl = document.getElementById('emptyState');

  if (!gridEl) {
    console.error("❌ societiesGrid element not found");
    return;
  }

  if (filteredSocieties.length === 0) {
    gridEl.innerHTML = '';
    emptyEl.style.display = 'block';
    updatePagination();
    return;
  }

  emptyEl.style.display = 'none';

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSocieties = filteredSocieties.slice(startIndex, endIndex);

  gridEl.innerHTML = paginatedSocieties.map(society => createSocietyCard(society)).join('');

  // Add click listeners
  document.querySelectorAll('.society-card').forEach(card => {
    card.addEventListener('click', () => {
      const societyId = card.dataset.societyId;
      const society = allSocieties.find(s => s.id === societyId);
      if (society) showSocietyModal(society);
    });
  });

  updatePagination();
}

// Create society card HTML
function createSocietyCard(society) {
  const icon = getSocietyIcon(society.societyName, society.objective);
  const president = society.president || "N/A";
  const vicePresident = society.vicePresident || "N/A";

  return `
    <div class="society-card" data-society-id="${society.id}">
      <div class="society-card-header">
        <div class="society-icon">${icon}</div>
        <h3>${society.societyName}</h3>
        <p class="objective">${society.objective || "No objective provided"}</p>
      </div>
      
      <div class="society-card-body">
        <div class="society-info">
          ${society.email ? `
            <div class="info-item">
              <span class="info-icon">📧</span>
              <a href="mailto:${society.email}">${society.email}</a>
            </div>
          ` : ''}
          
          ${society.website ? `
            <div class="info-item">
              <span class="info-icon">🌐</span>
              <a href="${society.website}" target="_blank" rel="noopener noreferrer">Visit Website</a>
            </div>
          ` : ''}
          
          <div class="info-item">
            <span class="info-icon">👤</span>
            <span><strong>President:</strong> ${president}</span>
          </div>
          
          <div class="info-item">
            <span class="info-icon">👥</span>
            <span><strong>Vice President:</strong> ${vicePresident}</span>
          </div>
        </div>
      </div>
      
      <div class="society-card-footer">
        <button class="view-details-btn">View Details</button>
      </div>
    </div>
  `;
}

// Show society modal with full details
function showSocietyModal(society) {
  const modal = document.getElementById('societyModal');
  const modalContent = document.getElementById('modalContent');
  const icon = getSocietyIcon(society.societyName, society.objective);

  if (!modal || !modalContent) {
    console.error("❌ Modal elements not found");
    return;
  }

  modalContent.innerHTML = `
    <div class="modal-header">
      <div class="icon">${icon}</div>
      <h2>${society.societyName}</h2>
      <p>${society.objective || "No objective provided"}</p>
    </div>

    <div class="modal-body">
      <!-- Contact Information -->
      <div class="detail-section">
        <h3>📞 Contact Information</h3>
        ${society.email ? `
          <div class="detail-item">
            <span class="icon">📧</span>
            <div class="content">
              <div class="label">Email</div>
              <div class="value">
                <a href="mailto:${society.email}">${society.email}</a>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${society.website ? `
          <div class="detail-item">
            <span class="icon">🌐</span>
            <div class="content">
              <div class="label">Website</div>
              <div class="value">
                <a href="${society.website}" target="_blank" rel="noopener noreferrer">${society.website}</a>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Leadership -->
      <div class="detail-section">
        <h3>👥 Leadership Team</h3>
        
        ${society.president ? `
          <div class="detail-item">
            <span class="icon">👤</span>
            <div class="content">
              <div class="label">President</div>
              <div class="value">${society.president}</div>
              ${society.presidentEmail ? `
                <div class="value">
                  <a href="mailto:${society.presidentEmail}">${society.presidentEmail}</a>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        ${society.vicePresident ? `
          <div class="detail-item">
            <span class="icon">👥</span>
            <div class="content">
              <div class="label">Vice President</div>
              <div class="value">${society.vicePresident}</div>
              ${society.vicePresidentEmail ? `
                <div class="value">
                  <a href="mailto:${society.vicePresidentEmail}">${society.vicePresidentEmail}</a>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
      </div>
      
      <!-- Quick Actions -->
      <div class="detail-section">
        <h3>⚡ Quick Actions</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          ${society.email ? `
            <a href="mailto:${society.email}" class="action-btn primary">
              📧 Send Email
            </a>
          ` : ''}
          
          ${society.website ? `
            <a href="${society.website}" target="_blank" rel="noopener noreferrer" class="action-btn secondary">
              🌐 Visit Website
            </a>
          ` : ''}
          
          ${society.presidentEmail ? `
            <a href="mailto:${society.presidentEmail}" class="action-btn tertiary">
              👤 Contact President
            </a>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  modal.classList.add('active');
}

// Close modal
function closeModal() {
  const modal = document.getElementById('societyModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchInput');

  if (!searchInput) {
    console.error("❌ searchInput element not found");
    return;
  }

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    filteredSocieties = allSocieties.filter(society => {
      const matchesSearch = !searchTerm || 
        society.societyName.toLowerCase().includes(searchTerm) ||
        (society.objective || "").toLowerCase().includes(searchTerm) ||
        (society.president || "").toLowerCase().includes(searchTerm) ||
        (society.vicePresident || "").toLowerCase().includes(searchTerm);
      
      const matchesFilter = currentFilter === 'all' || society.category === currentFilter;
      
      return matchesSearch && matchesFilter;
    });

    currentPage = 1;
    updateStats();
    renderSocieties();
  });
}

// Filter functionality
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Get filter value
      currentFilter = btn.dataset.filter;
      
      // Apply filter
      const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
      
      filteredSocieties = allSocieties.filter(society => {
        const matchesSearch = !searchTerm || 
          society.societyName.toLowerCase().includes(searchTerm) ||
          (society.objective || "").toLowerCase().includes(searchTerm) ||
          (society.president || "").toLowerCase().includes(searchTerm) ||
          (society.vicePresident || "").toLowerCase().includes(searchTerm);
        
        const matchesFilter = currentFilter === 'all' || society.category === currentFilter;
        
        return matchesSearch && matchesFilter;
      });
      
      currentPage = 1;
      updateStats();
      renderSocieties();
    });
  });
}

// Sorting functionality
function setupSorting() {
  const sortSelect = document.getElementById('sortBy');

  if (!sortSelect) return;

  sortSelect.addEventListener('change', (e) => {
    const sortValue = e.target.value;

    switch(sortValue) {
      case 'name-asc':
        filteredSocieties.sort((a, b) => a.societyName.localeCompare(b.societyName));
        break;
      case 'name-desc':
        filteredSocieties.sort((a, b) => b.societyName.localeCompare(a.societyName));
        break;
    }

    renderSocieties();
  });
}

// Reset filters
function setupResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortBy');

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset search
      if (searchInput) searchInput.value = '';
      
      // Reset sort
      if (sortSelect) sortSelect.value = 'name-asc';
      
      // Reset filter
      currentFilter = 'all';
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
          btn.classList.add('active');
        }
      });

      // Reset data
      filteredSocieties = [...allSocieties];
      currentPage = 1;
      updateStats();
      renderSocieties();
    });
  }
}

// Pagination (CONTINUED)
function updatePagination() {
  const totalPages = Math.ceil(filteredSocieties.length / itemsPerPage);
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }

  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
  }
}

function setupPagination() {
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderSocieties();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredSocieties.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderSocieties();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Initializing Societies Page...");

  // Load societies from Firebase
  loadSocieties();

  // Setup all functionality
  setupSearch();
  setupFilters();
  setupSorting();
  setupResetButton();
  setupPagination();

  // Modal close handlers
  const closeModalBtn = document.getElementById('closeModal');
  const modalOverlay = document.querySelector('.modal-overlay');

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  console.log("✅ Initialization complete!");
});