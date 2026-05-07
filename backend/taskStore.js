const createTask = (title) => ({
  id: crypto.randomUUID(),
  title,
  completed: false,
  createdAt: new Date().toISOString(),
});

export const createTaskStore = (initialTasks = []) => {
  const tasks = [...initialTasks];

  return {
    list() {
      return [...tasks];
    },
    add(title) {
      const task = createTask(title);
      tasks.unshift(task);
      return task;
    },
    update(id, updates) {
      const task = tasks.find((currentTask) => currentTask.id === id);
      if (!task) return null;

      if (typeof updates.completed === 'boolean') {
        task.completed = updates.completed;
      }

      if (typeof updates.title === 'string' && updates.title.trim()) {
        task.title = updates.title.trim();
      }

      return task;
    },
    remove(id) {
      const index = tasks.findIndex((task) => task.id === id);
      if (index < 0) return false;
      tasks.splice(index, 1);
      return true;
    },
  };
};
