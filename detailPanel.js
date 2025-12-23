import { state } from "./state.js";
import { saveToLocalStorage } from "./storage.js";
import { renderTasks } from "./render.js";
import { renderCategories } from "./categories.js";
import { updateAllCounts } from "./tasks.js";
import { escapeHtml, generateId, renderLinksPreview } from "./utils.js";
import { openDeleteModal } from "./modals.js";
import { showToast } from "./toast.js";

export function initDetailPanelEvents() {
  document.getElementById("closeDetailBtn")?.addEventListener("click", closeDetailPanel);
}

export function showTaskDetail(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (!task.status) task.status = "todo";
  if (typeof task.waitingFor !== "string") task.waitingFor = "";

  const detailPanel = document.getElementById("detailPanel");
  const detailContent = document.getElementById("detailContent");
  const appLayout = document.querySelector(".app-layout");

  if (!detailPanel || !detailContent || !appLayout) return;

  detailPanel.style.display = "flex";
  appLayout.classList.add("detail-open");

  state.currentDetailTaskId = taskId;

  detailContent.innerHTML = `
    <form id="editTaskForm" class="task-form-modal">
      <input type="hidden" id="editTaskId" value="${task.id}">

      <div class="form-group">
        <label for="editTaskTitle">Title *</label>
        <input type="text" id="editTaskTitle" value="${escapeHtml(task.title)}" required>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="editTaskPriority">Priority *</label>
          <select id="editTaskPriority" required>
            <option value="Lowest" ${task.priority === "Lowest" ? "selected" : ""}>Lowest</option>
            <option value="Low" ${task.priority === "Low" ? "selected" : ""}>Low</option>
            <option value="Medium" ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
            <option value="High" ${task.priority === "High" ? "selected" : ""}>High</option>
            <option value="Highest" ${task.priority === "Highest" ? "selected" : ""}>Highest</option>
          </select>
        </div>

        <div class="form-group">
          <label for="editTaskCategory">Category *</label>
          <select id="editTaskCategory" required>
            ${state.categories
              .map((cat) => `<option value="${escapeHtml(cat)}" ${task.category === cat ? "selected" : ""}>${escapeHtml(cat)}</option>`)
              .join("")}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="editTaskDueDate">Due date</label>
          <input type="date" id="editTaskDueDate" value="${task.dueDate || ""}">
        </div>

        <div class="form-group">
          <label for="editTaskRecurrence">Recurrence</label>
          <select id="editTaskRecurrence">
            <option value="" ${!task.recurrence ? "selected" : ""}>None</option>
            <option value="daily" ${task.recurrence === "daily" ? "selected" : ""}>Daily</option>
            <option value="weekly" ${task.recurrence === "weekly" ? "selected" : ""}>Weekly</option>
            <option value="monthly" ${task.recurrence === "monthly" ? "selected" : ""}>Monthly</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="editTaskStatus">Status</label>
          <select id="editTaskStatus">
            <option value="todo" ${task.status === "todo" ? "selected" : ""}>To do</option>
            <option value="in_progress" ${task.status === "in_progress" ? "selected" : ""}>In progress</option>
            <option value="waiting" ${task.status === "waiting" ? "selected" : ""}>Waiting</option>
          </select>
        </div>

        <div class="form-group" id="editWaitingWrap" style="display:${task.status === "waiting" ? "block" : "none"};">
          <label for="editTaskWaitingFor">Waiting for</label>
          <input type="text" id="editTaskWaitingFor" value="${escapeHtml(task.waitingFor || "")}" placeholder="e.g. MOA feedback / supplier reply">
        </div>
      </div>

      <div class="form-group">
        <label for="editTaskTags">Tags (comma-separated)</label>
        <input type="text" id="editTaskTags" value="${escapeHtml((task.tags || []).join(", "))}">
      </div>

      <div class="form-group">
        <label for="editTaskNotes">Notes</label>
        <textarea id="editTaskNotes" rows="3">${escapeHtml(task.notes || "")}</textarea>
      </div>

      <!-- LINKS (with preview) -->
      <div class="form-group">
        <label for="editTaskLinks">Links (one per line)</label>
        <textarea id="editTaskLinks" rows="2">${escapeHtml((task.links || []).join("\n"))}</textarea>
        <div class="links-preview" id="editTaskLinksPreview"></div>
      </div>

      <div class="form-group">
        <label>Subtasks</label>
        <div id="editSubtasksList" class="subtasks-list">
          ${(task.subtasks || [])
            .map(
              (st) => `
              <div class="subtask-input-row">
                <input type="text" value="${escapeHtml(st.text)}" data-subtask-id="${st.id}" data-completed="${st.completed ? "true" : "false"}">
                <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()">✕</button>
              </div>
            `
            )
            .join("")}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="editAddSubtaskBtn">Add subtask</button>
      </div>

      <div class="detail-actions-group">
        <button type="submit" class="btn btn-primary btn-block">Save changes</button>
        <button type="button" class="btn btn-danger btn-block" id="editDeleteBtn">Delete task</button>
      </div>
    </form>
  `;

  document.getElementById("editTaskForm")?.addEventListener("submit", handleEditTaskSubmit);
  document.getElementById("editAddSubtaskBtn")?.addEventListener("click", addEditSubtaskRow);
  document.getElementById("editDeleteBtn")?.addEventListener("click", () => openDeleteModal(task.id));

  // Status -> show/hide waitingFor
  document.getElementById("editTaskStatus")?.addEventListener("change", () => {
    const status = document.getElementById("editTaskStatus").value;
    const wrap = document.getElementById("editWaitingWrap");
    const input = document.getElementById("editTaskWaitingFor");

    const isWaiting = status === "waiting";
    if (wrap) wrap.style.display = isWaiting ? "block" : "none";
    if (!isWaiting && input) input.value = "";
  });

  // Links preview binding (edit)
  const editLinksInput = document.getElementById("editTaskLinks");
  const editLinksPreview = document.getElementById("editTaskLinksPreview");
  renderLinksPreview(editLinksInput, editLinksPreview);
  editLinksInput?.addEventListener("input", () => renderLinksPreview(editLinksInput, editLinksPreview));
}

