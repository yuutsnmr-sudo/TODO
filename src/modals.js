import { state } from "./state.js";
import { saveToLocalStorage } from "./storage.js";
import { generateId, renderLinksPreview } from "./utils.js";
import { showToast } from "./toast.js";
import { renderTasks } from "./render.js";
import { renderCategories } from "./categories.js";
import { updateAllCounts } from "./tasks.js";

export function initModalSystem() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  });
}

export function initTaskModalEvents() {
  document.getElementById("newTaskBtn")?.addEventListener("click", openTaskModal);
  document.getElementById("emptyCreateBtn")?.addEventListener("click", openTaskModal);

  document.getElementById("taskForm")?.addEventListener("submit", handleTaskSubmit);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeTaskModal);
  document.getElementById("cancelModalBtn")?.addEventListener("click", closeTaskModal);

  document.getElementById("addSubtaskBtn")?.addEventListener("click", addSubtaskInput);

  document.getElementById("taskStatus")?.addEventListener("change", syncTaskModalWaitingUI);

  // Links preview binding
  const linksInput = document.getElementById("taskLinks");
  const linksPreview = document.getElementById("taskLinksPreview");
  linksInput?.addEventListener("input", () => renderLinksPreview(linksInput, linksPreview));
}

function openTaskModal() {
  state.editingTaskId = null;

  document.getElementById("modalTitle").textContent = "New task";
  document.getElementById("submitBtnText").textContent = "Create";

  document.getElementById("taskForm").reset();
  document.getElementById("taskPriority").value = "Medium";

  const statusEl = document.getElementById("taskStatus");
  if (statusEl) statusEl.value = "todo";

  const waitingEl = document.getElementById("taskWaitingFor");
  if (waitingEl) waitingEl.value = "";

  document.getElementById("subtasksList").innerHTML = "";

  syncTaskModalWaitingUI();

  // Ensure preview is in sync on open
  const linksInput = document.getElementById("taskLinks");
  const linksPreview = document.getElementById("taskLinksPreview");
  renderLinksPreview(linksInput, linksPreview);

  document.getElementById("taskModal").classList.add("active");
}

function closeTaskModal() {
  document.getElementById("taskModal")?.classList.remove("active");
  state.editingTaskId = null;
}

function syncTaskModalWaitingUI() {
  const statusEl = document.getElementById("taskStatus");
  const waitingWrap = document.getElementById("taskWaitingWrap");
  const waitingInput = document.getElementById("taskWaitingFor");

  if (!statusEl || !waitingWrap || !waitingInput) return;

  const isWaiting = statusEl.value === "waiting";
  waitingWrap.style.display = isWaiting ? "block" : "none";

  if (!isWaiting) {
    waitingInput.value = "";
  }
}

function handleTaskSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const category = document.getElementById("taskCategory").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const recurrence = document.getElementById("taskRecurrence").value;

  const status = (document.getElementById("taskStatus")?.value || "todo").trim();
  const waitingFor =
    status === "waiting" ? (document.getElementById("taskWaitingFor")?.value || "").trim() : "";

  const tags = document
    .getElementById("taskTags")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const notes = document.getElementById("taskNotes").value.trim();

  const links = document
    .getElementById("taskLinks")
    .value.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const subtasks = Array.from(document.querySelectorAll(".subtask-input-row input"))
    .map((input) => ({
      id: generateId(),
      text: input.value.trim(),
      completed: false,
    }))
    .filter((st) => st.text);

  if (!title || !category) {
    showToast("Title and category are required", "error");
    return;
  }

  state.tasks.push({
    id: generateId(),
    title,
    priority,
    category,
    dueDate,
    recurrence,
    tags,
    notes,
    links,
    subtasks,
    completed: false,
    status,
    waitingFor: status === "waiting" ? waitingFor : "",
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  });

  showToast("Task created", "success");

  saveToLocalStorage();
  renderCategories();
  updateAllCounts();
  renderTasks();
  closeTaskModal();
}

function addSubtaskInput() {
  const subtasksList = document.getElementById("subtasksList");
  if (!subtasksList) return;

  const row = document.createElement("div");
  row.className = "subtask-input-row";
  row.innerHTML = `
    <input type="text" placeholder="Subtask…">
    <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()">✕</button>
  `;
  subtasksList.appendChild(row);
}

export function initDeleteModalEvents(confirmDeleteHandler) {
  document.getElementById("confirmDeleteBtn")?.addEventListener("click", confirmDeleteHandler);
  document.getElementById("cancelDeleteBtn")?.addEventListener("click", closeDeleteModal);
  document.getElementById("closeDeleteModalBtn")?.addEventListener("click", closeDeleteModal);
}

export function openDeleteModal(taskId) {
  state.taskToDelete = taskId;
  document.getElementById("deleteModal")?.classList.add("active");
}

export function closeDeleteModal() {
  document.getElementById("deleteModal")?.classList.remove("active");
  state.taskToDelete = null;
}
