// Dashboard removed per user request; provide a minimal placeholder to keep routing stable.
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const RUN_WEBHOOK_URL = "/api/calls";
const RUN_WEBHOOK_RUN = "/api/run";
const AUDIO_ENDPOINT = "/api/audio/";

type RawAny = any;
type CallRow = { id: string | null; time: string; from: string; to: string; duration: string | number };

const normalizeItem = (raw: RawAny): CallRow => {
  const id = raw.id ?? raw.conversation_id ?? raw.conversationId ?? raw.conversation ?? raw._id ?? null;
  const timeRaw = raw.started_at ?? raw.created_at ?? raw.timestamp ?? raw.call_start_unix ?? raw.call_start ?? raw.start_time ?? raw.time ?? null;
  let time = "-";
  if (typeof timeRaw === "number") {
    // if unix seconds
    time = timeRaw > 1e9 ? new Date(timeRaw * 1000).toLocaleString() : new Date(timeRaw).toLocaleString();
  } else if (typeof timeRaw === "string") {
    if (/^\d{10,}$/.test(timeRaw)) time = new Date(Number(timeRaw) * 1000).toLocaleString();
    else {
      const parsed = Date.parse(timeRaw);
      time = isNaN(parsed) ? timeRaw : new Date(parsed).toLocaleString();
    }
  }

  const from = raw.from ?? raw.caller ?? raw.caller_number ?? raw.source ?? raw.from_number ?? raw.from_name ?? "-";
  const to = raw.to ?? raw.agent ?? raw.callee_number ?? raw.destination ?? raw.to_name ?? "-";
  const duration = raw.duration ?? raw.length_seconds ?? raw.call_duration ?? raw.duration_seconds ?? raw.length ?? "-";

  return { id, time, from, to, duration };
};

const normalizeResponse = (data: RawAny): CallRow[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(normalizeItem);
  if (Array.isArray(data.items)) return data.items.map(normalizeItem);
  if (Array.isArray(data.results)) return data.results.map(normalizeItem);
  if (Array.isArray(data.conversations)) return data.conversations.map(normalizeItem);
  for (const k of Object.keys(data)) {
    if (Array.isArray(data[k])) return data[k].map(normalizeItem);
  }
  return [normalizeItem(data)];
};

export const Dashboard: React.FC = () => {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const playerRef = useRef<HTMLAudioElement | null>(null);

  const setStatusMsg = (msg: string | null, error = false) => {
    setStatus(msg ? (error ? `Error: ${msg}` : msg) : null);
    if (msg) {
      setTimeout(() => setStatus(null), 4000);
    }
  };

  const fetchCalls = async () => {
    setLoading(true);
    setStatusMsg('Loading...');
    try {
      const res = await fetch(RUN_WEBHOOK_URL, { method: 'GET', cache: 'no-cache' });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      // server already returns normalized rows
      setRows(data ?? []);
      setStatusMsg(`Loaded ${Array.isArray(data) ? data.length : 0} rows`);
    } catch (e: any) {
      console.error(e);
      setStatusMsg(String(e?.message ?? e), true);
    } finally {
      setLoading(false);
    }
  };

  const runWebhookTest = async () => {
    setLoading(true);
    setStatusMsg('Running webhook test...');
    try {
      const res = await fetch(RUN_WEBHOOK_RUN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setRows(data ?? []);
      setStatusMsg(`Webhook returned ${Array.isArray(data) ? data.length : 0} rows`);
    } catch (e: any) {
      console.error(e);
      setStatusMsg(String(e?.message ?? e), true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchCalls();
  }, []);

  const playAudio = (id: string | null) => {
    if (!id) { setStatusMsg('No conversation id for this row', true); return; }
    if (!playerRef.current) return;
    playerRef.current.src = AUDIO_ENDPOINT + encodeURIComponent(String(id));
    playerRef.current.play().catch(e => setStatusMsg(String(e?.message ?? e), true));
  };

  return (
    <div className="p-4 bg-card border border-input rounded-2xl shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Calls Dashboard</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={fetchCalls} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
          <Button size="sm" variant="outline" onClick={runWebhookTest} disabled={loading}>Run Webhook Test</Button>
        </div>
      </div>

      {status && <div className="mb-3 text-sm text-muted-foreground">{status}</div>}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="p-2 w-40">Time</th>
              <th className="p-2">From</th>
              <th className="p-2">To</th>
              <th className="p-2 w-28">Duration</th>
              <th className="p-2 w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="p-2 text-sm text-muted-foreground">No calls found.</td></tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={(r.id ?? idx) as any} className="border-t">
                  <td className="p-2 text-xs">{r.time}</td>
                  <td className="p-2 text-sm break-words">{r.from}</td>
                  <td className="p-2 text-sm break-words">{r.to}</td>
                  <td className="p-2 text-sm">{String(r.duration)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => playAudio(r.id)}>{'Play'}</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <audio ref={playerRef} id="dashboard-audio" controls style={{ width: '100%' }} />
      </div>
    </div>
  );
};

export default Dashboard;
