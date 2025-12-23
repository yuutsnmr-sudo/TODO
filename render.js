import { state } from "./state.js";
import {
  getTasksForCurrentView,
  priorityOrder,
  toggleTaskCompletion,
  updateAllCounts,
} from "./tasks.js";
import { openDeleteModal } from "./modals.js";
import { showTaskDetail, closeDetailPanel } from "./detailPanel.js";
import { escapeHtml, formatDate, startOfToday } from "./utils.js";

export function initRenderEvents() {
  document.getElementById("searchInput")?.addEventListener("input", renderTasks);
  document.getElementById("sortSelect")?.addEventListener("change", renderTasks);
}

export function renderTasks() {
  const tasksList = document.getElementById("tasksList");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");

  if (!tasksList || !emptyState || !searchInput || !sortSelect) return;

  const searchTerm = searchInput.value.toLowerCase();
  const sortBy = sortSelect.value;

  let filtered = getTasksForCurrentView();

  if (searchTerm) {
    filtered = filtered.filter((t) => {
      const inTitle = (t.title || "").toLowerCase().includes(searchTerm);
      const inNotes = (t.notes || "").toLowerCase().includes(searchTerm);
      const inTags = (t.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchTerm)
      );
      const inCategory = (t.category || "").toLowerCase().includes(searchTerm);
      const inWaiting = (t.waitingFor || "").toLowerCase().includes(searchTerm);
      return inTitle || inNotes || inTags || inCategory || inWaiting;
    });
  }

  filtered = sortTasks(filtered, sortBy);

  if (filtered.length === 0) {
    tasksList.innerHTML = "";
    emptyState.style.display = "flex";
    updateAllCounts();
    return;
  }

  emptyState.style.display = "none";
  tasksList.innerHTML = filtered.map(createTaskCardHTML).join("");

  filtered.forEach((task) => {
    const card = document.getElementById(`task-${task.id}`);
    if (!card) return;

    const checkbox = card.querySelector(".task-checkbox");
    const deleteBtn = card.querySelector(".btn-delete");

    checkbox?.addEventListener("change", (e) => {
      e.stopPropagation();
      toggleTaskCompletion(task.id);
      renderTasks();
    });

    deleteBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteModal(task.id);
    });

    card.addEventListener("click", (e) => {
      if (e.target.closest(".task-checkbox") || e.target.closest(".btn-delete")) return;

      if (state.currentDetailTaskId === task.id) {
        closeDetailPanel();
        return;
      }
      showTaskDetail(task.id);
    });
  });

  updateAllCounts();
}

function sortTasks(tasksToSort, sortBy) {
  return [...tasksToSort].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);

      case "priority":
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);

      case "created":
        return (b.createdAt || 0) - (a.createdAt || 0);

      case "category":
        return (a.category || "").localeCompare(b.category || "");

      default: {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && b.dueDate) {
          const dateComp = new Date(a.dueDate) - new Date(b.dueDate);
          if (dateComp !== 0) return dateComp;
        }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
    }
  });
}

export function createTaskCardHTML(task) {
  const dueDateText = task.dueDate ? formatDate(task.dueDate) : "";

  // ✅ Overdue uniquement si la date est strictement avant aujourd’hui
  const today = startOfToday();
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < today;

  const status = task.status || "todo";
  const showStatusBadge = !task.completed && (status === "in_progress" || status === "waiting");

  const completedSubtasks = (task.subtasks || []).filter((st) => st.completed).length;
  const totalSubtasks = (task.subtasks || []).length;

  // ✅ Classe supplémentaire pour le CSS : in-progress / waiting
  const statusClass =
    status === "in_progress" ? "in-progress" : status === "waiting" ? "waiting" : "";

  return `
    <div class="task-card ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}" id="task-${task.id}">
      <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>

      <div class="task-card-content">
        <div class="task-card-title">${escapeHtml(task.title)}</div>

        <div class="task-card-meta">
          <span class="badge priority priority-${escapeHtml(task.priority)}">
            ${escapeHtml(task.priority)}
          </span>

          ${
            showStatusBadge
              ? `<span class="badge badge-status ${statusClass}">${
                  status === "in_progress" ? "In progress" : "Waiting"
                }</span>`
              : ""
          }

          ${
            status === "waiting" && task.waitingFor
              ? `<span class="task-card-due">Waiting: ${escapeHtml(task.waitingFor)}</span>`
              : ""
          }

          <span class="badge">${escapeHtml(task.category)}</span>

          ${(task.tags || [])
            .map((tag) => `<span class="badge badge-tag">${escapeHtml(tag)}</span>`)
            .join("")}

          ${dueDateText ? `<span class="task-card-due">Due ${dueDateText}</span>` : ""}
          ${
            totalSubtasks > 0
              ? `<span class="task-card-due">${completedSubtasks}/${totalSubtasks} subtasks</span>`
              : ""
          }
          ${task.recurrence ? `<span class="task-card-due">${getRecurrenceLabel(task.recurrence)}</span>` : ""}
        </div>
      </div>

      <div class="task-card-actions">
        <button class="btn-icon-sm btn-delete" title="Delete">🗑️</button>
      </div>
    </div>
  `;
}

function getRecurrenceLabel(recurrence) {
  const labels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
  return labels[recurrence] || "";
}
