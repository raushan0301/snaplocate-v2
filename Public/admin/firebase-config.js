// // firebase-config.js
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyDB2bm2KBo6geTRSlVHOhqhUQX-6Mozp1Y",
//   authDomain: "snaplocateproject.firebaseapp.com",
//   projectId: "snaplocateproject",
//   storageBucket: "snaplocateproject.firebasestorage.app",
//   messagingSenderId: "150513277214",
//   appId: "1:150513277214:web:e7fef8e692bd89af65510f",
//   measurementId: "G-5P19DM1V01"
// };

// export const app = initializeApp(firebaseConfig); // ✅ export app
// export const db = getFirestore(app);


// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
   apiKey: "AIzaSyDB2bm2KBo6geTRSlVHOhqhUQX-6Mozp1Y",
  authDomain: "snaplocateproject.firebaseapp.com",
  projectId: "snaplocateproject",
  storageBucket: "snaplocateproject.firebasestorage.app",
  messagingSenderId: "150513277214",
  appId: "1:150513277214:web:e7fef8e692bd89af65510f",
  measurementId: "G-5P19DM1V01"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// OPTIONAL: connect to emulator if using localhost testing
// if (location.hostname === "localhost") {
//   connectAuthEmulator(auth, "http://localhost:9099");
// }

export { app, db, auth };
