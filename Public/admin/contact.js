// contact.js
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadContactMessages(container) {
  container.innerHTML = `
    <h2>📩 Contact Messages</h2>
    <div class="table-controls">
      <input type="text" id="contactSearch" placeholder="Search by name, email or message..." style="padding:8px; width: 100%; margin: 10px 0;" />
      <select id="readStatusFilter" style="margin: 0 10px;">
        <option value="all">All</option>
        <option value="unread">Unread</option>
        <option value="read">Read</option>
      </select>
      <button id="exportContactBtn">📤 Export Messages to CSV</button>
    </div>
    <table>
      <thead>
        <tr>
          <th data-key="name">Name ⬍</th>
          <th data-key="email">Email ⬍</th>
          <th data-key="message">Message ⬍</th>
          <th data-key="timestamp">Timestamp ⬍</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="contactTableBody"></tbody>
    </table>
    <div class="pagination-controls">
      <button id="prevContactPage">⬅️ Prev</button>
      <span id="contactPageInfo"></span>
      <button id="nextContactPage">Next ➡️</button>
    </div>
  `;

  const searchInput = document.getElementById('contactSearch');
  const tableBody = document.getElementById('contactTableBody');
  const exportBtn = document.getElementById('exportContactBtn');
  const prevBtn = document.getElementById('prevContactPage');
  const nextBtn = document.getElementById('nextContactPage');
  const pageInfo = document.getElementById('contactPageInfo');
  const readStatusFilter = document.getElementById('readStatusFilter');

  const contactRef = collection(db, "messages");
  const q = query(contactRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  let messages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  let currentPage = 1;
  const pageSize = 10;
  let currentSortKey = null;
  let sortAsc = true;

  function renderTable() {
    const val = searchInput.value.toLowerCase();
    const filterStatus = readStatusFilter.value;

    let filtered = messages.filter(m => {
      const matchesSearch =
        (m.name?.toLowerCase().includes(val) ||
         m.email?.toLowerCase().includes(val) ||
         m.message?.toLowerCase().includes(val));
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "read" && m.read) ||
        (filterStatus === "unread" && !m.read);
      return matchesSearch && matchesStatus;
    });

    if (currentSortKey) {
      filtered.sort((a, b) => {
        const valA = a[currentSortKey] || "";
        const valB = b[currentSortKey] || "";
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageData = filtered.slice(start, end);

    tableBody.innerHTML = pageData.length ?
      pageData.map(msg => {
        const time = msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : '—';
        const status = msg.read ? "✅ Read" : "📨 Unread";
        return `
          <tr>
            <td>${msg.name}</td>
            <td>${msg.email}</td>
            <td>${msg.message}</td>
            <td>${time}</td>
            <td>${status}</td>
            <td>
              <button onclick="markAsRead('${msg.id}')">✔️ Mark Read</button>
              <button onclick="deleteMessage('${msg.id}')">🗑️</button>
            </td>
          </tr>`;
      }).join('') : "<tr><td colspan='6'>No messages found.</td></tr>";

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(filtered.length / pageSize)}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= Math.ceil(filtered.length / pageSize);
  }

  searchInput.addEventListener('input', () => {
    currentPage = 1;
    renderTable();
  });

  readStatusFilter.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
  });

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };

  nextBtn.onclick = () => {
    currentPage++;
    renderTable();
  };

  document.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      sortAsc = currentSortKey === key ? !sortAsc : true;
      currentSortKey = key;
      renderTable();
    });
  });

  exportBtn.addEventListener("click", () => {
    const rows = [["Name", "Email", "Message", "Timestamp", "Status"]];
    messages.forEach(m => {
      const time = m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : "";
      rows.push([m.name, m.email, m.message, time, m.read ? "Read" : "Unread"]);
    });
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const uri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", "contact_messages.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  window.deleteMessage = async function (id) {
    if (confirm("Delete this message?")) {
      await deleteDoc(doc(db, "messages", id));
      messages = messages.filter(m => m.id !== id);
      renderTable();
    }
  };

  window.markAsRead = async function (id) {
    try {
      await updateDoc(doc(db, "messages", id), { read: true });
      messages = messages.map(m => m.id === id ? { ...m, read: true } : m);
      renderTable();
    } catch (err) {
      console.error("Error marking message as read", err);
    }
  };

  renderTable();
}
