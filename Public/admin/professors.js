// professors.js
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs";

export async function loadProfessors(container) {
  container.innerHTML = `
    <h2>👨‍🏫 Professors</h2>

    <!-- Control Buttons -->
    <div class="button-group">
      <button onclick="document.getElementById('add-form').scrollIntoView({ behavior: 'smooth' })">➕ Add Professor</button>
      <button onclick="loadProfessors(document.querySelector('#content'))">🔄 Refresh List</button>
    </div>

    <!-- Add Professor Form -->
    <form id="add-form">
      <input type="text" id="profname" placeholder="Name" required />
      <input type="text" id="profdepartment" placeholder="department" required />
      <input type="text" id="profemail" placeholder="email" required />
      <input type="text" id="profspecialization" placeholder="specialization" required />
      <input type="text" id="profcabinNo" placeholder="Cabin No" required />
      <input type="text" id="profDesignation" placeholder="Designation" required />
      <button type="submit">Add Professor</button>
    </form>
    <div id="message"></div>

    <!-- Upload Excel File -->
    <div style="margin: 20px 0;">
      <h3>📤 Bulk Upload via Excel</h3>
      <input type="file" id="excelUpload" accept=".xlsx, .xls" />
      <button class="upload-btn" id="uploadExcelBtn">Upload</button>
      <button class="delete-btn" id="deleteAllProfessorsBtn">Delete All</button>
      <p id="uploadStatus"></p>
    </div>

    <!-- Search Box -->
    <input type="text" id="searchBox" placeholder="🔍 Search by name, department, or specialization..." style="margin: 10px 0; padding: 5px; width: 100%;" />

    <!-- Export to CSV Button -->
    <div class="table-controls">
      <button id="exportProfessorsBtn">📤 Export Professors to CSV</button>
    </div>

    <!-- Professors Table -->
    <table id="professorTable">
      <thead>
        <tr>
          <th data-key="name">Name ⬍</th>
          <th data-key="department">department ⬍</th>
          <th data-key="Designation">Designation ⬍</th>
          <th data-key="cabinNo">cabinNo ⬍</th>
          <th>email</th>
          <th>specialization</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>

    <!-- Pagination Controls -->
    <div class="pagination-controls">
      <button id="prevPage">⬅️ Prev</button>
      <span id="pageInfo"></span>
      <button id="nextPage">Next ➡️</button>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" class="modal" style="display:none;">
      <div class="modal-content">
        <span id="closeModal" style="float:right; cursor:pointer;">&times;</span>
        <h3>Edit Professor</h3>
        <form id="edit-form">
          <input type="hidden" id="editId" />
          <input type="text" id="editname" placeholder="name" required />
          <input type="text" id="editdepartment" placeholder="department" required />
          <input type="text" id="editemail" placeholder="email" required />
          <input type="text" id="editspecialization" placeholder="specialization" required />
          <input type="text" id="editcabinNo" placeholder="cabin no" required />
          <input type="text" id="editDesignation" placeholder="Designation" required />
          <button type="submit">Save Changes</button>
        </form>
        <div id="editMessage"></div>
      </div>
    </div>
  `;

  const profRef = collection(db, "professors");
  const tableBody = container.querySelector('#professorTable tbody');
  const pageInfo = container.querySelector('#pageInfo');
  const prevBtn = container.querySelector('#prevPage');
  const nextBtn = container.querySelector('#nextPage');
  const searchBox = document.getElementById("searchBox");
  const form = document.getElementById("add-form");
  const msg = document.getElementById("message");
  const exportBtn = document.getElementById("exportProfessorsBtn");
  const excelUpload = document.getElementById("excelUpload");
  const uploadStatus = document.getElementById("uploadStatus");
  const uploadBtn = document.getElementById("uploadExcelBtn");
  const deleteAllBtn = document.getElementById("deleteAllProfessorsBtn");

  let professors = [], filteredProfessors = [];
  let currentPage = 1;
  const pageSize = 10;
  let currentSortKey = null;
  let sortAsc = true;

  async function loadData() {
    const snapshot = await getDocs(profRef);
    professors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    filteredProfessors = professors;
    renderTable();
  }

  function applySearchFilter() {
    const queryText = searchBox.value.toLowerCase();
    filteredProfessors = professors.filter(p =>
      (p.name || '').toLowerCase().includes(queryText) ||
      (p.department || '').toLowerCase().includes(queryText) ||
      (p.specialization || '').toLowerCase().includes(queryText)
    );
    currentPage = 1;
    renderTable();
  }

  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filteredProfessors.slice(start, end);

    tableBody.innerHTML = paginated.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.department}</td>
        <td>${p.Designation}</td>
        <td>${p.email}</td>
        <td>${p.cabinNo}</td>
        <td>${p.specialization}</td>
        <td>
          <button onclick="editProfessor('${p.id}', '${p.name}', '${p.department}', '${p.email}', '${p.specialization}', '${p.Designation}','${p.cabinNo}')">✏️</button>
          <button onclick="deleteProfessor('${p.id}')">🗑️</button>
        </td>
      </tr>`).join("");

    const totalPages = Math.ceil(filteredProfessors.length / pageSize);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
  nextBtn.onclick = () => { if (currentPage < Math.ceil(filteredProfessors.length / pageSize)) { currentPage++; renderTable(); } };

  container.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      sortAsc = key === currentSortKey ? !sortAsc : true;
      currentSortKey = key;
      filteredProfessors.sort((a, b) => sortAsc ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]));
      currentPage = 1;
      renderTable();
    });
  });

  exportBtn.addEventListener("click", () => {
    const rows = [["name", "department", "Designation", "email", "Cabin No","specialization"]];
    professors.forEach(p => {
      rows.push([p.name, p.department, p.Designation, p.email, p.cabinNo, p.specialization]);
    });
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "professors_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.profname.value.trim();
    const department = form.profdepartment.value.trim();
    const email = form.profemail.value.trim();
    const specialization = form.profspecialization.value.trim();
    const Designation = form.profDesignation.value.trim();
    const cabinNo = form.profcabinNo.value.trim();

    if (!name || !department || !email ) {
      msg.textContent = "❗ Please fill all fields.";
      return;
    }

    const q = query(profRef, where("name", "==", name), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      msg.textContent = "⚠️ Professor already exists.";
      return;
    }

    await addDoc(profRef, { name, department, email, specialization, Designation,cabinNo });
    msg.textContent = "✅ Professor added!";
    form.reset();
    loadData();
  });

  uploadBtn.addEventListener("click", async () => {
    const file = excelUpload.files[0];
    if (!file) {
      uploadStatus.textContent = "Please select an Excel file.";
      return;
    }

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

const normalizedJson = json.map(row => {
  const normalized = {};
  for (const key in row) {
    normalized[key.trim().toLowerCase()] = row[key];
  }
  return normalized;
});

let uploaded = 0, skipped = 0;
let skippedRows = [];

for (const [index, row] of normalizedJson.entries()) {
  const name = row["name"];
  const department = row["department"];
  const email = row["email"];
  const specialization = row["specialization"];
  const Designation = row["designation"]; // Note: lowercase
  const cabinNo = row["cabinno"];         // Note: lowercase

  // const { name, department, email, specialization, Designation, cabinNo } = row;

  if (!name || !department || !email || !specialization || !Designation || !cabinNo) {
    skipped++;
    skippedRows.push(`Row ${index + 2}: Missing required fields`);
    continue;
  }

  const q = query(profRef, where("name", "==", name), where("email", "==", email));
  const snap = await getDocs(q);
  if (!snap.empty) {
    skipped++;
    skippedRows.push(`Row ${index + 2}: Duplicate entry (name/email exists)`);
    continue;
  }

  await addDoc(profRef, {
    name,
    department,
    email,
    specialization,
    Designation,
    cabinNo
  });
  uploaded++;
}

// Update final summary with skip reasons (first 5 shown for brevity)
let summary = `✅ Uploaded: ${uploaded}, ⚠️ Skipped: ${skipped}`;
if (skippedRows.length > 0) {
  const preview = skippedRows.slice(0, 5).join('\n');
  summary += `\n\nReasons:\n${preview}${skippedRows.length > 5 ? "\n...and more" : ""}`;
}
uploadStatus.textContent = summary;
    await loadData();
  });

  deleteAllBtn.addEventListener("click", async () => {
    if (!confirm("⚠️ Are you sure you want to delete ALL professor records?")) return;
    const snapshot = await getDocs(profRef);
    let count = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "professors", docSnap.id));
      count++;
    }
    uploadStatus.textContent = `❌ Deleted ${count} professor records.`;
    await loadData();
  });

  window.editProfessor = function (id, name, department, email, specialization, Designation, cabinNo) {
    document.getElementById("editId").value = id;
    document.getElementById("editname").value = name;
    document.getElementById("editdepartment").value = department;
    document.getElementById("editemail").value = email;
    document.getElementById("editspecialization").value = specialization;
    document.getElementById("editDesignation").value = Designation;
    document.getElementById("editcabinNo").value = cabinNo;
    document.getElementById("editModal").style.display = "block";
  };

  document.getElementById("closeModal").onclick = () => {
    document.getElementById("editModal").style.display = "none";
  };

  document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editId").value;
    const name = document.getElementById("editname").value.trim();
    const department = document.getElementById("editdepartment").value.trim();
    const email = document.getElementById("editemail").value.trim();
    const specialization = document.getElementById("editspecialization").value.trim();
    const cabinNo = document.getElementById("editcabinNo").value.trim();
    const Designation = document.getElementById("editDesignation").value.trim();
    const msgBox = document.getElementById("editMessage");

    if (!name || !department || !email ) {
      msgBox.textContent = "❗ Fill all fields.";
      return;
    }

    try {
      await updateDoc(doc(db, "professors", id), { name, department, email, specialization, Designation, cabinNo });
      msgBox.textContent = "✅ Updated!";
      setTimeout(() => {
        document.getElementById("editModal").style.display = "none";
        loadData();
      }, 1000);
    } catch (err) {
      console.error(err);
      msgBox.textContent = "❌ Update failed.";
    }
  });

  window.deleteProfessor = async function (id) {
    if (confirm("Are you sure you want to delete this professor?")) {
      await deleteDoc(doc(db, "professors", id));
      loadData();
    }
  };

  searchBox.addEventListener("input", applySearchFilter);
  await loadData();
}
