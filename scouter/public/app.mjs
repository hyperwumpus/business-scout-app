import { h, button, field, panel, note, money, total, getForm, webLink, download, localDate, calendarDate } from './ui.mjs';

const app = document.getElementById('app');
const notifications = document.getElementById('notifications');
const state = { view: 'radar', data: null, selected: '', targets: [], targetCache: new Map(), search: { source: 'manual', serviceId: 'all', query: '', location: '' }, searching: false, searchError: '', searchId: 0, lastSearch: null, nextPageToken: '', websiteFilter: 'all', pipelineService: 'all', pipelineText: '' };
let dialog, toastTimer;

async function api(path, options = {}) {
  let response;
  try { response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', 'X-Scouter-Token': state.data?.csrf || '', ...options.headers }, ...(options.body ? { body: JSON.stringify(options.body) } : {}) }); }
  catch { throw new Error('Scouter is not reachable. Check that the local app is running.'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('Scouter returned an unreadable response. Reload and try again.'); }
  if (!response.ok) { const error = new Error(data.error || 'The request failed.'); error.code = data.code; throw error; }
  return data;
}
function toast(message, error = false) {
  clearTimeout(toastTimer); notifications.replaceChildren(h('div', { class: `toast ${error ? 'error' : ''}`, role: error ? 'alert' : 'status' }, message));
  toastTimer = setTimeout(() => notifications.replaceChildren(), error ? 9000 : 4500);
}
function service(id) { return state.data.services.find(s => s.id === id); }
function choices(includeAll = false) { return [...(includeAll ? [{ value: 'all', label: 'All services' }] : []), ...state.data.services.map(s => ({ value: s.id, label: `${s.lane} · ${s.name}` }))]; }
function refKey(t) { return t.source === 'manual' || t.source === 'request' ? t.id : `${t.source}:${t.externalId}`; }
function targetFor(o) { return state.targetCache.get(`${o.source}:${o.externalId}`); }
function titleFor(o) { return targetFor(o)?.title || o.title || `${o.source === 'google' ? 'Saved business' : 'Saved channel'} · ${o.externalId.slice(-6)}`; }
function targetView(o) { const cached = targetFor(o) || {}; return { ...o, ...cached, intelligence: cached.intelligence?.serviceId === o.serviceId ? cached.intelligence : undefined, serviceId: o.serviceId, id: o.id }; }
function sourceLabel(source) { return ({ request: 'Posted request', manual: 'Manual lead', google: 'Google Maps business', youtube: 'YouTube creator' })[source] || source; }
function currency() { return state.data.profile.currency; }
function m(value) { return money(value, currency()); }
async function refresh() { state.data.opportunities = await api('/api/opportunities'); }
function navigate(view) { if (state.view === view) render(); else location.hash = view; }
function syncView() { state.view = ['radar', 'pipeline', 'money', 'episodes', 'settings'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'radar'; render(); }
function header(title, subtitle, eyebrow = 'YOUR NEXT ODD JOB STARTS HERE', action) { return h('div', { class: 'page-title' }, h('div', {}, h('p', { class: 'eyebrow' }, eyebrow), h('h1', {}, title), h('p', { class: 'subtitle' }, subtitle)), action); }
function submitHandler(form, run) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const errorBox = form.querySelector('.form-error'); if (errorBox) errorBox.textContent = '';
    const buttons = [...form.querySelectorAll('[type="submit"]')]; buttons.forEach(b => b.disabled = true);
    try { await run(getForm(form)); }
    catch (error) { if (errorBox) errorBox.textContent = error.message; else toast(error.message, true); }
    finally { buttons.forEach(b => b.disabled = false); }
  });
  return form;
}
function errorBox() { return h('div', { class: 'form-error', role: 'alert' }); }
function submit(label, cls = 'primary') { return h('button', { type: 'submit', class: `button ${cls}` }, label); }
function showDialog(title, body, { wide = true } = {}) {
  if (dialog) { dialog.close(); dialog.remove(); }
  const current = h('dialog', { class: 'dialog', 'aria-label': title }, h('div', { class: 'dialog-header' }, h('h2', {}, title), button('✕', () => current.close(), 'ghost', { 'aria-label': 'Close dialog' })), h('div', { class: 'dialog-body' }, body));
  current.addEventListener('close', () => { current.remove(); if (dialog === current) { document.body.classList.remove('print-quote'); dialog = null; } });
  dialog = current; document.body.append(current); current.showModal();
  return current;
}
function render() {
  if (!state.data) return;
  const nav = [['radar', '⌖', 'Opportunity Radar'], ['pipeline', '▦', 'Pipeline'], ['money', '◈', 'Jobs & money'], ['episodes', '▶', 'Episode journal'], ['settings', '⚙', 'Settings']];
  const content = ({ radar: radarPage, pipeline: pipelinePage, money: moneyPage, episodes: episodesPage, settings: settingsPage })[state.view]();
  app.replaceChildren(h('div', { class: 'app-shell' },
    h('header', { class: 'topbar' }, h('div', { class: 'brand' }, h('div', { class: 'brand-mark', 'aria-hidden': 'true' }, '⌖'), 'SCOUTER'), h('div', { class: 'top-status' }, h('span', { class: 'status-dot', 'aria-hidden': 'true' }), h('span', { class: 'mono' }, 'PERSONAL WORKSPACE'))),
    h('nav', { class: 'top-nav', 'aria-label': 'Workspace' }, nav.map(([id, icon, label]) => button([h('span', { class: 'nav-symbol', 'aria-hidden': 'true' }, icon), label], () => navigate(id), '', { class: `nav-button ${state.view === id ? 'active' : ''}`, 'aria-current': state.view === id ? 'page' : null }))),
    h('main', { id: 'main' }, content),
    h('footer', { class: 'footer' }, h('span', { class: 'mono' }, 'FIND → QUALIFY → QUOTE → DELIVER → GET PAID'), h('div', { class: 'actions' }, `${state.data.opportunities.length} saved`, button('Data & privacy', privacyDialog, 'ghost')))
  ));
  document.title = `Scouter — ${nav.find(([id]) => id === state.view)?.[2] || 'Workspace'}`;
}

