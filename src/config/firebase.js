// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIsC7_7QlWMukgNlrfSqyQJtdwo4jfxEg",
  authDomain: "motorpass-456a0.firebaseapp.com",
  projectId: "motorpass-456a0",
  storageBucket: "motorpass-456a0.firebasestorage.app",
  messagingSenderId: "4996326897",
  appId: "1:4996326897:web:30a3cb29a597649576d050"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase initialized successfully");

export { db };