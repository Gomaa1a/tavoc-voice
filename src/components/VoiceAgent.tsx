import { useConversation } from "@11labs/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useConversationContext } from "@/context/ConversationContext";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const VoiceAgent = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  
  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice agent connected");
      setIsConnecting(false);
      toast({
        title: "Connected",
        description: "Voice assistant is ready to help you learn!",
      });
    },
    onDisconnect: () => {
      console.log("Voice agent disconnected");
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error("Voice agent error:", error);
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to voice assistant. Please try again.",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      try {
        // push into the shared ConversationContext and dispatch DOM event for backward compat
        conversationContext.pushIncoming(message);
      } catch (e) {
        // fallback to DOM event if context not ready
        try {
          window.dispatchEvent(new CustomEvent("tavoc:message", { detail: { message } }));
        } catch (err) {
          // ignore
        }
      }
    },
  });

  const conversationContext = useConversationContext();

  // set the conversation into the shared context when the underlying object changes
  useEffect(() => {
    conversationContext.setConversation(conversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation]);

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the agent ID (WebSocket connection for public agents)
      await conversation.startSession({
        agentId: "agent_3601k8g6nqaxfx29qtpaj0kbammc",
        connectionType: "websocket",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
      
      if (error instanceof Error && error.name === "NotAllowedError") {
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use the voice assistant.",
          variant: "destructive",
        });
      }
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

  const isActive = conversation.status === "connected";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Voice visualizer */}
      <div className="relative">
        <div 
          className={`
            w-48 h-48 rounded-full bg-gradient-primary 
            flex items-center justify-center
            transition-all duration-500
            ${isActive ? 'shadow-glow animate-pulse-glow' : 'shadow-card'}
            ${conversation.isSpeaking ? 'scale-110' : 'scale-100'}
          `}
        >
          <div className="w-44 h-44 rounded-full bg-card flex items-center justify-center">
            {isConnecting ? (
              <Loader2 className="w-20 h-20 text-primary animate-spin" />
            ) : isActive ? (
              <Mic className="w-20 h-20 text-primary" />
            ) : (
              <MicOff className="w-20 h-20 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {/* Animated rings when speaking */}
        {conversation.isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" style={{ animationDelay: '0.2s' }} />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-2xl font-semibold text-foreground mb-2">
          {isConnecting ? "Connecting..." : 
           isActive ? (conversation.isSpeaking ? "Listening..." : "Ready to chat") : 
           "Start a conversation"}
        </p>
        <p className="text-muted-foreground">
          {isActive ? "Speak naturally and I'll assist you" : "Click the button below to begin"}
        </p>
      </div>

      {/* Control button */}
      <Button
        size="lg"
        onClick={isActive ? endConversation : startConversation}
        disabled={isConnecting}
        className={`
          px-8 py-6 text-lg font-semibold rounded-full
          transition-all duration-300
          ${isActive 
            ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
            : 'bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow'
          }
        `}
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : isActive ? (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            End Conversation
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Start Conversation
          </>
        )}
      </Button>
    </div>
  );
};
