const wifiData = [
  {  ssid: "Placement Cell", password: "Cilp@98765" },
  {  ssid: "CSED", password: "csed@123#" },
  {  ssid: "LC", password: "lc@tiet1" },
  {  ssid: "Hostel J", password: "LetMeC@@nnectViaCISH2010@Thapar" },
  {  ssid: "Directorate", password: "dir@tu&98765" },
  {  ssid: "CSED_LAB", password: "hecllab768" },
  {  ssid: "Machine Tool", password: "workshop@54321" },  
  {  ssid: "THights", password: "abcd1234" },
  {  ssid: "TU", password: "tu@inet1"},
  {  ssid: "EACCESS", password: "hostelnet" },
  {  ssid: "Audi", password: "audi@net" },
  {  ssid:  "Venture Lab", password:"vl@tiet1"},

];

const tableBody = document.querySelector("#wifiTable tbody");

wifiData.forEach(({ssid, password }) => {
  const row = document.createElement("tr");
  row.innerHTML = `

    <td>${ssid}</td>
    <td> <span class="wifi-password">${password}</span>
      <button class="copy-btn" title="Copy Password">📋</button></td>
  `;
  tableBody.appendChild(row);
});

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    const password = this.parentElement.querySelector(".wifi-password").textContent.trim();
    navigator.clipboard.writeText(password).then(() => {
      this.textContent = "✅";
      setTimeout(() => (this.textContent = "📋"), 1500);
    }).catch(err => {
      console.error("Failed to copy password:", err);
    });
  });
});
