import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  increment,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDB2bm2KBo6geTRSlVHOhqhUQX-6Mozp1Y",
  authDomain: "snaplocateproject.firebaseapp.com",
  projectId: "snaplocateproject",
  storageBucket: "snaplocateproject.appspot.com",
  messagingSenderId: "150513277214",
  appId: "1:150513277214:web:e7fef8e692bd89af65510f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const yearSelect = document.getElementById('yearSelect');
const semesterSelect = document.getElementById('semesterSelect');
const branchSelect = document.getElementById('branchSelect');
const subjectSelect = document.getElementById('subjectSelect');
const academicContainer = document.getElementById('academic-container');

let academicData = [];
const ratedSubjects = JSON.parse(localStorage.getItem('ratedSubjects') || '{}');

async function fetchAcademicData() {
  const querySnapshot = await getDocs(collection(db, "academic"));
  academicData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const years = [...new Set(academicData.map(d => d.year))].sort((a, b) => parseInt(a) - parseInt(b));
  populateDropdown(yearSelect, years, '-- Select Year --');
}

function populateDropdown(select, options, defaultText) {
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = defaultText;
  select.appendChild(defaultOption);
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

function filterSubjects(year, semester, branch) {
  return academicData.filter(
    d => d.year === year && d.semester === semester && d.branch === branch
  );
}

// ------- UI Rendering Logic -----------

function createTagLink(item) {
  const a = document.createElement('a');
  a.href = item.url;
  a.textContent = item.name;
  a.className = 'tag';
  a.target = '_blank';
  return a;
}

function renderTabs(sections) {
  const tabs = document.createElement('div');
  tabs.className = 'tabs';

  Object.keys(sections).forEach((key, index) => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (index === 0 ? ' active' : '');
    tab.textContent = key;
    tab.dataset.tab = key;
    tabs.appendChild(tab);
  });

  return tabs;
}

function renderPYQSubTabs(pyqData, contentArea) {
  const subTabs = document.createElement('div');
  subTabs.className = 'sub-tabs';

  const subsections = { MST: 'mst', EST: 'est', AUXI: 'auxi' };

  Object.keys(subsections).forEach((label, index) => {
    const btn = document.createElement('button');
    btn.className = 'sub-tab' + (index === 0 ? ' active' : '');
    btn.textContent = label;
    btn.dataset.subsection = subsections[label];
    subTabs.appendChild(btn);
  });

  contentArea.appendChild(subTabs);

  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'tags';
  contentArea.appendChild(tagsContainer);

  function loadSubSection(subsection) {
    tagsContainer.innerHTML = '';
    (pyqData[subsection] || []).forEach(item => {
      tagsContainer.appendChild(createTagLink(item));
    });
  }

  loadSubSection('mst');

  subTabs.querySelectorAll('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      subTabs.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSubSection(btn.dataset.subsection);
    });
  });
}

function createRatingInput(subjId, docRef) {
  const ratingRow = document.createElement('div');
  ratingRow.className = 'rating-row';

  const label = document.createElement('b');
  label.textContent = 'Rate:';

  const starsWrapper = document.createElement('span');
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.textContent = '☆';
    star.className = 'star';
    star.dataset.value = i;

    star.addEventListener('click', async () => {
      if (ratedSubjects[subjId]) {
        alert('You have already rated this subject.');
        return;
      }
      const confirmRate = confirm(`Submit your ${i}★ rating?`);
      if (!confirmRate) return;

      const snap = await getDoc(docRef);
      const data = snap.data();
      const newCount = (data.ratingCount || 0) + 1;
      const newRating = ((data.rating || 0) * (newCount - 1) + i) / newCount;

      await updateDoc(docRef, { rating: newRating, ratingCount: newCount });
      ratedSubjects[subjId] = true;
      localStorage.setItem('ratedSubjects', JSON.stringify(ratedSubjects));
      alert(`Thanks for rating ${i}★!`);
    });

    starsWrapper.appendChild(star);
  }

  ratingRow.appendChild(label);
  ratingRow.appendChild(starsWrapper);
  return ratingRow;
}

