import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../backend/server.js';

const startServer = () => {
  const server = createServer();

  return new Promise((resolve) => {
    server.listen(0, () => {
      const { port } = server.address();
      resolve({
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
        url: `http://127.0.0.1:${port}`,
      });
    });
  });
};

test('task api creates, updates and deletes tasks', async () => {
  const app = await startServer();

  try {
    const createResponse = await fetch(`${app.url}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests' }),
    });

    assert.equal(createResponse.status, 201);
    const createPayload = await createResponse.json();
    assert.equal(createPayload.task.title, 'Write tests');
    assert.equal(createPayload.task.completed, false);

    const updateResponse = await fetch(`${app.url}/api/tasks/${createPayload.task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(updateResponse.status, 200);

    const listResponse = await fetch(`${app.url}/api/tasks`);
    const listPayload = await listResponse.json();
    assert.equal(listPayload.tasks.length, 1);
    assert.equal(listPayload.tasks[0].completed, true);

    const deleteResponse = await fetch(`${app.url}/api/tasks/${createPayload.task.id}`, {
      method: 'DELETE',
    });

    assert.equal(deleteResponse.status, 200);

    const finalListResponse = await fetch(`${app.url}/api/tasks`);
    const finalPayload = await finalListResponse.json();
    assert.equal(finalPayload.tasks.length, 0);
  } finally {
    await app.close();
  }
});
