import { state } from "./state.js";

const TASKS_KEY = "tasks";
const CATEGORIES_KEY = "categories";

export function loadFromLocalStorage() {
  state.tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  state.categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || "[]");
}

export function saveToLocalStorage() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks));
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(state.categories));
}
