const content = document.querySelector('#content');
const toast = document.querySelector('#toast');
let currentView = 'overview';

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
})[character]);

const request = (method, params) => window.octopus.request(method, params);
const statusClass = (status) => esc(status.replaceAll(' ', '-'));

function notify(message, isError = false) {
  toast.textContent = message;
  toast.className = isError ? 'show error' : 'show';
  setTimeout(() => { toast.className = ''; }, 3200);
}

function setBusy(label = 'Working…') {
  content.innerHTML = `<div class="loading"><i></i><span>${esc(label)}</span></div>`;
}

function pageHeader(eyebrow, title, description, action = '') {
  return `<header class="page-head"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div>${action}</header>`;
}

function serverRow(server) {
  return `<button class="server-row open-server" data-id="${esc(server.id)}"><i class="status ${statusClass(server.runtime_status)}"></i><div><strong>${esc(server.name)}</strong><span>${esc(server.id)} · version ${esc(server.version)}</span></div><b>${esc(server.transport)} · ${esc(server.runtime_status)}</b><em>→</em></button>`;
}

async function renderOverview() {
  const data = await request('overview');
  const nodes = data.servers.length
    ? data.servers.map((server) => `<button class="node open-server ${server.runtime_status === 'running' ? 'live' : ''}" data-id="${esc(server.id)}"><i></i><strong>${esc(server.name)}</strong><span>${esc(server.runtime_status)}</span></button>`).join('')
    : '<button class="node nav-link" data-view="catalog"><i></i><strong>Open berth</strong><span>Choose from catalog</span></button>';
  const rows = data.servers.length ? data.servers.map(serverRow).join('') : '<div class="empty-state"><strong>No servers installed</strong><span>Catalog packages become independent local tools.</span><button class="text-action nav-link" data-view="catalog">Browse catalog →</button></div>';
  const events = data.events.length ? data.events.map((event) => `<div class="event"><i></i><div><strong>${esc(event.message)}</strong><span>${esc(event.created_at)}${event.package_id ? ` · ${esc(event.package_id)}` : ''}</span></div></div>`).join('') : '<div class="empty-state"><span>Installation and runtime events will appear here.</span></div>';
  content.innerHTML = `${pageHeader('Desktop control plane', 'Your tools, in their own waters.', '', '<button class="button primary nav-link" data-view="catalog">Install an MCP</button>')}
    <section class="topology"><div class="topology-copy"><strong>Local harbour</strong><span>Every node has an isolated Python environment.</span></div><div class="hub">O</div><div class="nodes">${nodes}</div></section>
    <section class="metrics"><article><span>Installed</span><strong>${data.servers.length}</strong><small>isolated servers</small></article><article><span>HTTP services</span><strong>${data.running_count}</strong><small>explicitly active</small></article><article><span>Catalog</span><strong>${data.catalog_count}</strong><small>packages available</small></article></section>
    <div class="split"><section class="panel"><div class="section-head"><h2>Installed fleet</h2><button class="text-action nav-link" data-view="servers">View all</button></div>${rows}</section><section class="panel"><div class="section-head"><h2>Activity log</h2></div>${events}</section></div>
    <p class="data-root">Managed data · ${esc(data.data_root)}</p>`;
}

async function renderCatalog() {
  const [packages, servers] = await Promise.all([request('catalog.list'), request('servers.list')]);
  const installed = new Set(servers.map((server) => server.id));
  const cards = packages.map((item) => `<article class="package-card"><div class="package-top"><span class="package-mark">${esc(item.name[0])}</span><span class="trust">● catalog</span></div><p class="category">${esc(item.category)}</p><h2>${esc(item.name)}</h2><p>${esc(item.description)}</p><dl><div><dt>Version</dt><dd>${esc(item.version)}</dd></div><div><dt>Runtime</dt><dd>Python ${esc(item.runtime.python)}</dd></div><div><dt>Hardware</dt><dd>${esc(item.hardware)}</dd></div></dl><div class="transport-tags">${item.transports.map((transport) => `<span>${esc(transport)}</span>`).join('')}</div>${installed.has(item.id) ? `<button class="button subtle open-server" data-id="${esc(item.id)}">Open installation</button>` : `<button class="button primary install-server" data-id="${esc(item.id)}" data-name="${esc(item.name)}">Install ${esc(item.name)}</button>`}</article>`).join('');
  content.innerHTML = `${pageHeader('Verified local packages', 'Catalog', 'Install capabilities without mixing dependencies or data.')}<section class="catalog-grid">${cards}</section>`;
}

async function renderServers() {
  const servers = await request('servers.list');
  const body = servers.length ? servers.map(serverRow).join('') : '<div class="empty-state"><strong>The fleet is empty</strong><span>Install the first MCP from the catalog.</span><button class="text-action nav-link" data-view="catalog">Browse catalog →</button></div>';
  content.innerHTML = `${pageHeader('Separated by design', 'Installed servers', 'Each server owns its environment, models, output, and runtime.', '<button class="button primary nav-link" data-view="catalog">Add server</button>')}<section class="panel server-list">${body}</section>`;
}

