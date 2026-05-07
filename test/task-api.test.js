import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../backend/server.js';

const startServer = () => {
  const server = createServer();

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('error', onError);
      reject(error);
    };

    server.on('error', onError);
    server.listen(0, () => {
      server.off('error', onError);
      const { port } = server.address();
      resolve({
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
        url: `http://127.0.0.1:${port}`,
      });
    });
  });
};

const createTask = async (baseUrl, title = 'Write tests') => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  return payload.task;
};

test('POST /api/tasks creates a task', async () => {
  const app = await startServer();

  try {
    const task = await createTask(app.url, 'Create test task');
    assert.equal(task.title, 'Create test task');
    assert.equal(task.completed, false);
  } finally {
    await app.close();
  }
});

test('PATCH /api/tasks/:id updates completion state', async () => {
  const app = await startServer();

  try {
    const task = await createTask(app.url);
    const updateResponse = await fetch(`${app.url}/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });

    assert.equal(updateResponse.status, 200);

    const listResponse = await fetch(`${app.url}/api/tasks`);
    const listPayload = await listResponse.json();
    assert.equal(listPayload.tasks.length, 1);
    assert.equal(listPayload.tasks[0].completed, true);
  } finally {
    await app.close();
  }
});

test('DELETE /api/tasks/:id removes a task', async () => {
  const app = await startServer();

  try {
    const task = await createTask(app.url);
    const deleteResponse = await fetch(`${app.url}/api/tasks/${task.id}`, {
      method: 'DELETE',
    });

    assert.equal(deleteResponse.status, 200);

    const listResponse = await fetch(`${app.url}/api/tasks`);
    const listPayload = await listResponse.json();
    assert.equal(listPayload.tasks.length, 0);
  } finally {
    await app.close();
  }
});
