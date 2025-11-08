// webhook-viewer-main.js
// Plain JS viewer: fetches the webhook-test endpoint, normalizes shapes and renders a table.

const ENDPOINT = 'https://ahmedgomaaseekers.app.n8n.cloud/webhook-test/c0ddafb0-ea84-4585-8d42-d4ce91d15980';
const AUDIO_ENDPOINT = 'https://ahmedgomaaseekers.app.n8n.cloud/webhook/get-audio?conversation_id=';

function el(id) { return document.getElementById(id); }

function setStatus(msg, isError=false) {
  const s = el('status');
  s.textContent = msg;
  s.className = isError ? 'error' : 'muted';
}

function normalizeItem(raw) {
  // Map possible field names into a consistent shape:
  // id, started_at, from, to, duration
  const id = raw.id ?? raw.conversation_id ?? raw.conversationId ?? raw.conversation ?? raw._id ?? null;
  const time = raw.started_at ?? raw.created_at ?? raw.timestamp ?? raw.call_start_unix ?? raw.call_start ?? raw.start_time ?? null;
  // If unix timestamp in seconds: detect numeric large numbers
  let timeISO = null;
  if (typeof time === 'number') {
    // if it's likely unix seconds (>= 1e9), convert
    if (time > 1e9) timeISO = new Date(time * 1000).toLocaleString();
    else timeISO = new Date(time).toLocaleString();
  } else if (typeof time === 'string' && time.match(/^\d{10,}$/)) {
    timeISO = new Date(Number(time) * 1000).toLocaleString();
  } else if (typeof time === 'string') {
    const parsed = Date.parse(time);
    timeISO = isNaN(parsed) ? time : new Date(parsed).toLocaleString();
  }

  const from = raw.from ?? raw.caller ?? raw.caller_number ?? raw.source ?? raw.from_number ?? raw.from_name ?? '-';
  const to = raw.to ?? raw.agent ?? raw.callee_number ?? raw.destination ?? raw.to_name ?? '-';
  const duration = raw.duration ?? raw.length_seconds ?? raw.call_duration ?? raw.duration_seconds ?? raw.length ?? '-';

  return { id, time: timeISO ?? '-', from, to, duration };
}

function clearTable() {
  const tbody = el('callsTable').querySelector('tbody');
  tbody.innerHTML = '';
}

function renderRows(items) {
  const tbody = el('callsTable').querySelector('tbody');
  clearTable();
  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted small">No calls found.</td></tr>';
    return;
  }

  items.forEach(item => {
    const row = document.createElement('tr');

    const timeTd = document.createElement('td');
    timeTd.textContent = item.time ?? '-';
    timeTd.className = 'nowrap';

    const fromTd = document.createElement('td');
    fromTd.textContent = item.from ?? '-';

    const toTd = document.createElement('td');
    toTd.textContent = item.to ?? '-';

    const durTd = document.createElement('td');
    durTd.textContent = item.duration != null ? String(item.duration) : '-';
    durTd.className = 'nowrap';

    const actionTd = document.createElement('td');

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
    playBtn.onclick = () => {
      if (!item.id) {
        setStatus('No conversation id for this row', true);
        return;
      }
      const player = el('player');
      player.src = AUDIO_ENDPOINT + encodeURIComponent(item.id);
      player.play().catch(err => {
        console.warn('play failed', err);
        setStatus('Playback failed: ' + (err?.message ?? err), true);
      });
    };

    actionTd.appendChild(playBtn);

    row.appendChild(timeTd);
    row.appendChild(fromTd);
    row.appendChild(toTd);
    row.appendChild(durTd);
    row.appendChild(actionTd);

    tbody.appendChild(row);
  });
}

function normalizeResponse(data) {
  // Accept data as [ ... ] or { items: [...] } or { results: [...] }
  if (!data) return [];
  if (Array.isArray(data)) return data.map(normalizeItem);
  if (Array.isArray(data.items)) return data.items.map(normalizeItem);
  if (Array.isArray(data.results)) return data.results.map(normalizeItem);
  if (Array.isArray(data.conversations)) return data.conversations.map(normalizeItem);
  // fallback: try to find a top-level array-like
  for (const k of Object.keys(data)) {
    if (Array.isArray(data[k])) return data[k].map(normalizeItem);
  }
  // single object
  return [normalizeItem(data)];
}

async function fetchAndRender() {
  setStatus('Loading...');
  try {
    const res = await fetch(ENDPOINT, { method: 'GET', cache: 'no-cache' });
    if (!res.ok) throw new Error('Network response was not ok: ' + res.status);
    const data = await res.json();
    const items = normalizeResponse(data);
    renderRows(items);
    setStatus('Loaded ' + items.length + ' rows');
  } catch (err) {
    console.error(err);
    setStatus('Fetch failed: ' + (err?.message ?? err), true);
  }
}

async function runWebhookTestAndRender() {
  setStatus('Running webhook test...');
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    if (!res.ok) throw new Error('Webhook run failed: ' + res.status);
    const data = await res.json();
    const items = normalizeResponse(data);
    renderRows(items);
    setStatus('Webhook returned ' + items.length + ' rows');
  } catch (err) {
    console.error(err);
    setStatus('Webhook run failed: ' + (err?.message ?? err), true);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  el('refreshBtn').addEventListener('click', fetchAndRender);
  el('runTestBtn').addEventListener('click', runWebhookTestAndRender);

  // initial load
  fetchAndRender();
});