async function renderServer(packageId) {
  const data = await request('servers.get', { package_id: packageId });
  const item = data.package;
  const installation = data.installation;
  const connection = data.connection ? esc(JSON.stringify({ mcpServers: { [packageId]: data.connection } }, null, 2)) : '';
  let body;
  if (!installation) {
    body = `<section class="panel"><div class="empty-state"><strong>Not installed yet</strong><button class="button primary install-server" data-id="${esc(item.id)}" data-name="${esc(item.name)}">Install ${esc(item.name)}</button></div></section>`;
  } else {
    const supportsHttp = item.transports.includes('streamable-http');
    const transportAction = installation.transport === 'streamable-http'
      ? `<button class="button danger stop-http" data-id="${esc(item.id)}">Stop HTTP</button>`
      : supportsHttp ? `<button class="button primary start-http" data-id="${esc(item.id)}">Start HTTP</button>` : '<span class="muted">HTTP entry point unavailable</span>';
    body = `<section class="detail-grid"><div class="panel"><div class="section-head"><h2>Connect</h2><span>${esc(installation.transport)}</span></div><p class="muted">Add this entry to an MCP-compatible AI client.</p><div class="code-wrap"><button class="copy-config">Copy config</button><pre id="client-config">${connection}</pre></div></div><aside class="panel facts"><h2>Installation</h2><dl><div><dt>Version</dt><dd>${esc(installation.version)}</dd></div><div><dt>Environment</dt><dd>Isolated</dd></div><div><dt>Transport</dt><dd>${esc(installation.transport)}</dd></div>${installation.http_port ? `<div><dt>Local port</dt><dd>${installation.http_port}</dd></div>` : ''}</dl></aside></section><section class="panel action-panel"><div><h2>Transport</h2><p>Stdio starts from your AI client. HTTP remains active until you stop it.</p></div>${transportAction}</section>`;
  }
  content.innerHTML = `${pageHeader(item.category, item.name, item.description, `<span class="state-pill ${statusClass(data.runtime_status)}">${esc(data.runtime_status)}</span>`)}${body}`;
}

function renderBuilder() {
  content.innerHTML = `${pageHeader('Start with working protocol', 'MCP Builder', 'Generate a clean Python server with package metadata and a stdio entry point.')}<section class="builder-layout"><form class="panel build-form" id="builder-form"><label>Server name<input name="name" required minlength="2" placeholder="Research Notes"></label><label>What will it do?<textarea name="description" required rows="5" placeholder="Search and organize local research notes."></textarea></label><button class="button primary" type="submit">Generate project</button></form><aside class="panel recipe"><p class="eyebrow">Generated structure</p><pre>your-server/
├── pyproject.toml
├── README.md
└── src/
    └── your_server/
        ├── __init__.py
        └── server.py</pre><p>Projects stay inside OctopusMCP’s managed workspace.</p></aside></section>`;
}

async function navigate(view, id) {
  currentView = view;
  document.querySelectorAll('nav .nav-link').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  setBusy();
  try {
    if (view === 'overview') await renderOverview();
    if (view === 'catalog') await renderCatalog();
    if (view === 'servers') await renderServers();
    if (view === 'server') await renderServer(id);
    if (view === 'builder') renderBuilder();
    content.focus();
  } catch (error) {
    content.innerHTML = `<div class="failure"><strong>Could not load this view</strong><p>${esc(error.message)}</p><button class="button subtle retry">Try again</button></div>`;
  }
}

document.addEventListener('click', async (event) => {
  const nav = event.target.closest('.nav-link');
  if (nav) return navigate(nav.dataset.view);
  const open = event.target.closest('.open-server');
  if (open) return navigate('server', open.dataset.id);
  if (event.target.closest('.retry')) return navigate(currentView);
  const install = event.target.closest('.install-server');
  if (install) {
    if (!confirm(`Install ${install.dataset.name} in a new isolated environment?`)) return;
    setBusy(`Installing ${install.dataset.name}…`);
    try { await request('servers.install', { package_id: install.dataset.id }); notify(`${install.dataset.name} installed`); await navigate('server', install.dataset.id); }
    catch (error) { notify(error.message, true); await navigate('catalog'); }
    return;
  }
  const start = event.target.closest('.start-http');
  if (start) { try { await request('servers.http.start', { package_id: start.dataset.id }); notify('HTTP service started'); await navigate('server', start.dataset.id); } catch (error) { notify(error.message, true); } return; }
  const stop = event.target.closest('.stop-http');
  if (stop) { try { await request('servers.http.stop', { package_id: stop.dataset.id }); notify('HTTP service stopped'); await navigate('server', stop.dataset.id); } catch (error) { notify(error.message, true); } return; }
  if (event.target.closest('.copy-config')) { await navigator.clipboard.writeText(document.querySelector('#client-config').textContent); notify('Configuration copied'); }
});

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'builder-form') return;
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    const result = await request('builder.generate', { name: form.get('name'), description: form.get('description') });
    notify(`Project generated at ${result.path}`);
    event.target.reset();
  } catch (error) { notify(error.message, true); }
});

navigate('overview');

if (typeof module !== 'undefined') module.exports = { esc, statusClass };
