import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Store } from './store.mjs';
import { Providers, KEY_NAMES } from './providers.mjs';
import { AppError, SERVICES, STAGES, text, validateProfile, intelligence } from './domain.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const STATIC = new Map([['/', ['index.html', 'text/html']], ['/app.mjs', ['app.mjs', 'text/javascript']], ['/ui.mjs', ['ui.mjs', 'text/javascript']], ['/style.css', ['style.css', 'text/css']], ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]]);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'";

async function body(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new AppError('Send JSON data.', 415);
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 2e6) throw new AppError('Request is too large.', 413); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new AppError('Invalid JSON data.'); }
}
export function createApp({ store = new Store(join(process.env.SCOUTER_DATA_DIR || join(root, '.data'), 'scouter.sqlite')), providers = new Providers(store) } = {}) {
  const csrf = randomBytes(32).toString('hex');
  let activeProviderCalls = 0;
  const recentCalls = [];
  function respond(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
  async function externalCall(callback) {
    const now = Date.now(); while (recentCalls.length && recentCalls[0] < now - 60000) recentCalls.shift();
    if (activeProviderCalls >= 4 || recentCalls.length >= 30) throw new AppError('Too many provider requests. Wait a moment and try again.', 429, 'rate_limit');
    recentCalls.push(now); activeProviderCalls++;
    try { return await callback(); } finally { activeProviderCalls--; }
  }
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', CSP); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    try {
      // Loopback-only with Host validation to reject DNS rebinding; all API access
      // after bootstrap also requires the per-process token and same-origin checks.
      const host = req.headers.host || '';
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) throw new AppError('Access this workspace through localhost.', 403);
      const url = new URL(req.url, `http://${host}`), path = url.pathname;
      if (req.headers.origin && req.headers.origin !== `http://${host}`) throw new AppError('Cross-origin access is not allowed.', 403);
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('Cross-site access is not allowed.', 403);
      if (req.method === 'GET' && path === '/api/bootstrap') {
        return respond(res, 200, { csrf, profile: store.profile(), integrations: providers.status(), model: store.setting('model', '') || process.env.OPENAI_MODEL || 'gpt-5-mini', services: SERVICES, stages: STAGES, opportunities: store.list() });
      }
      if (path.startsWith('/api/')) {
        const token = String(req.headers['x-scouter-token'] || '');
        if (Buffer.byteLength(token) !== Buffer.byteLength(csrf) || !timingSafeEqual(Buffer.from(token), Buffer.from(csrf))) throw new AppError('Reload Scouter to reconnect to the workspace.', 403, 'session_expired');
        if (req.method === 'GET' && path === '/api/opportunities') return respond(res, 200, store.list());
        if (req.method === 'GET' && path === '/api/export') return respond(res, 200, store.export());
        if (req.method === 'POST' && path === '/api/opportunities') return respond(res, 201, store.save(await body(req)));
        const opportunityRoute = path.match(/^\/api\/opportunities\/([a-f\d-]{36})$/i);
        if (opportunityRoute && req.method === 'PUT') return respond(res, 200, store.save(await body(req), opportunityRoute[1]));
        if (opportunityRoute && req.method === 'DELETE') { store.remove(opportunityRoute[1]); return respond(res, 200, { deleted: true }); }
        if (req.method === 'PUT' && path === '/api/profile') { const profile = validateProfile(await body(req)); if (profile.currency !== store.profile().currency && store.list().some(o => o.payment || o.budget || o.expenses.length || o.quote.lines.length)) throw new AppError('Keep the current currency while monetary records exist. Changing currency does not convert amounts.'); store.set('profile', profile); return respond(res, 200, profile); }
        if (req.method === 'PUT' && path === '/api/integrations') {
          const input = await body(req);
          if (input.keys != null && (typeof input.keys !== 'object' || Array.isArray(input.keys))) throw new AppError('Invalid credentials.');
          const updates = Object.entries(input.keys || {}).map(([name, value]) => { if (!Object.hasOwn(KEY_NAMES, name)) throw new AppError('Unknown integration.'); return [name, text(value, 500)]; });
          const model = input.model == null ? null : text(input.model, 100);
          if (model && !/^[a-zA-Z0-9._:-]+$/.test(model)) throw new AppError('Enter a valid model identifier.');
          updates.forEach(([name, value]) => store.set(`key:${name}`, value));
          if (model) store.set('model', model);
          return respond(res, 200, { integrations: providers.status(), model: store.setting('model', '') || process.env.OPENAI_MODEL || 'gpt-5-mini' });
        }
        if (req.method === 'POST' && path === '/api/import') return respond(res, 200, store.restore(await body(req)));
        if (req.method === 'POST' && path === '/api/search') {
          const input = await body(req);
          if (!['google', 'youtube'].includes(input.source)) throw new AppError('Choose Google businesses or YouTube creators.');
          const result = await externalCall(() => input.source === 'google' ? providers.googleSearch(input) : providers.youtubeSearch(input));
          result.targets = result.targets.map(target => ({ ...target, intelligence: intelligence(target, input.serviceId) }));
          return respond(res, 200, result);
        }
        if (req.method === 'POST' && path === '/api/target') {
          const input = await body(req);
          if (!['google', 'youtube'].includes(input.source)) throw new AppError('Unknown provider.');
          const target = await externalCall(() => input.source === 'google' ? providers.googleDetails(text(input.externalId, 200)) : providers.youtubeDetails(text(input.externalId, 200)));
          return respond(res, 200, { ...target, intelligence: intelligence(target, input.serviceId) });
        }
        if (req.method === 'POST' && path === '/api/audit') { const input = await body(req); return respond(res, 200, await externalCall(() => providers.pageSpeed(input))); }
        if (req.method === 'POST' && path === '/api/outreach') {
          const input = await body(req);
          return respond(res, 200, await externalCall(() => providers.outreach(input, store.profile())));
        }
        throw new AppError('API route not found.', 404);
      }
      if (req.method !== 'GET' || !STATIC.has(path)) throw new AppError('Page not found.', 404);
      const [name, type] = STATIC.get(path);
      const file = await readFile(join(root, 'public', name));
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-cache' }); res.end(file);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      const known = error instanceof AppError;
      if (!known) console.error('Scouter internal error:', error.name);
      respond(res, known ? error.status : 500, { error: known ? error.message : 'Something went wrong. Your saved work is safe; try again.', code: known ? error.code : 'internal_error' });
    }
  });
  return { server, store };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { server, store } = createApp();
  const port = Number(process.env.PORT || 4317);
  server.listen(port, '127.0.0.1', () => console.log(`Scouter is running at http://127.0.0.1:${port}`));
  const stop = () => server.close(() => { store.close(); process.exit(0); });
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