function radarPage() {
  const provider = state.search.source, selectedService = service(state.search.serviceId);
  const form = h('form', { class: 'search-panel' });
  const sourceField = field('Search source', 'source', provider, { choices: [{ value: 'manual', label: 'Saved leads & posted requests' }, { value: 'google', label: 'Google · Local businesses' }, { value: 'youtube', label: 'YouTube · Creators' }] });
  const serviceField = field('I can help with', 'serviceId', state.search.serviceId, { choices: choices(provider === 'manual') });
  const queryField = field(provider === 'youtube' ? 'Creator niche / channel' : provider === 'google' ? 'Business type' : 'Find in saved opportunities', 'query', state.search.query, { placeholder: provider === 'google' ? selectedService?.queries[0] || 'Property managers' : provider === 'youtube' ? 'Cooking, gaming, podcast…' : 'Title, notes, request…', required: provider !== 'manual', maxlength: 180 });
  const locationField = field('Location', 'location', state.search.location || state.data.profile.location, { placeholder: 'City, state', required: provider === 'google', disabled: provider === 'youtube', maxlength: 180 });
  sourceField.querySelector('select').addEventListener('change', e => { state.search = { ...state.search, source: e.target.value, query: '', serviceId: e.target.value === 'manual' ? 'all' : e.target.value === 'youtube' ? 'editing' : 'website' }; resetSearch(); render(); });
  serviceField.querySelector('select').addEventListener('change', e => { state.search.serviceId = e.target.value; resetSearch(); render(); });
  queryField.querySelector('input').addEventListener('change', e => state.search.query = e.target.value);
  locationField.querySelector('input').addEventListener('change', e => state.search.location = e.target.value);
  form.append(h('div', { class: 'search-grid' }, sourceField, serviceField, queryField, locationField, submit(state.searching ? 'Scanning…' : provider === 'manual' ? 'Filter opportunities' : 'Scan opportunities')),
    h('p', { class: 'hint' }, provider === 'manual' ? 'Save an opportunity or paste a request you found. No marketplace scraping or fabricated job listings.' : provider === 'google' ? 'One page per scan, up to 12 businesses. Google may charge your API account. A listing is a lead, not confirmed demand.' : 'Public channel search uses your YouTube API quota. Audience size does not establish budget or purchase interest.'), errorBox());
  form.querySelector('[type="submit"]').disabled = state.searching;
  submitHandler(form, async values => {
    state.search = { source: values.source, serviceId: values.serviceId, query: values.query, location: values.location || state.data.profile.location };
    if (provider === 'manual') { state.selected = ''; render(); return; }
    await runSearch(false);
  });
  const selected = selectedRadarTarget();
  return [header('Find your next paid job.', 'Pick a service. Find a signal. Start a conversation.', undefined, button('+ Add opportunity', () => addOpportunity(), 'primary')),
    !state.data.profile.services.length ? h('div', { class: 'notice' }, h('span', {}, 'Choose the services you can deliver and add your equipment, availability, and proof.'), button('Set up my profile', () => navigate('settings'), 'small')) : null,
    provider !== 'manual' && !state.data.integrations[provider].configured ? h('div', { class: 'notice' }, h('span', {}, `Add your ${provider === 'google' ? 'Google Places' : 'YouTube'} key to run real searches.`), button('Connect API', () => navigate('settings'), 'small')) : null,
    form,
    state.searchError ? h('div', { class: 'notice error', role: 'alert' }, state.searchError, state.searchError.includes('Settings') ? button('Open Settings', () => navigate('settings'), 'small') : null) : null,
    h('div', { class: 'radar-layout' }, visor(), selected ? detailPanel(selected) : h('aside', { class: 'hardware' }, h('div', { class: 'vents', 'aria-hidden': 'true' }), h('div', { class: 'detail-heading' }, 'OPPORTUNITY BRIEF'), h('h2', {}, 'Every signal needs a closer look.'), note('Select a result to inspect the evidence, choose an offer, and decide your next action.'), h('div', { class: 'readout' }, h('div', { class: 'readout-value' }, '⌖'), h('div', { class: 'readout-text' }, 'Your first opportunity', h('small', {}, 'Start with work you can deliver.'))), note('Posted requests and potential business leads are labeled separately.'), button('Add a lead or request', () => addOpportunity(), 'primary full')))
  ];
}
function resetSearch() { state.searchId++; state.searching = false; state.targets = []; state.nextPageToken = ''; state.lastSearch = null; state.selected = ''; state.searchError = ''; state.websiteFilter = 'all'; }
async function runSearch(more) {
  const id = ++state.searchId;
  state.searching = true; state.searchError = '';
  const input = more ? { ...state.lastSearch, pageToken: state.nextPageToken } : { ...state.search };
  if (!more) { state.targets = []; state.selected = ''; state.lastSearch = input; }
  render();
  try {
    const data = await api('/api/search', { method: 'POST', body: input });
    if (id !== state.searchId) return;
    const merged = more ? [...state.targets, ...data.targets] : data.targets;
    state.targets = [...new Map(merged.filter(t => t.businessStatus !== 'CLOSED_PERMANENTLY').map(t => [refKey(t), t])).values()];
    state.targets.forEach(t => state.targetCache.set(refKey(t), t));
    state.nextPageToken = data.nextPageToken;
    if (!state.selected) state.selected = refKey(state.targets[0] || {});
  } catch (e) { if (id === state.searchId) state.searchError = e.message; }
  finally { if (id === state.searchId) { state.searching = false; render(); } }
}
function radarTargets() {
  let list;
  if (state.search.source === 'manual') {
    const q = state.search.query.toLowerCase();
    list = state.data.opportunities.filter(o => (state.search.serviceId === 'all' || o.serviceId === state.search.serviceId) && (!q || `${titleFor(o)} ${o.notes} ${o.description} ${o.offer}`.toLowerCase().includes(q))).map(targetView);
  } else {
    list = state.targets.filter(t => state.search.source !== 'google' || state.websiteFilter === 'all' || (state.websiteFilter === 'missing' ? !t.website : t.website));
    list = [...list].sort((a, b) => (b.intelligence?.score ?? -1) - (a.intelligence?.score ?? -1));
  }
  return list;
}
function selectedRadarTarget() { const list = radarTargets(); return list.find(t => refKey(t) === state.selected) || list[0]; }
function visor() {
  const list = radarTargets(), provider = state.search.source;
  const panel = h('section', { class: 'visor', 'aria-label': 'Opportunity results' },
    h('div', { class: 'lens-header' }, h('span', {}, 'SCOUTER / OPPORTUNITY RADAR'), h('span', { class: state.searching ? 'loading-pulse' : '' }, state.searching ? 'SCANNING…' : 'SCAN READY')),
    h('div', { class: 'lens-summary' }, h('div', { class: 'radar-disc', 'aria-hidden': 'true', 'data-signals': list.length ? 'yes' : 'no' }), h('div', {}, h('div', { class: 'reading', 'aria-live': 'polite' }, String(list.length).padStart(2, '0')), h('div', { class: 'lens-copy' }, 'opportunities to review', h('br'), provider === 'manual' ? 'Your saved leads & requests' : provider === 'google' ? 'Live business discovery' : 'Live creator discovery'))),
    h('div', { class: 'list-heading mono' }, h('span', {}, 'SIGNALS DETECTED'), h('span', {}, provider === 'google' && state.search.serviceId === 'website' ? 'WEBSITE PRIORITY ↓' : 'REVIEW THE EVIDENCE'))
  );
  if (provider === 'google') {
    panel.append(h('label', { class: 'lens-filter' }, 'Website filter', h('select', { 'aria-label': 'Website filter', onchange: e => { state.websiteFilter = e.target.value; state.selected = ''; render(); } }, [{ value: 'all', label: 'All businesses' }, { value: 'missing', label: 'Website not listed' }, { value: 'listed', label: 'Website listed' }].map(v => h('option', { value: v.value, selected: state.websiteFilter === v.value }, v.label)))));
  }
  panel.append(h('div', { class: 'target-list' }, list.map(t => {
    const chosen = service(t.serviceId || state.lastSearch?.serviceId || state.search.serviceId);
    const info = t.intelligence;
    return h('button', { type: 'button', class: 'target', 'aria-pressed': refKey(selectedRadarTarget() || {}) === refKey(t), onclick: () => { state.selected = refKey(t); render(); } },
      h('span', { class: 'target-glyph', 'aria-hidden': info?.score == null }, info?.score ?? chosen?.icon ?? '⌖'),
      h('span', {}, h('span', { class: 'target-name' }, t.title || titleFor(t)), h('span', { class: 'target-meta' }, t.category || chosen?.name || 'Opportunity', t.location ? ` · ${t.location}` : '', t.source === 'google' && t.rating != null ? [h('br'), `★ ${t.rating} · ${t.reviewCount ?? 'Unknown'} reviews`] : null), h('span', { class: 'target-tag' }, `${sourceLabel(t.source).toUpperCase()}${t.stage ? ` · ${t.stage}` : ''}`)), h('span', { class: 'chevron', 'aria-hidden': 'true' }, '›'));
  })));
  if (!list.length) panel.append(h('div', { class: 'lens-empty' }, h('div', { class: 'empty-icon', 'aria-hidden': 'true' }, '⌖'), state.searching ? 'Reading live signals…' : provider === 'manual' ? 'Your next job starts with a real opportunity. Add a request you found or search for potential clients.' : state.lastSearch ? 'No results match this search or filter. Try a different query.' : 'Choose a service and run a scan to find potential clients.', provider === 'manual' ? button('+ Add opportunity', () => addOpportunity(), 'primary') : null));
  if (state.nextPageToken) panel.append(h('div', { class: 'actions' }, button(state.searching ? 'Scanning…' : 'Load next page', () => runSearch(true), '', { disabled: state.searching })));
  if (provider === 'google' && state.targets.length) panel.append(h('div', { class: 'lens-attribution', translate: 'no' }, 'Google Maps', webLink('https://maps.google.com', 'View source')));
  if (provider === 'youtube' && state.targets.length) panel.append(h('div', { class: 'lens-attribution' }, 'YouTube · Public channel data'));
  return panel;
}
function detailPanel(t) {
  const s = service(t.serviceId || state.lastSearch?.serviceId || state.search.serviceId), saved = state.data.opportunities.find(o => o.id === t.id || (o.source === t.source && o.externalId && o.externalId === t.externalId));
  const info = t.intelligence || { score: null, summary: t.source === 'request' ? 'A request you saved. Confirm scope, timing, and payment.' : 'A potential opportunity. Interest and budget need confirmation.', offer: t.offer || s?.offer, reasons: [], unknowns: ['Scope and deadline', 'Budget and payment', 'Your availability and fit'] };
  const details = h('aside', { class: 'hardware' }, h('div', { class: 'vents', 'aria-hidden': 'true' }), h('div', { class: 'detail-heading' }, h('span', {}, 'OPPORTUNITY BRIEF'), h('span', {}, '● SELECTED')), h('h2', {}, t.title || titleFor(t)), h('div', { class: 'source-badge' }, sourceLabel(t.source)),
    h('div', { class: 'readout' }, h('div', { class: 'readout-value' }, info.score ?? s?.icon ?? '⌖'), h('div', { class: 'readout-text' }, info.score == null ? t.source === 'request' ? 'Request to qualify' : 'Need to verify' : `${info.score}/100 website priority`, h('small', {}, info.score == null ? 'No purchase prediction' : 'Every point explained below'))),
    h('p', { class: 'label' }, 'WHAT THE SIGNAL SAYS'), note(info.summary),
    t.description ? note(t.description.slice(0, 800)) : null,
    info.reasons?.map(r => h('div', { class: 'factor' }, r.label, h('b', {}, `+${r.points}`))),
    t.subscriberCount != null ? note(`${Number(t.subscriberCount).toLocaleString()} subscribers · ${Number(t.videoCount || 0).toLocaleString()} videos. These are public counts, not a measure of purchasing power.`) : null,
    h('p', { class: 'label' }, 'WHAT YOU COULD OFFER'), h('div', { class: 'offer' }, h('strong', {}, t.offer || info.offer || s?.offer), note('Start with a small, clear scope. Ask whether this work is a priority.')),
    h('p', { class: 'label' }, 'CONFIRM BEFORE YOU QUOTE'), h('ul', { class: 'simple-list' }, (info.unknowns || []).map(v => h('li', {}, v))),
    h('div', { class: 'actions' }, t.sourceUrl ? webLink(t.sourceUrl, 'Open source') : null, t.website ? webLink(t.website, 'Website') : null, t.phone ? h('a', { href: `tel:${t.phone.replace(/[^+\d]/g, '')}` }, t.phone) : null, t.contact ? note(t.contact) : null),
    t.fetchedAt ? note(`Retrieved ${new Date(t.fetchedAt).toLocaleString()}.`) : null,
    t.source === 'google' ? h('div', {}, h('div', { class: 'provider-attribution', translate: 'no' }, 'Google Maps'), note('Use Load current details in the saved opportunity to refresh this information.'), (t.attributions || []).map(a => webLink(a.url, a.name))) : null,
    h('div', { class: 'actions' }, saved ? button('Open saved opportunity', () => openOpportunity(saved.id), 'primary full') : button('+ Save opportunity', () => saveTarget(t, s.id), 'primary full'))
  );
  if (t.website) details.append(button('Run mobile website audit', () => auditDialog(t.website), 'full'));
  if (t.source === 'google') details.append(button('Compare local businesses', () => competitorDialog(t), 'full'));
  if (!saved) details.append(button('Draft outreach', () => draftDialog(t), 'full'));
  return details;
}
async function saveTarget(t, serviceId) {
  try {
    const saved = await api('/api/opportunities', { method: 'POST', body: { source: t.source, externalId: t.externalId, serviceId, offer: service(serviceId).offer, stage: 'New' } });
    state.data.opportunities.unshift(saved); toast('Opportunity saved. Open it to qualify, quote, and track the work.'); render();
  } catch (e) { toast(e.message, true); }
}

