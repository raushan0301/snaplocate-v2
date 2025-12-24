// ✅ Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {

};

// ✅ Initialize Firebase App + Firestore
const db = getFirestore(app);

// ✅ Form Handling
const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  showStatus("Sending message...", "blue");

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const message = document.getElementById("message")?.value.trim();

  if (!name || !email || !message) {
    showStatus("Please fill in all fields.", "red");
    return;
  }

  try {
    // ✅ Generate a readable + unique doc ID
    const safeName = name.toLowerCase().replace(/\s+/g, "_");
    const uniqueId = `${safeName}_${Date.now()}`; // e.g., "john_doe_1729238123123"

    const docRef = doc(db, "messages", uniqueId);

    // ✅ Write data using setDoc
    await setDoc(docRef, {
      name,
      email,
      message,
      timestamp: serverTimestamp(),
      read: false
    });

    showStatus("Message sent successfully!", "green");
    form.reset();
  } catch (error) {
    console.error("❌ Firestore error:", error);
    showStatus("Failed to send message. Please try again later.", "red");
  }

  setTimeout(() => {
    status.textContent = "";
  }, 5000);
});

// ✅ Utility: Show Status Message
function showStatus(msg, color) {
  status.textContent = msg;
  status.style.color = color;
}

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
