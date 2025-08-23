// dashboard.js
import { db } from './firebase-config.js';
import {
  collection,
  getCountFromServer,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔃 Load Dashboard Layout
export async function loadDashboard(container) {
  container.innerHTML = `
    <h2>📊 Dashboard Overview</h2>

    <!-- 🟦 Summary Cards -->
    <div class="dashboard-cards">
      <div class="card card-blue">
        <i class="fas fa-user-tie icon"></i>
        <div><strong id="professorCount">Professors: ...</strong></div>
      </div>
      <div class="card card-green">
        <i class="fas fa-building icon"></i>
        <div><strong id="classroomCount">Classrooms: ...</strong></div>
      </div>
      <div class="card card-purple">
        <i class="fas fa-book icon"></i>
        <div><strong id="academicCount">Academic: ...</strong></div>
      </div>
      <div class="card card-red">
        <i class="fas fa-envelope icon"></i>
        <div><strong id="messageCount">Messages: ...</strong></div>
      </div>
    </div>

    <!-- 🔍 Filter by Branch -->
    <div class="filters" style="margin-top: 20px;">
      <label for="branchFilter">🎓 Filter by Branch:</label>
      <select id="branchFilter">
        <option value="all">All</option>
        <option value="CSE">CSE</option>
        <option value="COE">COE</option>
        <option value="ECE">ECE</option>
        <option value="ME">ME</option>
        <!-- Add more as needed -->
      </select>
    </div>

    <!-- 📊 Charts -->
    <canvas id="chartCanvas" style="margin-top: 40px; max-width: 800px;"></canvas>
    <canvas id="pieCanvas" style="margin-top: 40px; max-width: 800px;"></canvas>
    <canvas id="lineCanvas" style="margin-top: 40px; max-width: 800px;"></canvas>

    <!-- 🕓 Recent Logs -->
    <h3 style="margin-top: 40px;">🕓 Recent Activity Logs</h3>
    <ul id="activityLog" class="activity-log"></ul>
    <button id="exportLogsBtn" class="export-btn">📤 Export Logs to CSV</button>
  `;

  // ✅ Update Summary Cards
  const updateCount = async (collectionName, elementId) => {
    const colRef = collection(db, collectionName);
    const snapshot = await getCountFromServer(colRef);
    document.getElementById(elementId).innerText =
      `${elementId.replace("Count", "")}: ${snapshot.data().count}`;
  };

  await updateCount("professors", "professorCount");
  await updateCount("classrooms", "classroomCount");
  await updateCount("academic", "academicCount");
  await updateCount("messages", "messageCount");

  // ✅ Bar Chart: Subjects Per Branch (with Filter)
  async function renderBarChart(filterBranch = "all") {
    const academicSnap = await getDocs(collection(db, "academic"));
    const countsByBranch = {};

    academicSnap.forEach(doc => {
      const branch = doc.data().branch || "Unknown";
      if (filterBranch === "all" || branch === filterBranch) {
        countsByBranch[branch] = (countsByBranch[branch] || 0) + 1;
      }
    });

    const labels = Object.keys(countsByBranch);
    const values = Object.values(countsByBranch);

    new Chart(document.getElementById("chartCanvas"), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Subjects per Branch',
          data: values,
          backgroundColor: '#3399ff'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // 🔄 Filter Change Listener
  document.getElementById("branchFilter").addEventListener("change", (e) => {
    const selected = e.target.value;
    document.getElementById("chartCanvas").remove();
    const newCanvas = document.createElement("canvas");
    newCanvas.id = "chartCanvas";
    document.querySelector(".filters").insertAdjacentElement("afterend", newCanvas);
    renderBarChart(selected);
  });

  await renderBarChart();

  // ✅ Pie Chart: Classrooms by Building
  async function renderPieChart() {
    const classroomSnap = await getDocs(collection(db, "classrooms"));
    const distribution = {};

    classroomSnap.forEach(doc => {
      const building = doc.data().building || "Unknown";
      distribution[building] = (distribution[building] || 0) + 1;
    });

    const labels = Object.keys(distribution);
    const values = Object.values(distribution);

    new Chart(document.getElementById("pieCanvas"), {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Classrooms by Building',
          data: values,
          backgroundColor: ['#3399ff', '#33cc99', '#ffcc00', '#ff6666', '#9966cc']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  await renderPieChart();

  // ✅ Line Chart: Academic Upload Growth Over Time
  async function renderLineChart() {
    const academicSnap = await getDocs(collection(db, "academic"));
    const monthlyCount = {};

    academicSnap.forEach(doc => {
      const ts = doc.data().timestamp?.toDate();
      if (ts) {
        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
        monthlyCount[key] = (monthlyCount[key] || 0) + 1;
      }
    });

    const labels = Object.keys(monthlyCount).sort();
    const values = labels.map(label => monthlyCount[label]);

    new Chart(document.getElementById("lineCanvas"), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Subjects Added Over Time',
          data: values,
          borderColor: '#00aaff',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  await renderLineChart();

  // ✅ Recent Activity Logs with Date
  async function loadActivityLogs() {
    const messagesSnap = await getDocs(collection(db, "messages"));
    const academicSnap = await getDocs(collection(db, "academic"));

    const logs = [];

    messagesSnap.forEach(doc => {
      const data = doc.data();
      const time = data.timestamp?.toDate().toLocaleString() || "Unknown";
      logs.push(`[Contact] ${data.name} - "${(data.message || '').slice(0, 50)}..." (${time})`);
    });

    academicSnap.forEach(doc => {
      const data = doc.data();
      const time = data.timestamp?.toDate().toLocaleString() || "Unknown";
      logs.push(`[Academic] ${data.branch} - ${data.subject} (${time})`);
    });

    const list = document.getElementById("activityLog");
    logs.sort().reverse().slice(0, 10).forEach(entry => {
      const li = document.createElement("li");
      li.textContent = entry;
      list.appendChild(li);
    });
  }

  await loadActivityLogs();

  // ✅ Export Logs to CSV
  document.getElementById("exportLogsBtn").addEventListener("click", () => {
    const rows = [["Type", "Description"]];
    const listItems = document.querySelectorAll("#activityLog li");
    listItems.forEach(li => {
      const [type, ...rest] = li.textContent.split("]");
      rows.push([type.replace("[", ""), rest.join("]").trim()]);
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "snaplocate_activity_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