function addEditSubtaskRow() {
  const list = document.getElementById("editSubtasksList");
  if (!list) return;

  const row = document.createElement("div");
  row.className = "subtask-input-row";
  row.innerHTML = `
    <input type="text" value="" data-subtask-id="${generateId()}" data-completed="false">
    <button type="button" class="btn-icon-sm" onclick="this.parentElement.remove()">✕</button>
  `;
  list.appendChild(row);
}

function handleEditTaskSubmit(e) {
  e.preventDefault();

  const taskId = document.getElementById("editTaskId")?.value;
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const title = document.getElementById("editTaskTitle").value.trim();
  const priority = document.getElementById("editTaskPriority").value;
  const category = document.getElementById("editTaskCategory").value;
  const dueDate = document.getElementById("editTaskDueDate").value;
  const recurrence = document.getElementById("editTaskRecurrence").value;

  const status = document.getElementById("editTaskStatus").value;
  const waitingFor =
    status === "waiting" ? (document.getElementById("editTaskWaitingFor")?.value || "").trim() : "";

  const tags = document
    .getElementById("editTaskTags")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const notes = document.getElementById("editTaskNotes").value.trim();

  const links = document
    .getElementById("editTaskLinks")
    .value.split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const subtasks = Array.from(document.querySelectorAll("#editSubtasksList .subtask-input-row input"))
    .map((input) => ({
      id: input.dataset.subtaskId || generateId(),
      text: input.value.trim(),
      completed: input.dataset.completed === "true",
    }))
    .filter((st) => st.text);

  if (!title || !category) {
    showToast("Title and category are required", "error");
    return;
  }

  Object.assign(task, {
    title,
    priority,
    category,
    dueDate,
    recurrence,
    tags,
    notes,
    links,
    subtasks,
    status,
    waitingFor: status === "waiting" ? waitingFor : "",
    modifiedAt: Date.now(),
  });

  saveToLocalStorage();
  renderCategories();
  updateAllCounts();
  renderTasks();
  closeDetailPanel();
  showToast("Task updated", "success");
}

export function closeDetailPanel() {
  const detailPanel = document.getElementById("detailPanel");
  const appLayout = document.querySelector(".app-layout");
  if (!detailPanel || !appLayout) return;

  detailPanel.style.display = "none";
  appLayout.classList.remove("detail-open");
  state.currentDetailTaskId = null;
}
