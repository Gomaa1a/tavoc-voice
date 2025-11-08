// Dashboard for showing recent call/chat events.
// Listens to window events fired by VoiceAgent and Chat and stores entries in localStorage.

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Webhook to display on the dashboard (configured by the user request)
const DEFAULT_WEBHOOK = "https://ahmedgomaaseekers.app.n8n.cloud/webhook/c0ddafb0-ea84-4585-8d42-d4ce91d15980";

const WebhookPanel: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard");
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setStatus("Copy failed");
      setTimeout(() => setStatus(null), 2000);
    }
  };

  // Sends a request to the webhook to fetch a list or notify; here it's a ping for demo
  const ping = async () => {
    setSending(true);
    try {
      const res = await fetch(DEFAULT_WEBHOOK, { method: "GET" });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setStatus("Webhook reachable");
    } catch (e) {
      setStatus("Webhook call failed");
    } finally {
      setSending(false);
      setTimeout(() => setStatus(null), 2500);
    }
  };

  return (
    <div className="mb-4 px-3 py-2 rounded-md bg-muted/40 border">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm break-all">Webhook: <a className="text-primary underline" href={DEFAULT_WEBHOOK} target="_blank" rel="noreferrer">{DEFAULT_WEBHOOK}</a></div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => copy(DEFAULT_WEBHOOK)} disabled={sending}>Copy</Button>
          <Button size="sm" variant="outline" onClick={ping} disabled={sending}>{sending ? "Pinging..." : "Ping"}</Button>
        </div>
      </div>
      {status && <div className="text-xs text-muted-foreground mt-2">{status}</div>}
    </div>
  );
};

type Entry = {
  id: string;
  kind: "outgoing" | "incoming";
  source: "voice" | "chat" | "unknown";
  text: string;
  time: string;
};

const STORAGE_KEY = "tavoc:call_dashboard";

export const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Remote calls fetched from ElevenLabs convai API
  const [remoteCalls, setRemoteCalls] = useState<any[] | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const fetchRemoteCalls = async (params?: {
    call_successful?: string;
    user_id?: string;
    agent_id?: string;
    summary_mode?: string;
    call_start_after_unix?: string | number;
    call_start_before_unix?: string | number;
  }) => {
    setRemoteLoading(true);
    setRemoteError(null);
    try {
      const url = new URL("https://api.elevenlabs.io/v1/convai/conversations");
      const search = new URLSearchParams();
      // apply params or defaults like the curl example
      search.set("call_successful", params?.call_successful ?? "");
      search.set("user_id", params?.user_id ?? "");
      search.set("agent_id", params?.agent_id ?? "");
      search.set("summary_mode", params?.summary_mode ?? "exclude");
      search.set("call_start_after_unix", String(params?.call_start_after_unix ?? 0));
      search.set("call_start_before_unix", String(params?.call_start_before_unix ?? 0));
      url.search = search.toString();

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          // NOTE: the API key was provided in the request; it's used client-side here.
          "xi-api-key": "2d5356ea7439972c34803fd55b65183667d163ee2b0ad8a2e5117ee445d05f0a",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Status ${res.status} ${text}`);
      }
      const data = await res.json();
      // Expecting an array or an object with results; normalize to array
      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.results)) items = data.results;
      else if (Array.isArray(data.conversations)) items = data.conversations;
      else items = [data];
      setRemoteCalls(items);
    } catch (e: any) {
      console.error("fetchRemoteCalls error", e);
      setRemoteError(String(e?.message ?? e));
      setRemoteCalls(null);
    } finally {
      setRemoteLoading(false);
    }
  };

  useEffect(() => {
    const onIncoming = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      const msg = detail?.message ?? detail;
      const text = msg?.text ?? JSON.stringify(msg ?? "") ;
      const entry: Entry = {
        id: String(Date.now()) + "-in",
        kind: "incoming",
        source: "voice",
        text,
        time: new Date().toLocaleString(),
      };
      setEntries((s) => [entry, ...s].slice(0, 200));
    };

    const onOutgoing = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      const text = detail?.text ?? JSON.stringify(detail ?? "");
      const entry: Entry = {
        id: String(Date.now()) + "-out",
        kind: "outgoing",
        source: "chat",
        text,
        time: new Date().toLocaleString(),
      };
      setEntries((s) => [entry, ...s].slice(0, 200));
    };

    window.addEventListener("tavoc:message", onIncoming as EventListener);
    window.addEventListener("tavoc:outgoing", onOutgoing as EventListener);

    return () => {
      window.removeEventListener("tavoc:message", onIncoming as EventListener);
      window.removeEventListener("tavoc:outgoing", onOutgoing as EventListener);
    };
  }, []);

  const clear = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setEntries(raw ? JSON.parse(raw) : []);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="p-4 bg-card border border-input rounded-2xl shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Calls & Messages Dashboard</h3>
        <div className="flex items-center gap-2">
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={clear}
            title="Clear history"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Webhook display and actions */}
      <WebhookPanel />

      <div className="mb-3 flex items-center gap-2">
        <Button size="sm" onClick={refreshLocal}>Refresh Local</Button>
        <Button size="sm" onClick={() => fetchRemoteCalls()}>{remoteLoading ? "Loading..." : "Fetch Remote Calls"}</Button>
        {remoteError && <div className="text-xs text-destructive">{remoteError}</div>}
      </div>

      {/* Local entries table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="p-2 w-24">Time</th>
              <th className="p-2">Type</th>
              <th className="p-2">Source</th>
              <th className="p-2">Text</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={4} className="p-2 text-sm text-muted-foreground">No local calls/messages.</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2 text-xs">{e.time}</td>
                  <td className="p-2 text-sm">{e.kind}</td>
                  <td className="p-2 text-sm">{e.source}</td>
                  <td className="p-2 text-sm break-words whitespace-pre-wrap">{e.text}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Remote calls table */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Remote Calls</h4>
        {remoteLoading && <div className="text-sm text-muted-foreground mb-2">Loading remote calls…</div>}
        {remoteCalls == null ? (
          <div className="text-sm text-muted-foreground">No remote data loaded. Click "Fetch Remote Calls".</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-2 w-28">ID</th>
                  <th className="p-2 w-32">User</th>
                  <th className="p-2 w-32">Agent</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">Successful</th>
                  <th className="p-2">Summary / Raw</th>
                </tr>
              </thead>
              <tbody>
                {remoteCalls.map((c: any, idx: number) => (
                  <tr key={c.id ?? idx} className="border-t">
                    <td className="p-2 text-xs">{c.id ?? c.conversation_id ?? c.conversationId ?? "-"}</td>
                    <td className="p-2 text-sm">{c.user_id ?? c.userId ?? c.user ?? "-"}</td>
                    <td className="p-2 text-sm">{c.agent_id ?? c.agentId ?? c.agent ?? "-"}</td>
                    <td className="p-2 text-sm">{c.call_start_unix ? new Date(c.call_start_unix * 1000).toLocaleString() : (c.call_start ? String(c.call_start) : "-")}</td>
                    <td className="p-2 text-sm">{String(c.call_successful ?? c.success ?? "-")}</td>
                    <td className="p-2 text-sm break-words whitespace-pre-wrap">{c.summary ?? c.summary_text ?? JSON.stringify(c).slice(0, 400)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
