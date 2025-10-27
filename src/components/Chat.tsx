// Small chat UI component (temporary mock).
// Adds a simple message list and input. Replace the mock reply logic with a real backend or connect to the voice agent when ready.

import React, { useRef, useState } from "react";
import { useConversationContext } from "@/context/ConversationContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
};

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { sendText, conversation } = useConversationContext();

  // Derive a session id to send to the webhook for agent memory.
  // Prefer an id from the active conversation object; otherwise persist a generated id.
  const getSessionId = (): string => {
    // try common fields on SDK conversation objects
    const c: any = conversation;
    const maybe = c?.id || c?.sessionId || c?.conversationId || c?.session_id || c?.conversation_id;
    if (maybe) return String(maybe);

    // fallback: persistent client-side session id
    const KEY = "tavoc:session_id";
    let sid = localStorage.getItem(KEY);
    if (!sid) {
      sid = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 9);
      try {
        localStorage.setItem(KEY, sid);
      } catch (e) {
        // ignore storage errors
      }
    }
    return sid;
  };

  const send = async () => {
    if (!draft.trim()) return;
    const userMsg: Message = {
      id: String(Date.now()) + "-u",
      sender: "user",
      text: draft.trim(),
      time: new Date().toLocaleTimeString(),
    };

    // Optimistically add the user message and clear draft
    setMessages((s) => [...s, userMsg]);
    setDraft("");
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });

    // Dispatch outgoing event for Dashboard/telemetry
    try {
      window.dispatchEvent(new CustomEvent("tavoc:outgoing", { detail: { text: userMsg.text } }));
    } catch (e) {
      // ignore
    }

    setIsSending(true);
    try {
      // Try sending via conversation/context (best-effort)
      try {
        await sendText(userMsg.text);
      } catch (e) {
        console.warn("sendText failed", e);
      }

      // Post to the provided webhook and display the response (await the reply)
      const WEBHOOK = "https://ahmedgomaaseekers.app.n8n.cloud/webhook/6abf4300-8865-417e-820c-9eb5672d6319/chat";
      const sessionId = getSessionId();
      const res = await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg.text, sessionID: sessionId }),
      });

      let replyText = "";
      try {
        const data = await res.json();
  if (typeof data === "string") replyText = data;
  else if (data.output) replyText = data.output;
  else if (data.reply) replyText = data.reply;
  else if (data.message) replyText = data.message;
  else if (data.text) replyText = data.text;
        else replyText = JSON.stringify(data);
      } catch (e) {
        // not json — try plain text
        try {
          replyText = await res.text();
        } catch (er) {
          replyText = "(no response)";
        }
      }

      const botMsg: Message = {
        id: String(Date.now()) + "-b",
        sender: "bot",
        text: replyText || `No reply from webhook (status ${res.status})`,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((s) => [...s, botMsg]);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    } catch (err) {
      console.warn("Webhook call failed", err);
      // fallback echo
      const botMsg: Message = {
        id: String(Date.now()) + "-b",
        sender: "bot",
        text: `Echo: ${userMsg.text}`,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((s) => [...s, botMsg]);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    } finally {
      setIsSending(false);
    }
  };

  // Listen for incoming messages from the voice agent (published by VoiceAgent)
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail: any = (e as CustomEvent).detail;
      if (!detail || !detail.message) return;
      const payload = detail.message;
      const botMsg: Message = {
        id: String(Date.now()) + "-b",
        sender: "bot",
        text: payload.text ?? JSON.stringify(payload),
        time: new Date().toLocaleTimeString(),
      };
      setMessages((s) => [...s, botMsg]);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    };

    window.addEventListener("tavoc:message", handler as EventListener);
    return () => window.removeEventListener("tavoc:message", handler as EventListener);
  }, []);

  return (
    <div className="border border-input rounded-2xl p-4 bg-card shadow-card">
      <h3 className="text-lg font-semibold mb-3">Chat</h3>

      <div ref={listRef} className="max-h-60 overflow-y-auto space-y-3 p-2 mb-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Start the chat by sending a message.</p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-xl ${m.sender === "user" ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <div className="text-sm">{m.text}</div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{m.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." disabled={isSending} />
        <Button onClick={send} size="sm" disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default Chat;
