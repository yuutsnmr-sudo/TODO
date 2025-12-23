import { state } from "./state.js";
import { saveToLocalStorage } from "./storage.js";
import { generateId, isSameDay, startOfToday, addDays } from "./utils.js";
import { showToast } from "./toast.js";

export const priorityOrder = {
  Highest: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Lowest: 1,
};

export const statusLabels = {
  todo: "To do",
  in_progress: "In progress",
  waiting: "Waiting",
};

export function initDefaultsIfNeeded() {
  if (state.categories.length === 0) {
    state.categories = ["Work", "Personal", "Errands", "Health"];
    saveToLocalStorage();
  }

  // Migration légère : si des tâches existent sans status/waitingFor => on les complète
  if (state.tasks.length > 0) {
    let touched = false;
    state.tasks.forEach((t) => {
      if (!t.status) {
        t.status = "todo";
        touched = true;
      }
      if (typeof t.waitingFor !== "string") {
        t.waitingFor = "";
        touched = true;
      }
      if (typeof t.completed !== "boolean") {
        t.completed = false;
        touched = true;
      }
    });
    if (touched) saveToLocalStorage();
    return;
  }

  // Seed si aucune tâche
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  state.tasks = [
    {
      id: generateId(),
      title: "Finalize monthly report",
      priority: "High",
      category: "Work",
      dueDate: tomorrow.toISOString().split("T")[0],
      completed: false,
      status: "in_progress",
      waitingFor: "",
      recurrence: "",
      tags: ["urgent"],
      notes: "Verify numbers before sending.",
      links: [],
      subtasks: [
        { id: generateId(), text: "Collect data", completed: false },
        { id: generateId(), text: "Create charts", completed: false },
      ],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Dentist appointment",
      priority: "Medium",
      category: "Health",
      dueDate: nextWeek.toISOString().split("T")[0],
      completed: false,
      status: "todo",
      waitingFor: "",
      recurrence: "",
      tags: [],
      notes: "",
      links: [],
      subtasks: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
    {
      id: generateId(),
      title: "Buy milk and bread",
      priority: "Low",
      category: "Errands",
      dueDate: "",
      completed: false,
      status: "waiting",
      waitingFor: "Reply from supplier",
      recurrence: "",
      tags: [],
      notes: "",
      links: [],
      subtasks: [],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    },
  ];

  saveToLocalStorage();
}

export function getTasksForCurrentView() {
  const today = startOfToday();
  const weekEnd = addDays(today, 7);

  const matchesView = (task) => {
    switch (state.currentView) {
      case "all":
        return !task.completed;

      case "today":
        return !task.completed && task.dueDate && isSameDay(new Date(task.dueDate), today);

      case "week": {
        if (task.completed || !task.dueDate) return false;
        const due = new Date(task.dueDate);
        return due >= today && due <= weekEnd;
      }

      case "overdue":
        // overdue = strictement avant aujourd’hui (pas aujourd’hui)
        return !task.completed && task.dueDate && new Date(task.dueDate) < today;

      case "nodate":
        return !task.completed && !task.dueDate;

      case "completed":
        return task.completed;

      default:
        return true;
    }
  };

  const matchesCategory = (task) => {
    if (!state.selectedCategory) return true;
    return (task.category || "Uncategorized") === state.selectedCategory;
  };

  return state.tasks.filter((task) => matchesView(task) && matchesCategory(task));
}

export function updateAllCounts() {
  const today = startOfToday();
  const weekEnd = addDays(today, 7);

  const counts = {
    all: state.tasks.filter((t) => !t.completed).length,
    today: state.tasks.filter(
      (t) => !t.completed && t.dueDate && isSameDay(new Date(t.dueDate), today)
    ).length,
    week: state.tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d >= today && d <= weekEnd;
    }).length,
    overdue: state.tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
    ).length,
    nodate: state.tasks.filter((t) => !t.completed && !t.dueDate).length,
    completed: state.tasks.filter((t) => t.completed).length,
  };

  Object.entries(counts).forEach(([key, value]) => {
    const el = document.getElementById(
      `count${key.charAt(0).toUpperCase()}${key.slice(1)}`
    );
    if (el) el.textContent = String(value);
  });
}

export function toggleTaskCompletion(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const nextCompleted = !task.completed;
  task.completed = nextCompleted;
  task.modifiedAt = Date.now();

  // ✅ DONE = checkbox
  if (task.completed) {
    task.status = "todo";
    task.waitingFor = "";
  }

  if (task.completed && task.recurrence && task.dueDate) {
    const nextTask = createRecurringTask(task);
    state.tasks.push(nextTask);
    showToast(`Next task created: ${nextTask.dueDate}`, "info");
  }

  saveToLocalStorage();
}

function createRecurringTask(originalTask) {
  const nextDueDate = new Date(originalTask.dueDate);

  switch (originalTask.recurrence) {
    case "daily":
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case "weekly":
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case "monthly":
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
  }

  return {
    ...originalTask,
    id: generateId(),
    dueDate: nextDueDate.toISOString().split("T")[0],
    completed: false,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  };
}

export function deleteTask(taskId) {
  state.tasks = state.tasks.filter((t) => t.id !== taskId);
  saveToLocalStorage();
  showToast("Task deleted", "success");
}