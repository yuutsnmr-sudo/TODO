import { state } from "./state.js";
import { renderTasks } from "./render.js";
import { updateAllCounts } from "./tasks.js";

export function initViews() {
  document.querySelectorAll(".views-nav .view-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });
}

export function switchView(view) {
  state.currentView = view;

  // ✅ NE PAS reset la catégorie : on combine view + category
  // state.selectedCategory reste inchangée

  document.querySelectorAll(".views-nav .view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  updateTitle();
  renderTasks();
  updateAllCounts();
}

export function updateTitle() {
  const titles = {
    all: "All tasks",
    today: "Today",
    week: "This week",
    overdue: "Overdue",
    nodate: "No date",
    completed: "Completed",
  };

  const base = titles[state.currentView] || "Tasks";
  const suffix = state.selectedCategory ? ` • ${state.selectedCategory}` : "";

  const titleEl = document.getElementById("viewTitle");
  if (titleEl) titleEl.textContent = base + suffix;
}