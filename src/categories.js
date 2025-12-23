import { state } from "./state.js";
import { saveToLocalStorage } from "./storage.js";
import { renderTasks } from "./render.js";
import { updateAllCounts } from "./tasks.js";
import { escapeHtml } from "./utils.js";
import { switchView, updateTitle } from "./views.js";

const CATEGORIES_COLLAPSED_KEY = "categories_collapsed_v2";
const FALLBACK_CATEGORY = "Uncategorized";

export function initCategories() {
  loadCategoriesCollapsed();
  ensureAtLeastOneCategory();
  reconcileTasksCategories();

  document.getElementById("toggleCategories")?.addEventListener("click", (e) => {
    if (e.target.closest("#addCategoryBtn")) return;
    toggleCategoriesCollapsed();
  });

  document.getElementById("addCategoryBtn")?.addEventListener("click", () => {
    openCategoryModal();
  });

  document.getElementById("saveCategoryBtn")?.addEventListener("click", handleCreateCategory);
  document.getElementById("cancelCategoryBtn")?.addEventListener("click", closeCategoryModal);
  document.getElementById("closeCategoryModalBtn")?.addEventListener("click", closeCategoryModal);

  document.getElementById("categoryModal")?.addEventListener("click", (e) => {
    if (e.target.id === "categoryModal") closeCategoryModal();
  });

  renderCategories();
}

export function renderCategories() {
  const listEl = document.getElementById("categoriesList");
  const wrapper = document.getElementById("categoriesWrapper");
  if (!listEl || !wrapper) return;

  wrapper.style.display = state.categoriesCollapsed ? "none" : "block";

  const counts = computeCategoryCounts();

  // ✅ IMPORTANT : pas de "All" dans CATEGORIES
  listEl.innerHTML = state.categories
    .map((cat) => {
      const safe = escapeHtml(cat);
      const isActive = state.selectedCategory === cat; // selected/active identique aux views
      const canDelete = state.categories.length > 1;

      return `
        <button
          class="view-btn category-btn ${isActive ? "active" : ""}"
          type="button"
          data-category="${safe}"
          title="${safe}"
        >
          <span class="category-label">${safe}</span>

          <!-- compteur identique à views -->
          <span class="count">${counts[cat] || 0}</span>

          <!-- poubelle: swap au hover via ton CSS (ne doit pas décaler le compteur) -->
          <span
            class="btn-icon-sm category-delete"
            role="button"
            title="Delete category"
            aria-label="Delete category"
            data-delete="1"
            ${canDelete ? "" : "aria-disabled='true'"}
          >🗑️</span>
        </button>
      `;
    })
    .join("");

  // Events: select / toggle + delete
  listEl.querySelectorAll(".category-btn").forEach((btn) => {
    const cat = btn.dataset.category;

    btn.addEventListener("click", (e) => {
      if (e.target?.dataset?.delete === "1") return;
      toggleCategory(cat);
    });

    btn.querySelector(".category-delete")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (state.categories.length <= 1) return;
      handleDeleteCategory(cat);
    });
  });

  refreshCategorySelectOptions();
}

/**
 * ✅ Règles:
 * - Click catégorie non sélectionnée => sélectionne (filtre), reset view = All
 * - Reclick même catégorie => désélectionne, reset view = All, plus aucune catégorie sélectionnée
 * - Une seule catégorie à la fois
 */
function toggleCategory(categoryName) {
  const isSame = state.selectedCategory === categoryName;

  // On revient fonctionnellement sur la view "All" dans tous les cas (selon ton spec)
  state.selectedCategory = isSame ? null : categoryName;

  // reset view = all (et met le bouton VIEWS All en actif)
  switchView("all");

  // refresh UI
  renderCategories();
  updateTitle();     // si tu affiches un suffixe "• Catégorie"
  renderTasks();
  updateAllCounts();
}