function addOpportunity() {
  const form = h('form', {}, h('div', { class: 'form-grid' }, field('Opportunity title', 'title', '', { required: true, maxlength: 180, placeholder: 'Rental cleanup, café photos, editing request…' }), field('Type', 'source', 'request', { choices: [{ value: 'request', label: 'Posted request / someone asked for help' }, { value: 'manual', label: 'Potential client / manual lead' }] }), field('Service', 'serviceId', state.search.serviceId === 'all' ? state.data.profile.services[0] || 'photos' : state.search.serviceId, { choices: choices() }), field('Location', 'location', state.data.profile.location, { maxlength: 200 }), field('Source link', 'sourceUrl', '', { type: 'url', placeholder: 'https://…' }), field('Contact details', 'contact', '', { maxlength: 500 }), field('Website (optional)', 'website', '', { type: 'url' }), field(`Stated budget (${currency()}; 0 if unknown)`, 'budget', '0', { type: 'number', min: 0, max: 10000000, step: '.01' }), field('Request or observations', 'description', '', { area: true, maxlength: 5000, placeholder: 'What was actually requested or observed? Keep unknowns clear.' })), errorBox(), h('div', { class: 'actions' }, submit('Save opportunity')));
  submitHandler(form, async values => { const saved = await api('/api/opportunities', { method: 'POST', body: values }); state.data.opportunities.unshift(saved); dialog.close(); state.search.source = 'manual'; state.search.serviceId = 'all'; state.selected = saved.id; navigate('radar'); toast('Opportunity saved.'); });
  showDialog('Add a real opportunity', [note('Save a request, referral, or potential client you found. This record is yours; no sample jobs are inserted.'), form]);
}
function pipelinePage() {
  const list = state.data.opportunities.filter(o => (state.pipelineService === 'all' || o.serviceId === state.pipelineService) && (!state.pipelineText || `${titleFor(o)} ${o.notes} ${o.offer}`.toLowerCase().includes(state.pipelineText.toLowerCase())));
  const filter = field('Service', 'filter', state.pipelineService, { choices: choices(true), onchange: e => { state.pipelineService = e.target.value; render(); } });
  const textFilter = field('Find a prospect', 'find', state.pipelineText, { placeholder: 'Name, offer, notes…', onchange: e => { state.pipelineText = e.target.value; render(); } });
  return [header('Keep opportunities in sight.', 'A clear next action for every lead, request, and booked job.', 'YOUR SALES PIPELINE', button('+ Add opportunity', () => addOpportunity(), 'primary')),
    h('div', { class: 'toolbar' }, h('div', { class: 'actions' }, filter, textFilter), note('Move stages from each opportunity. Payments and expenses are tracked separately.')),
    !list.length ? panel('', h('div', { class: 'empty' }, 'No prospects match this view.', h('br'), button('Add your first opportunity', () => addOpportunity(), 'primary'))) :
      h('div', { class: 'board' }, state.data.stages.map(stage => h('section', { class: 'board-column' }, h('h3', { class: 'board-title' }, stage, h('span', { class: 'chip' }, list.filter(o => o.stage === stage).length)), list.filter(o => o.stage === stage).map(o => pipelineCard(o)))))
  ];
}
function pipelineCard(o) {
  const due = o.followUp && o.followUp <= localDate() && !['Paid', 'Lost'].includes(o.stage);
  return h('button', { type: 'button', class: 'pipeline-card', onclick: () => openOpportunity(o.id) }, h('strong', {}, titleFor(o)), h('small', {}, service(o.serviceId)?.name), o.nextAction ? h('small', {}, o.nextAction) : h('small', {}, 'Set a next action'), o.followUp ? h('small', { class: due ? 'due' : '' }, `${due ? 'Follow-up due · ' : 'Follow-up · '}${calendarDate(o.followUp)}`) : null, total(o.quote.lines) ? h('span', { class: 'chip' }, `${m(total(o.quote.lines))} quoted`) : h('span', { class: 'chip' }, sourceLabel(o.source)));
}
function moneyPage() {
  const items = state.data.opportunities;
  const revenue = items.reduce((sum, o) => sum + Math.round(o.payment * 100), 0) / 100;
  const expenses = items.reduce((sum, o) => sum + o.expenses.reduce((n, e) => n + Math.round(e.amount * 100), 0), 0) / 100;
  const hours = items.reduce((sum, o) => sum + o.hours, 0), net = revenue - expenses;
  const active = items.filter(o => ['Booked', 'Delivered', 'Paid'].includes(o.stage) || o.payment || o.expenses.length || o.hours);
  return [header('Know what the work earned.', 'Actual payments and expenses, with your time accounted for.', 'JOBS & MONEY'),
    h('div', { class: 'metric-grid' }, metric('Payments received', m(revenue), 'Recorded cash, not quoted revenue'), metric('Expenses', m(expenses), 'Materials, travel, and other costs'), metric('Net before tax', m(net), 'Payments minus recorded expenses'), metric('Net per hour', hours ? m(net / hours) : '—', `${hours} hours recorded`)),
    panel('Your jobs', active.length ? h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Job', 'Stage', 'Quoted', 'Received', 'Expenses', 'Hours', 'Net'].map(v => h('th', { scope: 'col' }, v)))), h('tbody', {}, active.map(o => { const costs = o.expenses.reduce((sum, e) => sum + e.amount, 0); return h('tr', {}, h('td', {}, button(titleFor(o), () => openOpportunity(o.id, 'money'), 'ghost small')), h('td', {}, o.stage), h('td', {}, m(total(o.quote.lines))), h('td', {}, m(o.payment)), h('td', {}, m(costs)), h('td', {}, o.hours), h('td', {}, m(o.payment - costs))); })))) : h('div', { class: 'empty' }, 'Book a job or record a payment, expense, or hours in an opportunity to see it here.', h('br'), button('Open pipeline', () => navigate('pipeline'), 'primary'))),
    note('Figures use the currency set in your profile. They are a work ledger, not tax accounting.')];
}
function metric(label, value, detail) { return h('div', { class: 'metric' }, h('div', { class: 'metric-label' }, label), h('div', { class: 'metric-number' }, value), h('small', {}, detail)); }
function episodesPage() {
  const items = state.data.opportunities.filter(o => o.episode.title || o.episode.before || o.episode.after || o.episode.lesson);
  return [header('Turn the work into a story.', 'Capture the before, the work, the result, and what you learned.', 'HYPERWUMPUS / ODD JOBS'),
    panel('', note('Episode loop: find the opportunity → agree on the job → do the work → show the outcome → explain the money and the lesson. Filming permission is recorded per job.')),
    items.length ? h('div', { class: 'two-column' }, items.map(o => panel(o.episode.title || titleFor(o), h('div', { class: 'actions' }, h('span', { class: 'chip' }, o.episode.status), h('span', { class: 'chip' }, `Filming: ${o.episode.consent}`)), note(o.episode.lesson || o.episode.before || 'Add your story notes.'), note(`${m(o.payment)} received · ${o.hours} hours`), button('Open episode notes', () => openOpportunity(o.id, 'episode'), 'primary')))) : panel('', h('div', { class: 'empty' }, 'Start an episode inside a saved opportunity. Your notes stay connected to the job and its earnings.', h('br'), button('Choose an opportunity', () => navigate('pipeline'), 'primary')))
  ];
}

function settingsPage() {
  const p = state.data.profile;
  const profileForm = h('form', {}, h('div', { class: 'form-grid' }, field('Your name', 'name', p.name, { maxlength: 120 }), field('Business / creator name', 'businessName', p.businessName, { maxlength: 150 }), field('Default search location', 'location', p.location, { maxlength: 200 }), field('Currency', 'currency', p.currency, { choices: ['USD', 'CAD', 'GBP', 'EUR', 'AUD'] }), field('Your starting hourly rate', 'hourlyRate', p.hourlyRate, { type: 'number', min: 0, max: 10000, step: '.01' }), field('Availability', 'availability', p.availability, { maxlength: 500 }), field('Equipment and tools', 'equipment', p.equipment, { area: true, maxlength: 1000 }), field('Transportation / travel limits', 'transport', p.transport, { area: true, maxlength: 500 }), field('Relevant experience or proof you can truthfully share', 'proof', p.proof, { area: true, maxlength: 2000 })), h('h4', {}, 'Services I can confidently deliver'), h('div', { class: 'checks' }, state.data.services.map(s => h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'services', value: s.id, checked: p.services.includes(s.id) }), `${s.icon} ${s.name}`))), errorBox(), h('div', { class: 'actions' }, submit('Save profile')));
  submitHandler(profileForm, async values => { const oldCurrency = state.data.profile.currency; if (values.currency !== oldCurrency && state.data.opportunities.some(o => o.payment || o.budget || o.expenses.length || o.quote.lines.length)) throw new Error('Existing amounts are in your current currency. Keep that currency, or export and start a separate workspace; currency conversion is not automatic.'); const profile = await api('/api/profile', { method: 'PUT', body: { ...values, services: new FormData(profileForm).getAll('services') } }); state.data.profile = profile; toast('Profile saved.'); render(); });
  const links = { google: 'https://developers.google.com/maps/documentation/places/web-service/get-api-key', youtube: 'https://developers.google.com/youtube/v3/getting-started', pagespeed: 'https://developers.google.com/speed/docs/insights/v5/get-started', openai: 'https://platform.openai.com/api-keys' };
  const labels = { google: 'Google Places (New)', youtube: 'YouTube Data API', pagespeed: 'PageSpeed Insights', openai: 'OpenAI outreach' };
  const keyForm = h('form', {}, h('div', { class: 'form-grid' }, Object.keys(labels).map(key => field(labels[key], key, '', { type: 'password', autocomplete: 'off', placeholder: state.data.integrations[key].configured ? 'Configured · leave blank to keep' : key === 'pagespeed' ? 'Optional key for larger usage' : 'Paste API key', maxlength: 500 })), field('OpenAI model', 'model', state.data.model, { maxlength: 100 })), note('Keys are saved in the local server database and never returned to the browser. Empty fields preserve existing keys. API account usage and billing are yours.'), errorBox(), h('div', { class: 'actions' }, submit('Save connections')));
  submitHandler(keyForm, async values => { const keys = Object.fromEntries(Object.keys(labels).filter(k => values[k].trim()).map(k => [k, values[k].trim()])); const result = await api('/api/integrations', { method: 'PUT', body: { keys, model: values.model } }); state.data.integrations = result.integrations; state.data.model = result.model; toast('Connections saved. Run a search to verify your provider account.'); render(); });
  const importInput = h('input', { type: 'file', accept: '.json,application/json', class: 'hidden', 'aria-label': 'Import Scouter backup' });
  importInput.addEventListener('change', async () => { const file = importInput.files[0]; if (!file) return; try { if (file.size > 2e6) throw new Error('Choose a backup smaller than 2 MB.'); const backup = JSON.parse(await file.text()); const result = await api('/api/import', { method: 'POST', body: backup }); state.data = { ...state.data, ...(await api('/api/bootstrap')) }; render(); toast(`${result.imported} opportunities imported; ${result.skipped} duplicates skipped.`); } catch (e) { toast(e.message, true); } });
  return [header('Set your range.', 'Your skills, your tools, and the connections that power discovery.', 'PROFILE & CONNECTIONS'),
    panel('What can you deliver?', profileForm),
    h('div', { class: 'connection-grid' }, Object.entries(labels).map(([key, label]) => h('div', { class: 'connection' }, h('strong', {}, label), h('small', {}, state.data.integrations[key].configured ? 'Key configured · verified on use' : key === 'pagespeed' ? 'Works without a key, subject to quota' : 'Needs your API key'), webLink(links[key], 'Setup guide'), state.data.integrations[key].configured ? button('Remove saved key', () => removeKey(key), 'ghost small') : null))),
    panel('Connect your APIs', keyForm),
    panel('Backup your workspace', note('Export includes your profile, workflow records, quotes, expenses, and episode notes. It excludes API keys and transient provider data. Import adds records without overwriting existing opportunities.'), h('div', { class: 'actions' }, button('Export backup', exportBackup, 'dark'), button('Import backup', () => importInput.click()), button('Export ledger CSV', exportLedger)), importInput),
    panel('Website audit', note('Run a live mobile PageSpeed audit on a public website. A key is optional; Google may limit unkeyed requests.'), button('Audit a website', () => auditDialog(), 'primary'))];
}
async function removeKey(key) {
  try { const result = await api('/api/integrations', { method: 'PUT', body: { keys: { [key]: '' } } }); state.data.integrations = result.integrations; render(); toast(result.integrations[key].configured ? 'Saved key removed. An environment key remains configured.' : 'Saved key removed.'); } catch (e) { toast(e.message, true); }
}
async function exportBackup() { try { const data = await api('/api/export'); download(`scouter-backup-${localDate()}.json`, JSON.stringify(data, null, 2)); toast('Workspace backup downloaded.'); } catch (e) { toast(e.message, true); } }
function exportLedger() {
  const cell = v => { let s = String(v ?? ''); if (/^[=+@\-]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; };
  const rows = [['Opportunity', 'Service', 'Stage', 'Currency', 'Quoted', 'Payment', 'Expenses', 'Net', 'Hours', 'Follow-up'], ...state.data.opportunities.map(o => { const expenses = o.expenses.reduce((n, e) => n + e.amount, 0); return [o.title || `Saved ${o.source} reference ${o.externalId}`, service(o.serviceId)?.name, o.stage, currency(), total(o.quote.lines), o.payment, expenses, o.payment - expenses, o.hours, o.followUp]; })];
  download(`scouter-ledger-${localDate()}.csv`, rows.map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}

function openOpportunity(id, initialTab = 'details') {
  let tab = initialTab;
  const container = h('div');
  function draw() {
    const o = state.data.opportunities.find(item => item.id === id);
    if (!o) return;
    container.replaceChildren(h('div', { class: 'dialog-tabs' }, [['details', 'Details & next action'], ['quote', 'Quote'], ['money', 'Payment & costs'], ['episode', 'Episode']].map(([key, label]) => button(label, () => { tab = key; draw(); }, tab === key ? 'active' : ''))));
    container.append(({ details: () => opportunityDetails(o, draw), quote: () => quoteEditor(o), money: () => moneyEditor(o), episode: () => episodeEditor(o) })[tab]());
  }
  draw(); showDialog(titleFor(state.data.opportunities.find(o => o.id === id)), container);
}
async function updateOpportunity(o, updates) {
  const latest = state.data.opportunities.find(item => item.id === o.id) || o;
  const saved = await api(`/api/opportunities/${o.id}`, { method: 'PUT', body: { ...latest, ...updates } });
  state.data.opportunities = state.data.opportunities.map(item => item.id === o.id ? saved : item);
  render(); return saved;
}
function opportunityDetails(o, redraw) {
  const t = targetFor(o), provider = ['google', 'youtube'].includes(o.source);
  const form = h('form', {}, h('div', { class: 'form-grid' },
    provider ? null : field('Title', 'title', o.title, { required: true, maxlength: 180 }),
    field('Service', 'serviceId', o.serviceId, { choices: choices() }), field('Stage', 'stage', o.stage, { choices: state.data.stages }),
    provider ? null : field('Contact details', 'contact', o.contact, { maxlength: 500 }),
    provider ? null : field('Source link', 'sourceUrl', o.sourceUrl, { type: 'url' }),
    provider ? null : field('Website', 'website', o.website, { type: 'url' }),
    provider ? null : field('Location', 'location', o.location, { maxlength: 200 }),
    provider ? null : field('Request or observations', 'description', o.description, { area: true, maxlength: 5000 }),
    field('Proposed offer', 'offer', o.offer || service(o.serviceId).offer, { area: true, maxlength: 1500 }), field('Your notes', 'notes', o.notes, { area: true, maxlength: 10000 }), field('Next action', 'nextAction', o.nextAction, { maxlength: 500 }), field('Follow-up date', 'followUp', o.followUp, { type: 'date' })), errorBox(), h('div', { class: 'actions' }, submit('Save details'), button('Draft outreach', () => draftDialog({ ...o, ...t })), t?.website || o.website ? button('Audit website', () => auditDialog(t?.website || o.website)) : null));
  submitHandler(form, async values => { await updateOpportunity(o, values); toast('Details saved.'); redraw(); });
  const activityInput = field('Contact attempt / activity', 'activity', '', { area: true, maxlength: 1000, placeholder: 'Called, sent a quote, received a reply…' });
  const activityForm = h('form', {}, activityInput, errorBox(), h('div', { class: 'actions' }, submit('Log activity', '')));
  submitHandler(activityForm, async values => { if (!values.activity.trim()) throw new Error('Describe the activity.'); await updateOpportunity(o, { activities: [...o.activities, { date: localDate(), text: values.activity }] }); toast('Activity logged.'); redraw(); });
  const loaded = h('div');
  if (provider) {
    loaded.append(panel('Provider reference', note(`Saved ${o.source === 'google' ? 'Place ID' : 'channel ID'}: ${o.externalId}. Business/channel data is loaded on demand and not stored in the backup.`), t ? note(`${t.title}${t.location ? ` · ${t.location}` : ''}`) : note('Load current details to see this target’s name and public information.'), button(t ? 'Refresh current details' : 'Load current details', async () => {
      try { const fresh = await api('/api/target', { method: 'POST', body: { source: o.source, externalId: o.externalId, serviceId: o.serviceId } }); state.targetCache.set(refKey(fresh), fresh); render(); redraw(); toast('Current provider details loaded.'); } catch (e) { toast(e.message, true); }
    }, 'dark'), t?.sourceUrl ? webLink(t.sourceUrl, 'Open source') : null, t?.phone ? note(`Phone: ${t.phone}`) : null, t?.source === 'google' ? h('div', { class: 'provider-attribution', translate: 'no' }, 'Google Maps') : null, t?.source === 'google' ? button('Compare local businesses', () => competitorDialog(t)) : null));
  }
  return h('div', {}, loaded, form, panel('Activity history', o.activities.length ? o.activities.slice().reverse().map(a => h('div', { class: 'activity' }, h('small', {}, calendarDate(a.date)), a.text)) : note('No contact attempts recorded yet.'), activityForm), button('Delete opportunity', () => confirmDelete(o), 'danger'));
}
function confirmDelete(o) {
  showDialog('Delete this opportunity?', [note('This removes its quote, expense records, and episode notes. Export a backup first if you want to keep a copy.'), h('div', { class: 'actions' }, button('Keep opportunity', () => dialog.close()), button('Delete opportunity', async () => { try { await api(`/api/opportunities/${o.id}`, { method: 'DELETE' }); await refresh(); dialog.close(); render(); toast('Opportunity deleted.'); } catch (e) { toast(e.message, true); } }, 'danger'))]);
}
function quoteEditor(o) {
  const wrapper = h('div'), linesContainer = h('div'), totalNode = h('div', { class: 'quote-total', 'aria-live': 'polite' });
  function values() { return [...linesContainer.children].map(row => ({ description: row.querySelector('[name="description"]').value, quantity: Number(row.querySelector('[name="quantity"]').value), rate: Number(row.querySelector('[name="rate"]').value) })); }
  function recalc() { totalNode.textContent = `Total: ${m(total(values()))}`; }
  function addLine(item = { description: '', quantity: 1, rate: state.data.profile.hourlyRate }) {
    const row = h('div', { class: 'quote-line' }, field('Deliverable / item', 'description', item.description, { required: true, maxlength: 300 }), field('Quantity', 'quantity', item.quantity, { type: 'number', required: true, min: '.01', max: 1000, step: '.01' }), field(`Rate (${currency()})`, 'rate', item.rate, { type: 'number', required: true, min: 0, max: 1000000, step: '.01' }), button('×', () => { row.remove(); recalc(); }, 'ghost', { 'aria-label': 'Remove quote item' }));
    row.addEventListener('input', recalc); linesContainer.append(row); recalc();
  }
  const previewContainer = h('div');
  const form = h('form', { class: 'no-print' }, note('Define deliverables clearly. Quantity can represent hours or items; make the unit explicit in the description.'), linesContainer, button('+ Add quote item', () => addLine()), totalNode,
    h('div', { class: 'form-grid' }, field('Valid until', 'validUntil', o.quote.validUntil, { type: 'date' }), field('Terms, scope, exclusions, and payment', 'terms', o.quote.terms, { area: true, maxlength: 3000 })), errorBox(),
    h('div', { class: 'actions' }, submit(['New', 'Qualified', 'Contacted'].includes(o.stage) ? 'Save & mark Quoted' : 'Save quote'), button('Preview quote', () => { if (form.reportValidity()) previewContainer.replaceChildren(quotePreview(o, { ...getForm(form), lines: values() })); })));
  const initialLines = o.quote.lines.length ? o.quote.lines : [{ description: o.offer || service(o.serviceId).offer, quantity: 1, rate: 0 }];
  initialLines.forEach(addLine);
  submitHandler(form, async formValues => { const lines = values(); if (!lines.length) throw new Error('Add at least one quote item.'); await updateOpportunity(o, { quote: { ...formValues, lines }, stage: ['New', 'Qualified', 'Contacted'].includes(o.stage) ? 'Quoted' : o.stage }); previewContainer.replaceChildren(quotePreview(o, { ...formValues, lines })); toast('Quote saved.'); });
  wrapper.append(form, previewContainer); return wrapper;
}
function quotePreview(o, quote) {
  const p = state.data.profile;
  const quoteText = `${p.businessName || p.name || 'Scouter quote'}\nQUOTE FOR: ${o.title || 'Prospect'}\n${localDate()}\n\n${quote.lines.map(l => `${l.description} — ${l.quantity} × ${m(l.rate)} = ${m(Math.round(l.quantity * l.rate * 100) / 100)}`).join('\n')}\n\nTOTAL: ${m(total(quote.lines))}\n${quote.validUntil ? `Valid until: ${quote.validUntil}\n` : ''}\n${quote.terms || ''}`;
  return h('div', {}, h('section', { class: 'quote-preview' }, h('div', { class: 'quote-brand' }, p.businessName || p.name || 'Your service business'), h('h2', {}, 'Project quote'), note(`For: ${titleFor(o)}`), note(`Prepared: ${calendarDate(localDate())}`), h('table', {}, h('thead', {}, h('tr', {}, ['Deliverable', 'Qty', 'Rate', 'Amount'].map(t => h('th', {}, t)))), h('tbody', {}, quote.lines.map(l => h('tr', {}, h('td', {}, l.description), h('td', {}, l.quantity), h('td', {}, m(l.rate)), h('td', {}, m(Math.round(l.quantity * Math.round(l.rate * 100)) / 100)))))), h('div', { class: 'quote-total' }, `Total: ${m(total(quote.lines))}`), quote.validUntil ? note(`Valid until ${calendarDate(quote.validUntil)}`) : null, h('p', {}, quote.terms)), h('div', { class: 'actions no-print' }, button('Print / save as PDF', () => { document.body.classList.add('print-quote'); window.print(); }), button('Download quote text', () => download('scouter-quote.txt', quoteText, 'text/plain'))));
}
function moneyEditor(o) {
  const rows = h('div'), summary = h('p', { class: 'note' });
  function expenses() { return [...rows.children].map(row => ({ description: row.querySelector('[name="expenseDescription"]').value, amount: Number(row.querySelector('[name="expenseAmount"]').value) })); }
  function calc() { const costs = expenses().reduce((sum, e) => sum + e.amount, 0), payment = Number(form.querySelector('[name="payment"]').value), hours = Number(form.querySelector('[name="hours"]').value); summary.textContent = `${m(payment - costs)} net before tax${hours ? ` · ${m((payment - costs) / hours)} per hour` : ''}`; }
  function addExpense(expense = { description: '', amount: 0 }) { const row = h('div', { class: 'expense-line' }, field('Expense', 'expenseDescription', expense.description, { required: true, maxlength: 300 }), field(`Cost (${currency()})`, 'expenseAmount', expense.amount, { type: 'number', min: 0, max: 10000000, step: '.01', required: true }), button('×', () => { row.remove(); calc(); }, 'ghost', { 'aria-label': 'Remove expense' })); row.addEventListener('input', calc); rows.append(row); }
  const form = h('form', {}, h('div', { class: 'form-grid' }, field(`Total payment received (${currency()})`, 'payment', o.payment, { type: 'number', min: 0, max: 10000000, step: '.01', required: true }), field('Total hours spent', 'hours', o.hours, { type: 'number', min: 0, max: 10000, step: '.01', required: true })), h('h4', {}, 'Expenses'), rows, button('+ Add expense', () => { addExpense(); calc(); }), summary, h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'markPaid', checked: o.stage === 'Paid' }), 'Mark this job Paid (requires a recorded payment)'), errorBox(), h('div', { class: 'actions' }, submit('Save money records')));
  o.expenses.forEach(addExpense); form.addEventListener('input', calc); calc();
  submitHandler(form, async values => { await updateOpportunity(o, { payment: values.payment, hours: values.hours, expenses: expenses(), stage: values.markPaid ? 'Paid' : o.stage === 'Paid' && Number(values.payment) === 0 ? 'Delivered' : o.stage }); toast('Payment, expenses, and time saved.'); });
  return form;
}
function episodeEditor(o) {
  const e = o.episode;
  const form = h('form', {}, h('div', { class: 'form-grid' }, field('Episode title', 'title', e.title, { maxlength: 200 }), field('Production status', 'status', e.status, { choices: ['Idea', 'Filming', 'Editing', 'Published'] }), field('Permission to film / publish', 'consent', e.consent, { choices: ['Not asked', 'Granted', 'Declined'] }), field('Media / project link', 'mediaUrl', e.mediaUrl, { type: 'url' }), field('Before: the situation and agreed job', 'before', e.before, { area: true, maxlength: 4000 }), field('After: what changed and what was delivered', 'after', e.after, { area: true, maxlength: 4000 }), field('Lesson: what worked, what failed, what you would do differently', 'lesson', e.lesson, { area: true, maxlength: 4000 })), note(`${m(o.payment)} received · ${m(o.expenses.reduce((n, x) => n + x.amount, 0))} in expenses · ${o.hours} hours`), errorBox(), h('div', { class: 'actions' }, submit('Save episode notes')));
  submitHandler(form, async episode => { await updateOpportunity(o, { episode }); toast('Episode notes saved.'); }); return form;
}

