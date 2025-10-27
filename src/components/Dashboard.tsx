// Dashboard for showing recent call/chat events.
// Listens to window events fired by VoiceAgent and Chat and stores entries in localStorage.

import React, { useEffect, useState } from "react";

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

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calls or messages recorded yet.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="p-3 rounded-lg bg-background border">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {e.kind === "incoming" ? "Response" : "Request"} • {e.source}
                </div>
                <div className="text-xs text-muted-foreground">{e.time}</div>
              </div>
              <div className="mt-2 text-sm text-foreground whitespace-pre-wrap">{e.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
