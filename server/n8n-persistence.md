n8n persistence (quick guide)

Goal
- Save incoming webhook events to a persistent store so the Dashboard can query history.

Recommended minimal setup
1) Storage options (pick one):
   - Google Sheets (easy to view/edit)
   - Airtable (simple schema + UI)
   - Postgres (recommended for production)
   - S3 / object store (append JSON files)

2) n8n workflow (high-level)
   - Trigger: "Webhook" node (your existing webhook URL)
   - Next: Parse & map fields node (Function or Set node) to shape the record: {id, started_at, from, to, duration, raw}
   - Next: Storage node (e.g., Google Sheets -> Append Row, Airtable -> Create Record, Postgres -> INSERT)
   - Optionally: HTTP Request node to notify downstream systems

3) Expose a read endpoint (two choices):
   A) Create a second n8n workflow with an "HTTP Request" node that reads from the same storage and returns JSON when called (requires storage that supports read via API, like Postgres, Sheets, Airtable).
   B) Use the Express proxy (this repo) to read the storage directly (recommended). Update `server/index.js` to query the DB or Airtable instead of forwarding to the webhook trigger.

Example mapping (Function node) — pseudo-code
// map incoming payload to common shape
const payload = $json;
return [{
  json: {
    id: payload.id ?? payload.conversation_id ?? payload.conversationId,
    started_at: payload.started_at ?? payload.created_at ?? payload.timestamp,
    from: payload.from ?? payload.caller ?? payload.caller_number,
    to: payload.to ?? payload.agent ?? payload.callee_number,
    duration: payload.duration ?? payload.length_seconds ?? payload.call_duration,
    raw: payload
  }
}];

Notes
- If you write to Postgres, create a simple table:
  CREATE TABLE calls (id TEXT PRIMARY KEY, started_at TIMESTAMP, from_text TEXT, to_text TEXT, duration TEXT, raw JSONB);
- n8n has built-in nodes for Google Sheets, Airtable, and Postgres. Use the appropriate credentials node.
- After storage is configured, update `server/index.js` to fetch rows from the storage instead of polling the webhook trigger.

If you want, I can generate a starter n8n workflow JSON export (with Set/Function + Google Sheets/Postgres node) for the storage type you pick. Tell me which storage you prefer (Google Sheets, Airtable, Postgres, S3).