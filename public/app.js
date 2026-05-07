import { createTaskItem } from './components.js';

const taskListElement = document.querySelector('#task-list');
const taskForm = document.querySelector('#task-form');
const taskTitleInput = document.querySelector('#task-title');
const statusMessage = document.querySelector('#status-message');

const state = {
  tasks: [],
};

const showStatus = (message, isError = false) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
};

const apiRequest = async (url, options) => {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

const renderTasks = () => {
  taskListElement.innerHTML = '';

  if (!state.tasks.length) {
    const emptyState = document.createElement('li');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No tasks yet. Add your first task above.';
    taskListElement.append(emptyState);
    return;
  }

  state.tasks.forEach((task) => {
    taskListElement.append(
      createTaskItem({
        task,
        onToggle: async (currentTask) => {
          try {
            const payload = await apiRequest(`/api/tasks/${currentTask.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: !currentTask.completed }),
            });

            state.tasks = state.tasks.map((taskItem) =>
              taskItem.id === payload.task.id ? payload.task : taskItem,
            );
            renderTasks();
          } catch (error) {
            showStatus(error.message, true);
          }
        },
        onDelete: async (currentTask) => {
          try {
            await apiRequest(`/api/tasks/${currentTask.id}`, { method: 'DELETE' });
            state.tasks = state.tasks.filter((taskItem) => taskItem.id !== currentTask.id);
            renderTasks();
          } catch (error) {
            showStatus(error.message, true);
          }
        },
      }),
    );
  });
};

const loadTasks = async () => {
  try {
    const payload = await apiRequest('/api/tasks');
    state.tasks = payload.tasks;
    renderTasks();
  } catch (error) {
    showStatus(error.message, true);
  }
};

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = taskTitleInput.value.trim();
  if (!title) return;

  try {
    const payload = await apiRequest('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    state.tasks = [payload.task, ...state.tasks];
    taskForm.reset();
    showStatus('Task added successfully.');
    renderTasks();
  } catch (error) {
    showStatus(error.message, true);
  }
});

loadTasks();
