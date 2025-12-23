console.log("AUTH MAIN LOADED ✅");
// ============================
// Firebase (no bundler, CDN ESM)
// ============================
// Note: tu peux changer la version si besoin.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ============================
// App modules
// ============================
import { loadFromLocalStorage } from "./storage.js";
import { initDefaultsIfNeeded, updateAllCounts, deleteTask } from "./tasks.js";
import { renderCategories, initCategories } from "./categories.js";
import { initViews } from "./views.js";
import {
  initModalSystem,
  initTaskModalEvents,
  initDeleteModalEvents,
  closeDeleteModal,
} from "./modals.js";
import { initRenderEvents, renderTasks } from "./render.js";
import { initDetailPanelEvents, closeDetailPanel } from "./detailPanel.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";

// ============================
// Firebase config (ton projet)
// ============================
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
const auth = getAuth(app);

// ============================
// Auth UI helpers
// ============================
function $(id) {
  return document.getElementById(id);
}

function setAuthError(message) {
  const el = $("authError");
  if (!el) return;
  if (!message) {
    el.style.display = "none";
    el.textContent = "";
  } else {
    el.style.display = "block";
    el.textContent = message;
  }
}

function showAuthGate() {
  $("authGate") && ($("authGate").style.display = "flex");
  $("appRoot") && ($("appRoot").style.display = "none");
  $("logoutBtn") && ($("logoutBtn").style.display = "none");
}

function showApp() {
  $("authGate") && ($("authGate").style.display = "none");
  $("appRoot") && ($("appRoot").style.display = "flex");
  $("logoutBtn") && ($("logoutBtn").style.display = "inline-flex");
}

// ============================
// App init (only once, after login)
// ============================
let appInitialized = false;

function initAppOnce() {
  if (appInitialized) return;
  appInitialized = true;

  // Data init
  loadFromLocalStorage();
  initDefaultsIfNeeded();

  // UI init
  initModalSystem();
  initViews();
  initRenderEvents();
  initTaskModalEvents();
  initCategories();
  initDetailPanelEvents();

  // Delete modal confirm handler
  initDeleteModalEvents(() => {
    if (!state.taskToDelete) return;

    deleteTask(state.taskToDelete);

    closeDeleteModal();
    closeDetailPanel();
    renderCategories();
    updateAllCounts();
    renderTasks();
  });

  // First paint
  renderCategories();
  updateAllCounts();
  renderTasks();

  showToast("Connected", "info");
}

// ============================
// Wire auth events
// ============================
function initAuthEvents() {
  $("authCloseBtn")?.addEventListener("click", () => {
    // Si tu veux empêcher de fermer sans login : commente la ligne suivante
    showAuthGate();
  });

  $("authLoginBtn")?.addEventListener("click", async () => {
    setAuthError("");
    const email = ($("authEmail")?.value || "").trim();
    const password = $("authPassword")?.value || "";

    if (!email || !password) {
      setAuthError("Please enter email + password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setAuthError(e?.message || "Login failed.");
    }
  });

  $("authSignupBtn")?.addEventListener("click", async () => {
    setAuthError("");
    const email = ($("authEmail")?.value || "").trim();
    const password = $("authPassword")?.value || "";

    if (!email || !password) {
      setAuthError("Please enter email + password.");
      return;
    }

    // (optionnel) minimum password
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showToast("Account created", "success");
    } catch (e) {
      setAuthError(e?.message || "Signup failed.");
    }
  });

  $("logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      showToast("Logged out", "info");
    } catch (e) {
      showToast("Logout failed", "error");
    }
  });

  // Close auth modal when clicking outside card
  $("authGate")?.addEventListener("click", (e) => {
    if (e.target?.id === "authGate") {
      // on ne ferme pas vraiment, on laisse visible
      showAuthGate();
    }
  });
}

// ============================
// Bootstrap
// ============================
document.addEventListener("DOMContentLoaded", () => {
  initAuthEvents();

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      showAuthGate();
      return;
    }

    showApp();
    initAppOnce();
  });
});