const createIconButton = ({ label, text, onClick, className = '' }) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.className = className;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', onClick);
  return button;
};

export const createTaskItem = ({ task, onToggle, onDelete }) => {
  const listItem = document.createElement('li');
  listItem.className = `task-item ${task.completed ? 'done' : ''}`;

  const label = document.createElement('label');
  label.className = 'task-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => onToggle(task));

  const title = document.createElement('span');
  title.textContent = task.title;

  label.append(checkbox, title);

  const deleteButton = createIconButton({
    label: `Delete ${task.title}`,
    text: 'Delete',
    className: 'delete-button',
    onClick: () => onDelete(task),
  });

  listItem.append(label, deleteButton);
  return listItem;
};
