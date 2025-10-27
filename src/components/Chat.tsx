// Small chat UI component (temporary mock).
// Adds a simple message list and input. Replace the mock reply logic with a real backend or connect to the voice agent when ready.

import React, { useRef, useState } from "react";
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
  const listRef = useRef<HTMLDivElement | null>(null);

  const send = () => {
    if (!draft.trim()) return;
    const userMsg: Message = {
      id: String(Date.now()) + "-u",
      sender: "user",
      text: draft.trim(),
      time: new Date().toLocaleTimeString(),
    };

    setMessages((s) => [...s, userMsg]);
    setDraft("");

    // Mock bot reply (replace with real API call)
    setTimeout(() => {
      const botMsg: Message = {
        id: String(Date.now()) + "-b",
        sender: "bot",
        text: `Echo: ${userMsg.text}`,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((s) => [...s, botMsg]);
      // scroll to bottom
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 600);
  };

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
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
        <Button onClick={send} size="sm">
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chat;
