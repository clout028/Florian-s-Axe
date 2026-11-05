import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runResearch, VENDORS } from './research.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/vendors') {
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify(Object.entries(VENDORS).map(([key, v]) => ({ key, name: v.name, required: key === 'amazon' || key === 'walmart' }))));
  }

  if (url.pathname === '/api/search') {
    const query = (url.searchParams.get('q') || '').trim().slice(0, 300);
    if (!query) { res.statusCode = 400; return res.end('Missing q'); }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    const emit = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      const result = await runResearch({
        query,
        vendors: (url.searchParams.get('vendors') || '').split(',').filter(Boolean),
        priority: url.searchParams.get('priority') || 'balanced',
        taxRate: Math.max(0, Number(url.searchParams.get('tax') || 0)) / 100,
        emit,
      });
      emit('result', result);
    } catch (e) { emit('error', { message: e.message }); }
    return res.end();
  }

  const file = url.pathname === '/' ? 'index.html' : path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(path.join(PUBLIC, file));
    res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.statusCode = 404; res.end('Not found'); }
});

server.listen(PORT, () => console.log(`Smart Shopper on http://localhost:${PORT}${process.env.MOCK === '1' ? ' (MOCK data)' : ''}`));
