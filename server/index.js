import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://ahmedgomaaseekers.app.n8n.cloud/webhook/c0ddafb0-ea84-4585-8d42-d4ce91d15980';
const AUDIO_URL = process.env.AUDIO_URL || 'https://ahmedgomaaseekers.app.n8n.cloud/webhook/get-audio?conversation_id=';

// Simple in-memory cache for /api/calls responses to reduce load
const CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS ?? 30); // seconds
let cache = { ts: 0, data: null };

function normalizeItem(raw) {
  const id = raw.id ?? raw.conversation_id ?? raw.conversationId ?? raw.conversation ?? raw._id ?? null;
  const timeRaw = raw.started_at ?? raw.created_at ?? raw.timestamp ?? raw.call_start_unix ?? raw.call_start ?? raw.start_time ?? raw.time ?? null;
  let time = '-';
  if (typeof timeRaw === 'number') {
    time = timeRaw > 1e9 ? new Date(timeRaw * 1000).toLocaleString() : new Date(timeRaw).toLocaleString();
  } else if (typeof timeRaw === 'string') {
    if (/^\d{10,}$/.test(timeRaw)) time = new Date(Number(timeRaw) * 1000).toLocaleString();
    else {
      const parsed = Date.parse(timeRaw);
      time = isNaN(parsed) ? timeRaw : new Date(parsed).toLocaleString();
    }
  }
  const from = raw.from ?? raw.caller ?? raw.caller_number ?? raw.source ?? raw.from_number ?? raw.from_name ?? '-';
  const to = raw.to ?? raw.agent ?? raw.callee_number ?? raw.destination ?? raw.to_name ?? '-';
  const duration = raw.duration ?? raw.length_seconds ?? raw.call_duration ?? raw.duration_seconds ?? raw.length ?? '-';
  return { id, time, from, to, duration };
}

function normalizeResponse(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(normalizeItem);
  if (Array.isArray(data.items)) return data.items.map(normalizeItem);
  if (Array.isArray(data.results)) return data.results.map(normalizeItem);
  if (Array.isArray(data.conversations)) return data.conversations.map(normalizeItem);
  for (const k of Object.keys(data)) {
    if (Array.isArray(data[k])) return data[k].map(normalizeItem);
  }
  return [normalizeItem(data)];
}

app.get('/api/calls', async (req, res) => {
  try {
    // Simple cache check
    const now = Date.now();
    if (cache.data && (now - cache.ts) / 1000 < CACHE_TTL) {
      return res.json(cache.data);
    }

    // Forward GET to configured webhook (n8n may not return history; this is best-effort)
    const url = new URL(WEBHOOK_URL);
    // copy query params
    Object.entries(req.query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const resp = await fetch(url.toString(), { method: 'GET' });
    if (!resp.ok) return res.status(resp.status).send(await resp.text());
    const data = await resp.json();
    const items = normalizeResponse(data);
    // update cache
    cache = { ts: Date.now(), data: items };
    res.json(items);
  } catch (e) {
    console.error('GET /api/calls error', e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.post('/api/run', async (req, res) => {
  try {
    const body = req.body ?? {};
    const resp = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!resp.ok) return res.status(resp.status).send(await resp.text());
    const data = await resp.json();
    const items = normalizeResponse(data);
    res.json(items);
  } catch (e) {
    console.error('POST /api/run error', e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.get('/api/audio/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).send('missing id');
    const url = AUDIO_URL + encodeURIComponent(id);
    const resp = await fetch(url);
    if (!resp.ok) return res.status(resp.status).send(await resp.text());
    // forward headers
    resp.headers.forEach((v, k) => res.setHeader(k, v));
    resp.body.pipe(res);
  } catch (e) {
    console.error('GET /api/audio error', e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT} — WEBHOOK=${WEBHOOK_URL}`));
