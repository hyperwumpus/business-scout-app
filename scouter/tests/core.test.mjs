import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../server/store.mjs';
import { Providers } from '../server/providers.mjs';
import { createApp } from '../server/main.mjs';
import { intelligence, validateOpportunity, quoteTotal, moneySummary, safeUrl } from '../server/domain.mjs';

test('website score explains every point and preserves unknown data', () => {
  const t = { source: 'google', detailsLoaded: true, rating: 4.8, reviewCount: 120, phone: '555' };
  const result = intelligence(t, 'website');
  assert.equal(result.score, 100); assert.equal(result.reasons.reduce((n, r) => n + r.points, 0), 100);
  assert.equal(intelligence({ ...t, website: 'https://example.com' }, 'website').score, 50);
  const unknown = intelligence({ ...t, rating: null, reviewCount: null }, 'website');
  assert.equal(unknown.score, 60); assert.match(unknown.reasons[1].label, /unknown/);
  assert.equal(intelligence({ ...t, businessStatus: 'CLOSED_PERMANENTLY' }, 'website').score, null);
});
test('non-website services and requests never claim inferred demand', () => {
  assert.equal(intelligence({ source: 'google', detailsLoaded: true }, 'cleaning').score, null);
  assert.match(intelligence({ source: 'request' }, 'assembly').summary, /confirmation/);
  assert.equal(intelligence({ source: 'youtube' }, 'editing').score, null);
});
test('money uses cents, tracks actual income, and requires payment for Paid', () => {
  assert.equal(quoteTotal([{ quantity: 3, rate: 0.1 }, { quantity: 2, rate: 0.2 }]), 0.7);
  assert.throws(() => validateOpportunity({ title: 'Test', stage: 'Paid' }), /payment/);
  const o = validateOpportunity({ title: 'Job', stage: 'Paid', payment: 200, hours: 4, expenses: [{ description: 'Supplies', amount: 30.25 }] });
  assert.deepEqual(moneySummary([o]), { revenue: 200, expenses: 30.25, net: 169.75, hours: 4, hourly: 42.4375 });
});
test('invalid dates, numbers, quote items and URLs are rejected', () => {
  for (const input of [null, { title: 'x', followUp: '2026-02-30' }, { title: 'x', hours: [] }, { title: 'x', quote: { lines: [null] } }, { title: 'x', expenses: [null] }, { title: 'x', website: 'javascript:alert(1)' }]) assert.throws(() => validateOpportunity(input));
  assert.throws(() => safeUrl('http://127.0.0.1:4317', { publicOnly: true }), /public/);
  assert.throws(() => safeUrl('https://user:pass@example.com'));
});
test('provider saves contain IDs and user work, never raw provider data', () => {
  const data = validateOpportunity({ source: 'google', externalId: 'ChIJ_sample', title: 'Provider title', location: 'Provider address', rating: 5, website: 'https://example.com', notes: 'My next action', serviceId: 'photos' });
  assert.equal(data.title, ''); assert.equal(data.website, ''); assert.equal(data.location, ''); assert.equal(data.rating, undefined); assert.equal(data.notes, 'My next action');
});
test('database survives restart, deduplicates provider IDs, and exports without secrets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'scouter-unit-'));
  try {
    const path = join(dir, 'db.sqlite'); let store = new Store(path);
    const a = store.save({ title: 'Real job', serviceId: 'cleaning' });
    store.save({ source: 'google', externalId: 'place_1' });
    assert.throws(() => store.save({ source: 'google', externalId: 'place_1' }), /already saved/);
    store.save({ source: 'google', externalId: 'place_2' });
    store.set('key:openai', 'secret-test-value'); store.close(); store = new Store(path);
    assert.equal(store.get(a.id).title, 'Real job'); assert.equal(store.list().length, 3);
    assert.ok(!JSON.stringify(store.export()).includes('secret-test-value'));
    assert.throws(() => store.save(null), /details/); store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('backup restore is validated atomically and skips existing opportunities', () => {
  const a = new Store(':memory:'), b = new Store(':memory:');
  try {
    a.save({ title: 'One' }); a.save({ title: 'Two' }); const backup = a.export();
    assert.deepEqual(b.restore(backup), { imported: 2, skipped: 0 });
    assert.deepEqual(b.restore(backup), { imported: 0, skipped: 2 });
    assert.throws(() => b.restore({ ...backup, opportunities: [{ title: 'Valid' }, { title: '' }] }));
    assert.equal(b.list().length, 2);
  } finally { a.close(); b.close(); }
});
test('Google Places uses New API field mask and consistent paginated parameters', async () => {
  const store = new Store(':memory:'); store.set('key:google', 'test'); const calls = [];
  const p = new Providers(store, async (url, options) => { calls.push({ url: String(url), options }); return Response.json({ places: [{ id: 'place', displayName: { text: 'Local shop' } }], nextPageToken: 'next' }); });
  try {
    const input = { query: 'cleaners', location: 'Rexburg', serviceId: 'cleaning' };
    const first = await p.googleSearch(input); await p.googleSearch({ ...input, pageToken: first.nextPageToken });
    assert.match(calls[0].url, /places:searchText$/); assert.match(calls[0].options.headers['X-Goog-FieldMask'], /places.websiteUri/);
    const one = JSON.parse(calls[0].options.body), two = JSON.parse(calls[1].options.body); delete two.pageToken; assert.deepEqual(one, two);
    assert.equal(first.targets[0].rating, null);
  } finally { store.close(); }
});
test('YouTube searches channels then retrieves real statistics', async () => {
  const store = new Store(':memory:'); store.set('key:youtube', 'test'); const calls = [];
  const p = new Providers(store, async url => { const u = new URL(url); calls.push(u); return Response.json(u.pathname.endsWith('/search') ? { items: [{ id: { channelId: 'UC_test' } }], nextPageToken: 'n' } : { items: [{ id: 'UC_test', snippet: { title: 'Creator' }, statistics: { hiddenSubscriberCount: true, videoCount: '20' } }] }); });
  try { const result = await p.youtubeSearch({ query: 'gaming', serviceId: 'editing' }); assert.equal(calls[0].searchParams.get('type'), 'channel'); assert.equal(calls[1].searchParams.get('id'), 'UC_test'); assert.equal(result.targets[0].subscriberCount, null); assert.equal(result.targets[0].videoCount, 20); } finally { store.close(); }
});
test('AI uses Responses API without storage and parses output text', async () => {
  const store = new Store(':memory:'); store.set('key:openai', 'test'); let sent;
  const p = new Providers(store, async (url, options) => { sent = { url, body: JSON.parse(options.body) }; return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Draft based on the brief.' }] }] }); });
  try { const result = await p.outreach({ mode: 'ai', title: 'Client', offer: 'Editing' }, store.profile()); assert.match(sent.url, /v1\/responses$/); assert.equal(sent.body.store, false); assert.match(sent.body.instructions, /Never invent/); assert.equal(result.text, 'Draft based on the brief.'); } finally { store.close(); }
});
test('template drafting works without keys and missing keyed features fail honestly', async () => {
  const store = new Store(':memory:'), p = new Providers(store, async () => { throw new Error('Must not fetch'); });
  try { const result = await p.outreach({ mode: 'template', title: 'Assembly request', source: 'request', channel: 'Email' }, store.profile()); assert.match(result.text, /scope, deadline, and budget/); if (!process.env.GOOGLE_PLACES_API_KEY) await assert.rejects(p.googleSearch({}), e => e.code === 'setup_required'); } finally { store.close(); }
});
test('PageSpeed sends mobile categories and handles quota errors without leaking details', async () => {
  const store = new Store(':memory:'); let u;
  const p = new Providers(store, async url => { u = new URL(url); return Response.json({ lighthouseResult: { categories: { performance: { score: .81 } }, audits: {} } }); });
  try { const result = await p.pageSpeed({ url: 'https://example.com' }); assert.equal(u.searchParams.get('strategy'), 'mobile'); assert.deepEqual(u.searchParams.getAll('category'), ['performance', 'accessibility', 'seo']); assert.equal(result.scores.performance, 81); p.fetch = async () => new Response('secret provider diagnostic', { status: 429 }); await assert.rejects(p.pageSpeed({ url: 'https://example.com' }), e => /Quota/.test(e.message) && !/secret/.test(e.message)); } finally { store.close(); }
});
test('HTTP workflow persists quote, payment, episode and blocks cross-site or malformed writes', async () => {
  const store = new Store(':memory:'), { server } = createApp({ store });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const bootstrap = await (await fetch(`${base}/api/bootstrap`)).json();
    const call = async (path, method = 'GET', body, extra = {}) => { const r = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-Scouter-Token': bootstrap.csrf, ...extra }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }); return { status: r.status, data: await r.json() }; };
    assert.equal((await fetch(`${base}/api/opportunities`)).status, 403);
    assert.equal((await call('/api/opportunities', 'POST', { title: 'x' }, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await call('/api/opportunities', 'POST', null)).status, 400);
    const created = await call('/api/opportunities', 'POST', { title: 'Turnover request', source: 'request', serviceId: 'cleaning' }); assert.equal(created.status, 201);
    let o = created.data; const path = `/api/opportunities/${o.id}`;
    o = (await call(path, 'PUT', { ...o, stage: 'Quoted', quote: { lines: [{ description: 'Cleaning hours', quantity: 3, rate: 30 }], terms: 'Agreed scope' } })).data;
    o = (await call(path, 'PUT', { ...o, stage: 'Paid', payment: 90, hours: 3, expenses: [{ description: 'Supplies', amount: 10 }], episode: { title: 'Odd Jobs test', consent: 'Granted', status: 'Editing', lesson: 'Confirm scope first' } })).data;
    assert.equal(o.payment, 90); assert.equal(o.episode.lesson, 'Confirm scope first');
    const list = (await call('/api/opportunities')).data; assert.equal(list[0].stage, 'Paid');
    assert.equal((await call('/api/profile', 'PUT', { ...bootstrap.profile, currency: 'EUR' })).status, 400);
    const exported = (await call('/api/export')).data; assert.equal(exported.opportunities[0].expenses[0].amount, 10);
    assert.equal((await call('/api/import', 'POST', exported)).data.skipped, 1);
    assert.equal((await call(path, 'DELETE')).status, 200); assert.equal((await call('/api/opportunities')).data.length, 0);
    const html = await fetch(base); assert.equal(html.status, 200); assert.match(html.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal((await call('/api/integrations', 'PUT', { keys: { unknown: 'bad' } })).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); store.close(); }
});
