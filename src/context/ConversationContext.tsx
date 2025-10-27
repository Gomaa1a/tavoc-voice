import React, { createContext, useContext, useState } from "react";

type ConversationLike = any;

type ContextValue = {
  conversation: ConversationLike | null;
  setConversation: (c: ConversationLike | null) => void;
  sendText: (text: string) => Promise<void>;
  pushIncoming: (message: any) => void;
};

const ConversationContext = createContext<ContextValue | undefined>(undefined);

export const ConversationProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [conversation, setConversation] = useState<ConversationLike | null>(null);

  const sendText = async (text: string) => {
    if (!conversation) {
      // publish outgoing event for dashboard fallback
      window.dispatchEvent(new CustomEvent("tavoc:outgoing", { detail: { text } }));
      return;
    }

    try {
      if (typeof conversation.send === "function") {
        await conversation.send({ text });
      } else if (typeof conversation.sendMessage === "function") {
        await conversation.sendMessage(text);
      } else if (typeof conversation.sendText === "function") {
        await conversation.sendText(text);
      } else if (typeof conversation.startSession === "function") {
        // Some SDKs may accept a message driver; fallback to dispatching an event.
        window.dispatchEvent(new CustomEvent("tavoc:outgoing", { detail: { text } }));
      } else {
        window.dispatchEvent(new CustomEvent("tavoc:outgoing", { detail: { text } }));
      }
    } catch (e) {
      console.warn("Conversation send failed, falling back to outgoing event", e);
      window.dispatchEvent(new CustomEvent("tavoc:outgoing", { detail: { text } }));
    }
  };

  const pushIncoming = (message: any) => {
    // allow other parts of the app to listen via DOM event too
    try {
      window.dispatchEvent(new CustomEvent("tavoc:message", { detail: { message } }));
    } catch (e) {
      // ignore
    }
  };

  return (
    <ConversationContext.Provider value={{ conversation, setConversation, sendText, pushIncoming }}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversationContext must be used within ConversationProvider");
  return ctx;
};

export default ConversationContext;
