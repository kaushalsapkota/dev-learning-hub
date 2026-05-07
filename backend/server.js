import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTaskStore } from './taskStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const publicDir = resolve(__dirname, '../public');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'Content-Type': mimeTypes['.json'] });
  response.end(JSON.stringify(payload));
};

const readJsonBody = async (request) => {
  let rawBody = '';
  for await (const chunk of request) {
    rawBody += chunk;
  }

  if (!rawBody) return {};
  return JSON.parse(rawBody);
};

const serveStaticFile = async (requestPath, response) => {
  const safePath = normalize(requestPath === '/' ? '/index.html' : requestPath);
  const filePath = resolve(join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { error: 'Access denied.' });
    return;
  }

  try {
    const file = await readFile(filePath);
    const extension = extname(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] ?? 'text/plain; charset=utf-8',
    });
    response.end(file);
  } catch {
    sendJson(response, 404, { error: 'File not found.' });
  }
};

export const createServer = ({ taskStore = createTaskStore() } = {}) =>
  createHttpServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && requestUrl.pathname === '/api/tasks') {
      sendJson(response, 200, { tasks: taskStore.list() });
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/tasks') {
      try {
        const { title } = await readJsonBody(request);
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';

        if (!trimmedTitle) {
          sendJson(response, 400, { error: 'Task title is required.' });
          return;
        }

        sendJson(response, 201, { task: taskStore.add(trimmedTitle) });
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON payload.' });
      }
      return;
    }

    if (request.method === 'PATCH' && requestUrl.pathname.startsWith('/api/tasks/')) {
      try {
        const taskId = requestUrl.pathname.replace('/api/tasks/', '');
        const updates = await readJsonBody(request);
        const updatedTask = taskStore.update(taskId, updates);

        if (!updatedTask) {
          sendJson(response, 404, { error: 'Task not found.' });
          return;
        }

        sendJson(response, 200, { task: updatedTask });
      } catch {
        sendJson(response, 400, { error: 'Invalid JSON payload.' });
      }
      return;
    }

    if (request.method === 'DELETE' && requestUrl.pathname.startsWith('/api/tasks/')) {
      const taskId = requestUrl.pathname.replace('/api/tasks/', '');
      const removed = taskStore.remove(taskId);

      if (!removed) {
        sendJson(response, 404, { error: 'Task not found.' });
        return;
      }

      sendJson(response, 200, { success: true });
      return;
    }

    await serveStaticFile(requestUrl.pathname, response);
  });

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer();

  // Beginner-friendly startup log.
  server.listen(port, () => {
    console.log(`Task manager starter app is running on http://localhost:${port}`);
  });
}