/* ---------------------------
   Create / Delete category
--------------------------- */
function handleCreateCategory() {
  const input = document.getElementById("newCategoryInput");
  const name = (input?.value || "").trim();
  if (!name) return;

  const exists = state.categories.some((c) => c.toLowerCase() === name.toLowerCase());
  if (exists) {
    window.alert("This category already exists.");
    return;
  }

  state.categories.push(name);
  saveToLocalStorage();

  if (input) input.value = "";
  closeCategoryModal();

  renderCategories();
  renderTasks();
  updateAllCounts();
}

function handleDeleteCategory(categoryName) {
  if (state.categories.length <= 1) return;

  const usedCount = state.tasks.filter((t) => (t.category || "") === categoryName).length;
  const msg =
    usedCount > 0
      ? `Delete category "${categoryName}"?\n\n${usedCount} task(s) will be moved to "${FALLBACK_CATEGORY}".`
      : `Delete category "${categoryName}"?`;

  if (!window.confirm(msg)) return;

  state.categories = state.categories.filter((c) => c !== categoryName);

  if (usedCount > 0) {
    ensureFallbackCategoryExists();
    state.tasks.forEach((t) => {
      if ((t.category || "") === categoryName) {
        t.category = FALLBACK_CATEGORY;
        t.modifiedAt = Date.now();
      }
    });
  }

  // si la catégorie supprimée était sélectionnée => désélection
  if (state.selectedCategory === categoryName) {
    state.selectedCategory = null;
    switchView("all");
  }

  saveToLocalStorage();
  renderCategories();
  updateTitle();
  renderTasks();
  updateAllCounts();
}

/* ---------------------------
   Modal
--------------------------- */
function openCategoryModal() {
  document.getElementById("categoryModal")?.classList.add("active");
  document.getElementById("newCategoryInput")?.focus();
}

function closeCategoryModal() {
  document.getElementById("categoryModal")?.classList.remove("active");
}

/* ---------------------------
   Collapse
--------------------------- */
function toggleCategoriesCollapsed() {
  state.categoriesCollapsed = !state.categoriesCollapsed;
  localStorage.setItem(CATEGORIES_COLLAPSED_KEY, JSON.stringify(state.categoriesCollapsed));
  renderCategories();
}

function loadCategoriesCollapsed() {
  try {
    const raw = localStorage.getItem(CATEGORIES_COLLAPSED_KEY);
    state.categoriesCollapsed = raw ? JSON.parse(raw) : false;
  } catch {
    state.categoriesCollapsed = false;
  }
}

/* ---------------------------
   Integrity + counts
--------------------------- */
function ensureAtLeastOneCategory() {
  if (!Array.isArray(state.categories) || state.categories.length === 0) {
    state.categories = [FALLBACK_CATEGORY];
    saveToLocalStorage();
  }
}

function ensureFallbackCategoryExists() {
  if (!state.categories.includes(FALLBACK_CATEGORY)) {
    state.categories.push(FALLBACK_CATEGORY);
  }
}

function reconcileTasksCategories() {
  ensureFallbackCategoryExists();
  let touched = false;

  state.tasks.forEach((t) => {
    if (!t.category || !state.categories.includes(t.category)) {
      t.category = FALLBACK_CATEGORY;
      t.modifiedAt = Date.now();
      touched = true;
    }
  });

  if (touched) saveToLocalStorage();
}

function computeCategoryCounts() {
  // Compteur "open tasks" par catégorie (cohérent avec All)
  const map = {};
  state.categories.forEach((c) => (map[c] = 0));
  state.tasks.forEach((t) => {
    if (t.completed) return;
    const c = t.category || FALLBACK_CATEGORY;
    map[c] = (map[c] || 0) + 1;
  });
  return map;
}

function refreshCategorySelectOptions() {
  const createSelect = document.getElementById("taskCategory");
  if (!createSelect) return;

  const current = createSelect.value;

  createSelect.innerHTML =
    `<option value="">Select…</option>` +
    state.categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  if (current && state.categories.includes(current)) createSelect.value = current;
}