function renderAcademicCard(subj) {
  academicContainer.innerHTML = '';
  const docRef = doc(db, "academic", subj.id);
  updateDoc(docRef, { views: increment(1) });

  const card = document.createElement('div');
  card.className = 'academic-card';

  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <h2 class="subject">${subj.subject}</h2>
    <span class="contributor">Contributor: ${subj.contributor || 'Unknown'}</span>
  `;
  card.appendChild(header);

  const sections = {
    Syllabus: subj.syllabus || [],
    Notes: subj.notes || [],
    "Lab Manual": subj.labManual || [],
    Tutorial: subj.tutorial || [],
    PYQs: subj.pyq || { mst: [], est: [], auxi: [] },
    Playlist: subj.playlist || [],
  };

  const tabs = renderTabs(sections);
  card.appendChild(tabs);

  const contentArea = document.createElement('div');
  contentArea.className = 'tab-content';
  card.appendChild(contentArea);

  // Default Load Syllabus
  sections.Syllabus.forEach(item => contentArea.appendChild(createTagLink(item)));

  tabs.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      contentArea.innerHTML = '';

      if (tab.dataset.tab === 'PYQs') {
        renderPYQSubTabs(sections.PYQs, contentArea);
      } else {
        (sections[tab.dataset.tab] || []).forEach(item => {
          contentArea.appendChild(createTagLink(item));
        });
      }
    });
  });

  const footer = document.createElement('div');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="info"><p>Rating</p><strong>${(subj.rating || 0).toFixed(1)} ⭐</strong></div>
    <div class="info"><p>Views</p><strong>${subj.views || 0}</strong></div>
  `;
  footer.appendChild(createRatingInput(subj.id, docRef));
  card.appendChild(footer);

  academicContainer.appendChild(card);

  // Live Rating Update
  onSnapshot(docRef, snap => {
    const data = snap.data();
    const footerRating = footer.querySelector('strong');
    if (footerRating) footerRating.textContent = `${(data.rating || 0).toFixed(1)} ⭐`;
  });
}

// Dropdown Listeners
yearSelect.addEventListener('change', () => {
  populateDropdown(semesterSelect, [], '-- Select Semester --');
  populateDropdown(branchSelect, [], '-- Select Branch --');
  academicContainer.innerHTML = '';

  const semesters = academicData
    .filter(d => d.year === yearSelect.value)
    .map(d => d.semester);
  const uniqueSemesters = [...new Set(semesters)];
  populateDropdown(semesterSelect, uniqueSemesters, '-- Select Semester --');
});

semesterSelect.addEventListener('change', () => {
  populateDropdown(branchSelect, [], '-- Select Branch --');
  academicContainer.innerHTML = '';

  const branches = academicData
    .filter(d => d.year === yearSelect.value && d.semester === semesterSelect.value)
    .map(d => d.branch);
  const uniqueBranches = [...new Set(branches)];
  populateDropdown(branchSelect, uniqueBranches, '-- Select Branch --');
});

branchSelect.addEventListener('change', () => {
  academicContainer.innerHTML = '';
  subjectSelect.innerHTML = ''; // Reset Subject Dropdown

  const subjects = filterSubjects(yearSelect.value, semesterSelect.value, branchSelect.value);
  
  if (subjects.length > 0) {
    populateDropdown(subjectSelect, subjects.map(s => s.subject), '-- Select Subject --');
  } else {
    subjectSelect.innerHTML = '<option value="">No subjects found</option>';
  }
});

subjectSelect.addEventListener('change', () => {
  academicContainer.innerHTML = '';
  if (!subjectSelect.value) return;

  const selectedSubject = academicData.find(d =>
    d.year === yearSelect.value &&
    d.semester === semesterSelect.value &&
    d.branch === branchSelect.value &&
    d.subject === subjectSelect.value
  );

  if (selectedSubject) {
    renderAcademicCard(selectedSubject);
  }
});


fetchAcademicData();



// Highlight active navbar link
const navLinks = document.querySelectorAll(".nav-links a");
let currentPath = window.location.pathname.split("/").filter(Boolean).pop() || "index";

// Handle Firebase clean URLs (no .html)
if (!currentPath.includes(".")) {
  currentPath += ".html";  // convert "academic" → "academic.html"
}

// Compare against your HTML hrefs
navLinks.forEach(link => {
  if (link.getAttribute("href") === currentPath) {
    link.classList.add("active");
  }
});





