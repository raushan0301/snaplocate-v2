// classrooms.js
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

export async function loadClassrooms(container) {
  container.innerHTML = `
    <h2>Manage Classrooms</h2>

    <form id="add-classroom-form">
      <input type="text" id="roomNo" placeholder="Room No" required />
      <input type="text" id="block" placeholder="block Name" required />
      <input type="text" id="floor" placeholder="Floor" required />
      <select id="classType" required>
        <option value="">Select classType</option>
        <option value="Lecture">Lecture</option>
        <option value="Tutorial">Tutorial</option>
        <option value="Lab">Lab</option>
      </select>
      <button type="submit">Add Classroom</button>
    </form>

    <div id="classroomMsg"></div>

    <!-- Upload Excel -->
    <div style="margin: 20px 0;">
      <h3>📤 Bulk Upload via Excel</h3>
      <input type="file" id="excelClassFile" accept=".xlsx, .xls" />
      <button class="upload-btn" id="uploadClassExcelBtn">Upload</button>
      <button class="delete-btn" id="deleteAllClassroomsBtn">Delete All</button>
      <p id="uploadClassStatus"></p>
    </div>

    <input type="text" id="searchClassroomBox" placeholder="Search classroom..." style="width:100%; padding:8px; margin:10px 0;" />

    <div class="table-controls">
      <button id="exportClassroomsBtn">📤 Export to CSV</button>
    </div>

    <table>
      <thead>
         <tr>
             <th data-key="roomNo">Room No ⬍</th>
             <th data-key="block">Block ⬍</th>
             <th data-key="floor">Floor ⬍</th>
             <th data-key="classType">Type ⬍</th>
             <th>Capacity</th>
             <th>Lab Name</th>
            <th>AC</th>
            <th>Class Code</th>
           <th>Actions</th>
         </tr>
      </thead>

      <tbody id="classroomTableBody"></tbody>
    </table>

    <div class="pagination-controls">
      <button id="prevPage">⬅️ Prev</button>
      <span id="pageInfo"></span>
      <button id="nextPage">Next ➡️</button>
    </div>

    <div id="editClassroomModal" class="modal" style="display:none;">
      <div class="modal-content">
        <span id="closeClassroomModal" style="float:right; cursor:pointer;">&times;</span>
        <h3>Edit Classroom</h3>
        <form id="edit-classroom-form">
          <input type="hidden" id="editRoomId" />
          <input type="text" id="editRoomNo" placeholder="Room No" required />
          <input type="text" id="editBlock" placeholder="Block" required />
          <input type="text" id="editFloor" placeholder="Floor" required />
          <input type="text" id="editCapacity" placeholder="Capacity" />
          <input type="text" id="editLabName" placeholder="Lab Name" />
          <input type="text" id="editACStatus" placeholder="AC Status" />
          <input type="text" id="editClassCode" placeholder="Class Code" />
          <select id="editClassType" required>
            <option value="">Select Type</option>
            <option value="Lecture">Lecture</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Lab">Lab</option>
          </select>
          <button type="submit">Update</button>
        </form>
        <div id="editClassroomMsg"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('add-classroom-form');
  const msg = document.getElementById('classroomMsg');
  const searchBox = document.getElementById('searchClassroomBox');
  const exportBtn = document.getElementById('exportClassroomsBtn');
  const tableBody = document.getElementById('classroomTableBody');
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const classRef = collection(db, "classrooms");

  let classrooms = [];
  let filteredClassrooms = [];
  let currentPage = 1;
  const pageSize = 10;
  let currentSortKey = null;
  let sortAsc = true;

  async function loadTable() {
    try {
      const snapshot = await getDocs(classRef);
      classrooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      filteredClassrooms = classrooms;
      renderTable();
    } catch (err) {
      console.error("Error loading classrooms:", err);
    }
  }

  function renderTable() {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filteredClassrooms.slice(start, end);

    tableBody.innerHTML = "";
    if (paginated.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='5'>No classrooms found</td></tr>";
    } else {
      paginated.forEach(c => {
        const row = document.createElement('tr');
       row.innerHTML = `
  <td>${c.roomNo}</td>
  <td>${c.block}</td>
  <td>${c.floor}</td>
  <td>${c.classType}</td>
  <td>${c.capacity || ""}</td>
  <td>${c.labName || ""}</td>
  <td>${c.ACStatus || ""}</td>
  <td>${c.classcode || ""}</td>
  <td>
    <button onclick="editClassroom('${c.id}', \`${c.roomNo}\`, \`${c.block}\`, \`${c.floor}\`, \`${c.type}\`, \`${c.capacity || ""}\`, \`${c.labName || ""}\`, \`${c.ACStatus || ""}\`, \`${c.classcode || ""}\`)">✏️</button>
    <button onclick="deleteClassroom('${c.id}')">🗑️</button>
  </td>
`;

        tableBody.appendChild(row);
      });
    }

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filteredClassrooms.length / pageSize)}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(filteredClassrooms.length / pageSize);
  }

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < Math.ceil(filteredClassrooms.length / pageSize)) {
      currentPage++;
      renderTable();
    }
  };

  searchBox.addEventListener("input", () => {
    const queryText = searchBox.value.toLowerCase();
    filteredClassrooms = classrooms.filter(c =>
      (c.roomNo || "").toLowerCase().includes(queryText) ||
      (c.block || "").toLowerCase().includes(queryText) ||
      (c.floor || "").toLowerCase().includes(queryText) ||
      (c.classType || "").toLowerCase().includes(queryText)
    );
    currentPage = 1;
    renderTable();
  });

  exportBtn.addEventListener("click", () => {
    const rows = [["Room No", "Block", "Floor", "classType"]];
    classrooms.forEach(c => {
      rows.push([c.roomNo, c.block, c.floor, c.classType]);
    });
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "classrooms_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      sortAsc = currentSortKey === key ? !sortAsc : true;
      currentSortKey = key;
      filteredClassrooms.sort((a, b) => {
        const valA = (a[key] || "").toLowerCase();
        const valB = (b[key] || "").toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
      currentPage = 1;
      renderTable();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const roomNo = form.roomNo.value.trim();
    const block = form.block.value.trim();
    const floor = form.floor.value.trim();
    const classType = form.classType.value;

    if (!roomNo || !block || !floor || !classType) {
      msg.textContent = "❗ All fields are required.";
      return;
    }

    const q = query(classRef,
      where("roomNo", "==", roomNo),
      where("block", "==", block)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      msg.textContent = "⚠️ Classroom already exists.";
      return;
    }

   try {
  const newClassroom = { roomNo, block, floor, classType };
await addDoc(classRef, newClassroom);
msg.textContent = "✅ Classroom added.";
form.reset();
loadTable();

  added++;
} catch (error) {
  skippedRows.push({ row, reason: `Firestore error: ${error.message}` });
}

  });

  window.editClassroom = (id, roomNo, block, floor, classType, capacity, labName, ACStatus, classcode) => {
  document.getElementById("editRoomId").value = id;
  document.getElementById("editRoomNo").value = roomNo;
  document.getElementById("editBlock").value = block;
  document.getElementById("editFloor").value = floor;
  document.getElementById("editClassType").value = classType;
  document.getElementById("editCapacity").value = capacity;
  document.getElementById("editLabName").value = labName;
  document.getElementById("editACStatus").value = ACStatus;
  document.getElementById("editClassCode").value = classcode;
  document.getElementById("editClassroomModal").style.display = "block";
};


  document.getElementById("closeClassroomModal").onclick = () => {
    document.getElementById("editClassroomModal").style.display = "none";
  };

  document.getElementById("edit-classroom-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editRoomId").value;
    const roomNo = document.getElementById("editRoomNo").value.trim();
    const block = document.getElementById("editBlock").value.trim();
    const floor = document.getElementById("editFloor").value.trim();
    const capacity = document.getElementById("editCapacity").value.trim();
    const labName = document.getElementById("editLabName").value.trim();
    const ACStatus = document.getElementById("editACStatus").value.trim();
    const classcode = document.getElementById("editClassCode").value.trim();
    const classType = document.getElementById("editClassType").value;
    const editMsg = document.getElementById("editClassroomMsg");

    if (!roomNo || !block || !floor || !classType) {
      editMsg.textContent = "❗ All fields are required.";
      return;
    }

    try {
      await updateDoc(doc(db, "classrooms", id), { roomNo, block, floor, classType,
  capacity, labName, ACStatus, classcode });
      editMsg.textContent = "✅ Updated successfully!";
      setTimeout(() => {
        document.getElementById("editClassroomModal").style.display = "none";
        loadTable();
      }, 1000);
    } catch (err) {
      console.error(err);
      editMsg.textContent = "❌ Update failed.";
    }
  });

  window.deleteClassroom = async function (id) {
    if (confirm("Delete this classroom?")) {
      await deleteDoc(doc(db, "classrooms", id));
      loadTable();
    }
  };

  const sheetScript = document.createElement('script');
  sheetScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  document.body.appendChild(sheetScript);

  document.getElementById("uploadClassExcelBtn").addEventListener("click", async () => {
    const skippedRows = []; // 🆕 track skipped rows with reasons
    const fileInput = document.getElementById("excelClassFile");
    const status = document.getElementById("uploadClassStatus");
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
      for (const entry of jsonData) {
        const roomNo = (entry["roomNo"] || "").toString().trim();
        const block = (entry["block"] || "").toString().trim();
        const floor = (entry["floor"] || "").toString().trim();
        const classType = (entry["classType"] || "").toString().trim();
        const capacity = (entry["capacity"] || "").toString().trim();
        const labName = (entry["labName"] || "").toString().trim();
        const ACStatus = (entry["ACStatus"] || "").toString().trim();
        const classcode = (entry["classcode"] || "").toString().trim();

        if (!roomNo || !block || !floor || !classType) {
  skippedRows.push({
    row: entry,
    reason: `Missing required field(s): ${[
      !roomNo ? "roomNo" : "",
      !block ? "block" : "",
      !floor ? "floor" : "",
      !classType ? "classType" : "",
    ].filter(Boolean).join(", ")}`
  });
  continue;
}


        const q = query(classRef,
          where("roomNo", "==", roomNo),
          where("block", "==", block)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
  skippedRows.push({
    row: entry,
    reason: "Duplicate classroom found in Firestore"
  });
  continue;
}


         await addDoc(classRef, {roomNo,block,floor,classType,capacity,labName,ACStatus,classcode });
        uploaded++;
      }

      let summary = `✅ Uploaded: ${uploaded}`;
if (skippedRows.length) {
  summary += `<br>⚠️ Skipped ${skippedRows.length} row(s):<ul>`;
  for (const { row, reason } of skippedRows) {
    summary += `<li><b>${row?.roomNo || "Unknown Room"}</b>: ${reason}</li>`;
  }
  summary += `</ul>`;
}
status.innerHTML = summary;

      await loadTable();
    };
    reader.readAsArrayBuffer(file);
  });

  document.getElementById("deleteAllClassroomsBtn").addEventListener("click", async () => {
    const status = document.getElementById("uploadClassStatus");
    if (!confirm("⚠️ Are you sure you want to delete ALL classroom records?")) return;
    const snapshot = await getDocs(classRef);
    let count = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "classrooms", docSnap.id));
      count++;
    }
    status.textContent = `❌ Deleted ${count} classroom records.`;
    await loadTable();
  });

  loadTable();
}
