// frontend/src/firebaseConfig.js  <-- Should be .js, NOT .jsx

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // We're skipping storage for now, but this line is fine

const firebaseConfig = {
  apiKey: "AIzaSyADlvQoV4sBMLkGQgYSYf5hFP73gDzWCXA",
  authDomain: "pag-ibig-managementsystem.firebaseapp.com",
  projectId: "pag-ibig-managementsystem",
  storageBucket: "pag-ibig-managementsystem.firebasestorage.app", // This will be used later or can be removed if no storage
  messagingSenderId: "577264677482",
  appId: "1:577264677482:web:bcd486534e8fd0f2151013"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const auth = getAuth(app);        // <-- Here is 'auth'
const db = getFirestore(app);     // <-- Here is 'db'
const storage = getStorage(app);  // <-- Here is 'storage'

export { auth, db, storage };      // <-- And here it's being EXPORTED