import { watchAuth, login, signup } from "./authService.js";

function showAuthUI() {
  const authPanel = document.getElementById("authPanel");
  const appRoot = document.getElementById("appRoot");
  if (authPanel) authPanel.style.display = "flex";
  if (appRoot) appRoot.style.display = "none";
}

function showAppUI() {
  const authPanel = document.getElementById("authPanel");
  const appRoot = document.getElementById("appRoot");
  if (authPanel) authPanel.style.display = "none";
  if (appRoot) appRoot.style.display = "block";
}

function setAuthError(message) {
  const el = document.getElementById("authError");
  if (!el) return;
  if (!message) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.style.display = "block";
  el.textContent = message;
}

export function initAuthUI(onLoggedIn) {
  const btnLogin = document.getElementById("btnLogin");
  const btnSignup = document.getElementById("btnSignup");

  btnLogin?.addEventListener("click", async () => {
    setAuthError("");
    const email = document.getElementById("authEmail")?.value?.trim() || "";
    const pass = document.getElementById("authPassword")?.value || "";
    try {
      await login(email, pass);
    } catch (e) {
      setAuthError(e?.message || "Login failed");
    }
  });

  btnSignup?.addEventListener("click", async () => {
    setAuthError("");
    const email = document.getElementById("authEmail")?.value?.trim() || "";
    const pass = document.getElementById("authPassword")?.value || "";
    try {
      await signup(email, pass);
    } catch (e) {
      setAuthError(e?.message || "Signup failed");
    }
  });

  watchAuth(async (user) => {
    if (!user) {
      showAuthUI();
      return;
    }
    showAppUI();
    if (typeof onLoggedIn === "function") {
      await onLoggedIn(user);
    }
  });
}