function draftDialog(t) {
  const selectedService = service(t.serviceId || state.lastSearch?.serviceId || state.search.serviceId) || service('photos');
  const resultBox = h('div');
  const form = h('form', {}, h('div', { class: 'form-grid' }, field('Channel', 'channel', 'Email', { choices: ['Email', 'SMS', 'Phone'] }), field('Draft engine', 'mode', 'template', { choices: [{ value: 'template', label: 'Template · works without API keys' }, { value: 'ai', label: 'AI · uses your OpenAI account' }] }), field('Offer to discuss', 'offer', t.offer || selectedService.offer, { area: true, maxlength: 1500, required: true }), field('Your observations / context', 'notes', t.notes || t.description || '', { area: true, maxlength: 3000 })), note('Drafts are for your review. Scouter never sends outreach automatically. AI drafts transmit this brief and your profile proof to OpenAI when selected.'), errorBox(), h('div', { class: 'actions' }, submit('Create draft')));
  submitHandler(form, async values => {
    const result = await api('/api/outreach', { method: 'POST', body: { ...values, source: t.source, title: t.title || titleFor(t), evidence: t.intelligence?.reasons?.map(r => r.label).join('; ') || '', mode: values.mode } });
    const draft = h('textarea', { class: 'draft-box', 'aria-label': 'Editable outreach draft' }, result.text);
    resultBox.replaceChildren(note(result.mode === 'ai' ? `AI draft · ${result.model}. Review every claim before use.` : 'Template draft · no AI request was made.'), draft, h('div', { class: 'actions' }, button('Copy draft', async () => { try { await navigator.clipboard.writeText(draft.value); toast('Draft copied.'); } catch { draft.select(); toast('Select and copy the draft with your keyboard.'); } }), button('Download draft', () => download('scouter-outreach.txt', draft.value, 'text/plain'))));
  });
  showDialog(`Outreach · ${t.title || titleFor(t)}`, [form, resultBox]);
}
function competitorDialog(target) {
  const results = h('div');
  const form = h('form', {}, note('Compare public listings for the same business category and area. These are potential peers; verify which businesses actually compete. Each search uses your Google Places account.'), h('div', { class: 'form-grid' }, field('Business category', 'query', target.category === 'Business' ? '' : target.category, { required: true, maxlength: 180 }), field('Comparison area', 'location', state.search.location || state.data.profile.location, { required: true, maxlength: 180 })), errorBox(), h('div', { class: 'actions' }, submit('Find comparable businesses')));
  submitHandler(form, async values => {
    const data = await api('/api/search', { method: 'POST', body: { ...values, source: 'google', serviceId: 'website' } });
    const peers = data.targets.filter(t => t.externalId !== target.externalId && t.businessStatus !== 'CLOSED_PERMANENTLY');
    const row = t => h('tr', {}, h('td', {}, t.title, t.externalId === target.externalId ? ' · Selected' : ''), h('td', {}, t.rating == null ? 'Unknown' : `${t.rating} / 5`), h('td', {}, t.reviewCount ?? 'Unknown'), h('td', {}, t.website ? webLink(t.website, 'Website listed') : 'Not listed'), h('td', {}, webLink(t.sourceUrl, 'Source')));
    results.replaceChildren(h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Business', 'Rating', 'Reviews', 'Website', 'Listing'].map(label => h('th', {}, label)))), h('tbody', {}, row(target), peers.slice(0, 8).map(row)))), note('A missing website link does not establish that a website does not exist. Ratings and review counts do not measure revenue.'), h('div', { class: 'provider-attribution', translate: 'no' }, 'Google Maps'), ...peers.flatMap(t => (t.attributions || []).map(a => webLink(a.url, a.name))));
  });
  showDialog('Local business comparison', [form, results]);
}
function auditDialog(website = '') {
  const resultBox = h('div');
  const form = h('form', {}, field('Public website URL', 'url', website, { type: 'url', required: true }), note('A live mobile Lighthouse test can take up to a minute or more. It checks performance, accessibility, and SEO; it does not establish commercial need.'), errorBox(), h('div', { class: 'actions' }, submit('Run live mobile audit')));
  submitHandler(form, async values => {
    resultBox.replaceChildren(note('Running PageSpeed Insights. Please keep this window open…'));
    try {
      const result = await api('/api/audit', { method: 'POST', body: values });
      resultBox.replaceChildren(h('div', { class: 'audit-grid' }, Object.entries(result.scores).map(([name, score]) => metric(name, score == null ? '—' : `${score}/100`, 'Mobile lab score'))), ...result.metrics.map(v => h('div', { class: 'factor' }, v.name, h('b', {}, v.value))), h('h4', {}, 'Findings to investigate'), result.suggestions.map(v => h('div', {}, h('strong', {}, v.title), note(v.detail))), note(result.note), note(`Audited ${new Date(result.fetchedAt).toLocaleString()}.`), webLink(result.sourceUrl, 'View PageSpeed report'));
    } catch (e) { resultBox.replaceChildren(); throw e; }
  });
  showDialog('Website intelligence', [form, resultBox]);
}
function privacyDialog() {
  showDialog('Your workspace & data', [panel('Local storage', note('Your profile, manual leads, quotes, expenses, and episode notes live in a SQLite database on this computer. Scouter listens on localhost only. This is a single-user application, not a public multi-user service.')), panel('Provider data', note('Google and YouTube results are fetched only when you search or refresh a target. Saved provider opportunities contain a reference ID and your workflow records; provider names, ratings, addresses, and statistics are not stored in the database or backups.'), webLink('https://developers.google.com/maps/documentation/places/web-service/policies', 'Google Places policies')), panel('API credentials & outreach', note('API keys are stored in the local server database with restrictive file permissions, not in browser storage or exported backups. They are not encrypted at rest. Searches and AI drafts use your provider accounts. Drafts stay under your control; no outreach is automatically sent. AI requests use store:false, subject to provider data policies.'), webLink('https://policies.google.com/terms', 'Google Terms'), ' · ', webLink('https://policies.google.com/privacy', 'Google Privacy'), ' · ', webLink('https://developers.openai.com/api/docs/guides/your-data', 'OpenAI data controls'))]);
}

async function start() {
  try { state.data = await api('/api/bootstrap'); state.search.location = state.data.profile.location; syncView(); }
  catch (e) { app.replaceChildren(h('div', { class: 'boot' }, h('h1', {}, 'Scouter needs a connection.'), note(e.message, 'error'), button('Try again', start, 'primary'))); }
}
window.addEventListener('hashchange', syncView);
window.addEventListener('afterprint', () => document.body.classList.remove('print-quote'));
start();
