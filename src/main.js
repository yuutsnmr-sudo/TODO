const debug = (...args) => console.log("[APP]", ...args);
debug("Main script loaded");
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
  const modal = $("authModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
    debug("Showing auth modal");
  }

  const appRoot = $("appRoot");
  if (appRoot) {
    appRoot.style.display = "none";
    debug("Hiding app root while unauthenticated");
  }

  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.style.display = "none";
}

function showApp() {
  const modal = $("authModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
    debug("Hiding auth modal after login");
  }

  const appRoot = $("appRoot");
  if (appRoot) {
    appRoot.style.display = "grid";
    debug("Showing app root for authenticated user");
  }

  const logoutBtn = $("logoutBtn");
  if (logoutBtn) logoutBtn.style.display = "inline-flex";

  $("authForm")?.reset();
  authMode = "signin";
  updateAuthModeUI();
  setAuthError("");
}

let authMode = "signin";

function updateAuthModeUI() {
  const isSignup = authMode === "signup";
  const authTitle = $("authTitle");
  const submitBtn = $("authSubmitBtn");
  const toggleBtn = $("authToggleModeBtn");

  if (authTitle) authTitle.textContent = isSignup ? "Create account" : "Sign in";
  if (submitBtn) submitBtn.textContent = isSignup ? "Create account" : "Sign in";
  if (toggleBtn) toggleBtn.textContent = isSignup ? "Back to sign in" : "Create account";
}

// ============================
// App init (only once, after login)
// ============================
let appInitialized = false;

function initAppOnce() {
  if (appInitialized) return;
  appInitialized = true;
  debug("Initializing app (first time)");

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
  updateAuthModeUI();
  debug("Auth events initialized");

  $("authToggleModeBtn")?.addEventListener("click", () => {
    authMode = authMode === "signin" ? "signup" : "signin";
    updateAuthModeUI();
    setAuthError("");
    debug("Toggled auth mode", authMode);
  });

  $("authForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    setAuthError("");
    const email = ($("authEmail")?.value || "").trim();
    const password = $("authPassword")?.value || "";

    if (!email || !password) {
      setAuthError("Please enter email + password.");
      return;
    }

    if (authMode === "signup" && password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    try {
      if (authMode === "signin") {
        debug("Attempting sign in", email);
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        debug("Attempting sign up", email);
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Account created", "success");
      }
    } catch (e) {
      setAuthError(
        e?.message || (authMode === "signin" ? "Login failed." : "Signup failed.")
      );
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

  // Keep auth modal open on backdrop clicks
  $("authModal")?.addEventListener("click", (e) => {
    if (e.target?.id === "authModal") {
      setAuthError("");
      showAuthGate();
    }
  });
}

// ============================
// Bootstrap
// ============================
document.addEventListener("DOMContentLoaded", () => {
  initAuthEvents();
  debug("DOM ready, waiting for auth state");

  onAuthStateChanged(auth, (user) => {
    debug("Auth state changed", user ? "authenticated" : "unauthenticated");
    if (!user) {
      showAuthGate();
      return;
    }

    showApp();
    initAppOnce();
  });
});
