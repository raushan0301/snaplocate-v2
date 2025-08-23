// academic.js
import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase-config.js';

import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadAcademic(container) {
  container.innerHTML = `
    <h2>📚 Manage Academic Resources</h2>
    <form id="add-academic-form">
      <input type="text" id="branch" placeholder="Branch (e.g., COE)" required />
      <input type="number" id="year" placeholder="Year (e.g., 1)" min="1" max="4" required />
      <input type="number" id="semester" placeholder="Semester (e.g., 2)" min="1" max="8" required />
      <input type="text" id="subject" placeholder="Subject Name" required />
      <input type="url" id="notes" placeholder="Notes Link" />
      <input type="url" id="pyq" placeholder="PYQs Link" />
      <input type="url" id="playlist" placeholder="YouTube Playlist Link" />
      <button type="submit">Add Resource</button>
    </form>

    <div id="academicMsg"></div>

    <!-- Upload Excel -->
    <div style="margin: 20px 0;">
      <h3>📤 Bulk Upload via Excel</h3>
      <input type="file" id="excelFile" accept=".xlsx, .xls" />
     <button id="uploadExcelBtn" class="upload-btn">Upload</button>
    <button id="deleteAllBtn" class="delete-btn">Delete All</button>

      <p id="uploadStatus"></p>
    </div>

    <div class="table-controls">
      <input type="text" id="academicSearch" placeholder="🔍 Search..." style="margin: 10px 0; padding: 8px; width: 100%;" />
      <button id="exportAcademicBtn">📤 Export Academic to CSV</button>
    </div>

    <table>
      <thead>
        <tr>
          <th data-key="branch">Branch ⬍</th>
          <th data-key="year">Year ⬍</th>
          <th data-key="semester">Semester ⬍</th>
          <th data-key="subject">Subject ⬍</th>
          <th>Notes</th><th>PYQs</th><th>Playlist</th><th>Actions</th>
        </tr>
      </thead>
      <tbody id="academicTableBody"></tbody>
    </table>

    <div class="pagination-controls">
      <button id="prevAcademicPage">⬅️ Prev</button>
      <span id="academicPageInfo"></span>
      <button id="nextAcademicPage">Next ➡️</button>
    </div>

    <!-- Edit Modal -->
    <div id="editAcademicModal" class="modal" style="display:none;">
      <div class="modal-content">
        <span id="closeAcademicModal" style="float:right; cursor:pointer;">&times;</span>
        <h3>Edit Resource</h3>
        <form id="edit-academic-form">
          <input type="hidden" id="editDocId" />
          <input type="text" id="editBranch" placeholder="Branch" required />
          <input type="number" id="editYear" placeholder="Year" required />
          <input type="number" id="editSemester" placeholder="Semester" required />
          <input type="text" id="editSubject" placeholder="Subject" required />
          <input type="url" id="editNotes" placeholder="Notes Link" />
          <input type="url" id="editPyq" placeholder="PYQs Link" />
          <input type="url" id="editPlaylist" placeholder="Playlist Link" />
          <button type="submit">Update</button>
        </form>
        <div id="editAcademicMsg"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('add-academic-form');
  const msg = document.getElementById('academicMsg');
  const exportBtn = document.getElementById('exportAcademicBtn');
  const tableBody = document.getElementById('academicTableBody');
  const searchInput = document.getElementById('academicSearch');
  const pageInfo = document.getElementById('academicPageInfo');
  const prevBtn = document.getElementById('prevAcademicPage');
  const nextBtn = document.getElementById('nextAcademicPage');
  const academicRef = collection(db, "academic");

  let dataList = [];
  let currentPage = 1;
  const pageSize = 10;
  let currentSortKey = null;
  let sortAsc = true;

  async function loadTable() {
    const snapshot = await getDocs(academicRef);
    dataList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTable();
  }

  function renderLinks(field, defaultLabel) {
  if (Array.isArray(field)) {
    return field.map(item => `<a href="${item.url}" target="_blank">${item.name}</a>`).join('<br>');
  } else if (typeof field === 'string' && field.trim() !== "") {
    return `<a href="${field}" target="_blank">${defaultLabel}</a>`;
  }
  return '-';
}

  function renderPYQLinks(pyqField) {
  if (!pyqField || typeof pyqField !== 'object') return '-';

  let result = '';

  ['mst', 'est', 'auxi'].forEach(section => {
    if (Array.isArray(pyqField[section]) && pyqField[section].length > 0) {
      result += `<strong>${section.toUpperCase()}:</strong><br>`;
      result += pyqField[section].map(item =>
        `<a href="${item.url}" target="_blank">${item.name}</a>`
      ).join('<br>') + '<br>';
    }
  });

  return result || '-';
}


  function renderTable() {
    const queryText = searchInput.value.toLowerCase();
    let filtered = dataList.filter(item =>
      item.subject.toLowerCase().includes(queryText) ||
      item.branch.toLowerCase().includes(queryText) ||
      item.semester.toString().includes(queryText) ||
      item.year.toString().includes(queryText)
    );

    if (currentSortKey) {
      filtered.sort((a, b) =>
        sortAsc ? String(a[currentSortKey]).localeCompare(String(b[currentSortKey]))
                : String(b[currentSortKey]).localeCompare(String(a[currentSortKey]))
      );
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    tableBody.innerHTML = pageData.length
      ? pageData.map(r => `
        <tr>
          <td>${r.branch}</td>
          <td>${r.year}</td>
          <td>${r.semester}</td>
          <td>${r.subject}</td>
          <td>${renderLinks(r.notes, "Notes")}</td>
          <td>${renderPYQLinks(r.pyq)}</td>
          <td>${renderLinks(r.playlist, "Playlist")}</td>
          <td>
            <button onclick="editAcademic('${r.id}', '${r.branch}', ${r.year}, ${r.semester}, '${r.subject}', '${r.notes}', '${r.pyq}', '${r.playlist}')">✏️</button>
            <button onclick="deleteAcademic('${r.id}')">🗑️</button>
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan='8'>No data found.</td></tr>`;

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filtered.length / pageSize)}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(filtered.length / pageSize);
  }

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });

  prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
  nextBtn.onclick = () => { currentPage++; renderTable(); };

  document.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      sortAsc = currentSortKey === key ? !sortAsc : true;
      currentSortKey = key;
      renderTable();
    });
  });

  exportBtn.addEventListener("click", () => {
    const rows = [["Branch", "Year", "Semester", "Subject", "Notes", "PYQs", "Playlist"]];
    dataList.forEach(r => rows.push([r.branch, r.year, r.semester, r.subject, r.notes, r.pyq, r.playlist]));
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "academic_resources.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      branch: form.branch.value.trim().toUpperCase(),
      year: parseInt(form.year.value),
      semester: parseInt(form.semester.value),
      subject: form.subject.value.trim(),
      notes: form.notes.value.trim(),
      pyq: form.pyq.value.trim(),
      playlist: form.playlist.value.trim()
    };

    if (!data.branch || !data.year || !data.semester || !data.subject) {
      msg.textContent = "❗ Branch, Year, Semester & Subject are required.";
      return;
    }
    const docId = data.subject.trim().toLowerCase().replace(/\s+/g, '_');
   const docSnap = await getDoc(doc(academicRef, docId));
if (docSnap.exists()) {
  msg.textContent = "⚠️ Resource already exists.";
  return;
}
    try {
    await setDoc(doc(academicRef, docId), data);
      msg.textContent = "✅ Resource added!";
      form.reset();
      loadTable();
    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Error adding resource.";
    }
  });

  window.editAcademic = (id, branch, year, semester, subject, notes, pyq, playlist) => {
    document.getElementById("editDocId").value = id;
    document.getElementById("editBranch").value = branch;
    document.getElementById("editYear").value = year;
    document.getElementById("editSemester").value = semester;
    document.getElementById("editSubject").value = subject;
    document.getElementById("editNotes").value = notes;
    document.getElementById("editPyq").value = pyq;
    document.getElementById("editPlaylist").value = playlist;
    document.getElementById("editAcademicModal").style.display = "block";
  };

  document.getElementById("closeAcademicModal").onclick = () => {
    document.getElementById("editAcademicModal").style.display = "none";
  };

  document.getElementById("edit-academic-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editDocId").value;
    const data = {
      branch: document.getElementById("editBranch").value.trim().toUpperCase(),
      year: parseInt(document.getElementById("editYear").value),
      semester: parseInt(document.getElementById("editSemester").value),
      subject: document.getElementById("editSubject").value.trim(),
      notes: document.getElementById("editNotes").value.trim(),
      pyq: document.getElementById("editPyq").value.trim(),
      playlist: document.getElementById("editPlaylist").value.trim()
    };

    const msgBox = document.getElementById("editAcademicMsg");
    if (!data.branch || !data.year || !data.semester || !data.subject) {
      msgBox.textContent = "❗ All required fields must be filled.";
      return;
    }

    try {
      await updateDoc(doc(db, "academic", id), data);
      msgBox.textContent = "✅ Updated!";
      setTimeout(() => {
        document.getElementById("editAcademicModal").style.display = "none";
        loadTable();
      }, 1000);
    } catch (err) {
      console.error(err);
      msgBox.textContent = "❌ Update failed.";
    }
  });

  window.deleteAcademic = async function (id) {
    if (confirm("Delete this resource?")) {
      await deleteDoc(doc(db, "academic", id));
      loadTable();
    }
  };

  const sheetScript = document.createElement('script');
  sheetScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  document.body.appendChild(sheetScript);

  document.getElementById("uploadExcelBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("excelFile");
    const status = document.getElementById("uploadStatus");
    if (!fileInput.files.length) {
      status.textContent = "Please select an Excel file.";
      return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      let uploaded = 0, skipped = 0;
    function parseField(field) {
  if (!field) return [];
  return field.split(';;').map(item => {
    const parts = (item || "").split('|');
    const name = (parts[0] || "").trim();
    const url = (parts[1] || "").trim();
    return { name, url };
  }).filter(obj => obj.name || obj.url); // remove empty rows
}


      function parsePYQField(field) {
  const pyq = { mst: [], est: [], auxi: [] };
  if (!field) return pyq;
  const items = field.split(';;');
  items.forEach(item => {
    const [section, name, url] = item.split('|').map(x => x.trim());
    if (section && pyq[section.toLowerCase()]) {
      pyq[section.toLowerCase()].push({ name, url });
    }
  });
  return pyq;
}


      for (const entry of jsonData) {
       const branch = (entry.branch || "").trim().toUpperCase();
      const year = (entry.year || "").trim();
      const semester = (entry.semester || "").trim();
      const subject = (entry.subject || "").trim();
      const contributor = (entry.contributor || "").trim();

        if (!branch || !year || !semester || !subject) {
          skipped++;
          continue;
        }
        const docId = subject.toLowerCase().replace(/\s+/g, '_');
        const docSnap = await getDoc(doc(academicRef, docId));
if (docSnap.exists()) {
  skipped++;
    continue;
}
         await setDoc(doc(academicRef, docId), {
        branch, year, semester, subject, contributor,
        syllabus: parseField(entry.syllabus),
        notes: parseField(entry.notes),
         labManual: parseField(entry.labManual),
          tutorial: parseField(entry.tutorial),
          pyq: parsePYQField(entry.pyq),
          playlist: parseField(entry.playlist),
           rating: parseFloat(entry.rating) || 0,
           ratingCount: parseInt(entry.ratingCount) || 0,
           views: parseInt(entry.views) || 0
          });

        uploaded++;
         }

      status.textContent = `✅ Uploaded: ${uploaded}, ⚠️ Skipped: ${skipped}`;
      await loadTable();
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById("deleteAllBtn").addEventListener("click", async () => {
    const status = document.getElementById("uploadStatus");
    if (!confirm("⚠️ Are you sure you want to delete ALL academic records?")) return;
    const snapshot = await getDocs(academicRef);
    let count = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "academic", docSnap.id));
      count++;
    }
    status.textContent = `❌ Deleted ${count} academic records.`;
    await loadTable();
  });

  loadTable();
}
