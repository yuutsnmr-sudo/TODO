import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAi0n-Y6yqjLEgp8A6iqHryb7ByWn6Gq_Y",
  authDomain: "v2todolistwoow.firebaseapp.com",
  projectId: "v2todolistwoow",
  storageBucket: "v2todolistwoow.firebasestorage.app",
  messagingSenderId: "668554568502",
  appId: "1:668554568502:web:d009b34f69aeda215e4997",
  measurementId: "G-JHJ5CJMG14",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);