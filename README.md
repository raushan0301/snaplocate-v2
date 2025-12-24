SnapLocate – Campus Navigation & Academic Companion
SnapLocate is a student-focused web application designed to simplify campus life by providing quick access to professor details, classroom locations, academic resources, campus support contacts, and Wi-Fi hotspots — all in one place.
Built with a clean frontend + Firebase backend, SnapLocate focuses on usability, speed, and real-world student needs.
🌐 Live Demo
🔗 Website: https://snaplocate.in 
🚀 Features
🧑‍🏫 Professor Directory
Search professors by name, department, or specialization
View contact details and professional information
Clean card-based UI with search & pagination
🏫 Classroom Finder
Locate classrooms by room number, building, floor, or type
Supports lecture halls, labs, and tutorial rooms
Optimized for quick lookups during class transitions
📚 Academic Resources
Year / Semester / Branch / Subject based filtering
Access:
📄 Notes
🧪 Lab Manuals
📝 PYQs (MST / EST / AUXI)
🎥 Playlists
View count & rating system to highlight useful resources
📞 Campus Support
Categorized contacts (Academics, Finance, IT, Hostel, etc.)
Hostel directory with caretaker & warden details
Copy email feature for quick communication
📶 Campus Wi-Fi Hotspots
List of available campus Wi-Fi networks
One-click password copy (for authorized users)
📊 Analytics (Privacy-Friendly)
Page views
Navigation tracking
Daily visitor tracking using Firebase Analytics
🛠 Tech Stack
Frontend
HTML5
CSS3
JavaScript (ES Modules)
Bootstrap Icons
Backend / Services
Firebase
Firestore (database)
Authentication
Analytics
Hosting
Tools
Git & GitHub
Firebase CLI
VS Code
📂 Project Structure (Simplified)
snaplocate-v2/
│
├── Public/
│   ├── index.html
│   ├── professor.html
│   ├── classroom.html
│   ├── academic.html
│   ├── campus-support.html
│   ├── contact.html
│   ├── about.html
│   ├── *.css
│   ├── *.js
│
├── firebase.json
├── firestore.rules
├── package.json
├── .gitignore
└── README.md
🔐 Security Notes
Firebase API keys are not exposed in this repository
Sensitive configuration files are ignored using .gitignore
Environment-specific values should be added locally
Example placeholder config:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};
👨‍💻 About the Developer
Raushan Raj
🎓 B.Tech Computer Engineering – Thapar Institute of Engineering & Technology
💻 Full-Stack Web Developer
🔐 Interested in Security, Scalable Systems & Real-World Applications
🔗 LinkedIn: https://www.linkedin.com/in/raushan-raj-3a7740243
🤝 Contributions
This project is currently maintained by a solo developer.
Suggestions, feedback, and improvements are welcome via issues or pull requests.
📜 License
This project is open for learning and demonstration purposes.
For reuse or deployment, please provide proper credit.
⭐ If you find SnapLocate useful, consider starring the repository!
