export const state = {
    tasks: [],
    categories: [],
  
    currentView: "all",
    currentCategory: null, // réservé si tu veux filtrer par catégorie plus tard
    editingTaskId: null,
    taskToDelete: null,
  
    // Pour le toggle clic tâche => ouvre/ferme le panneau détail
    currentDetailTaskId: null,
  };
  