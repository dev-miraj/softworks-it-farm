import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minimize2, Maximize2, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useCreateConversation } from "@workspace/api-client-react";
import { Button } from "./ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

import { API as API_BASE } from "@/lib/apiUrl";

async function* streamMessage(conversationId: number, content: string): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/api/openai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.done) return;
          if (data.content) yield data.content;
        } catch {/* ignore malformed lines */}
      }
    }
  }
}

const WELCOME_MSG: Message = {
  role: "assistant",
  content: "Hi! I'm the SOFTWORKS AI assistant 👋\n\nI can help you learn about our services, technologies, pricing, and more. What would you like to know?",
};

const SUGGESTIONS = [
  "What services do you offer?",
  "How much does it cost?",
  "What tech stack do you use?",
  "How do I start a project?",
];

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const createConversation = useCreateConversation();
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    const conv = await createConversation.mutateAsync({ data: { title: "Website Chat" } });
    setConversationId(conv.id);
    return conv.id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const userMsg: Message = { role: "user", content: text };
    const botMsg: Message = { role: "assistant", content: "", streaming: true };
    setMessages(prev => [...prev, userMsg, botMsg]);

    try {
      const convId = await ensureConversation();
      for await (const chunk of streamMessage(convId, text)) {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      }
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) updated[updated.length - 1] = { ...last, streaming: false };
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = { ...last, content: "Sorry, I encountered an error. Please try again.", streaming: false };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME_MSG]);
    setConversationId(null);
  };

  const isStreaming = messages.some(m => m.streaming);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setMinimized(false); setPulse(false); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-primary/40 ${open ? "hidden" : "flex"}`}
        aria-label="Open AI Chat"
      >
        <Sparkles className="w-6 h-6" />
        {pulse && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-400 border-2 border-background animate-bounce" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${minimized ? "h-14" : "h-[540px]"}`}
          style={{ boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 rounded-t-2xl bg-primary/5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-sm">SOFTWORKS AI</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetChat} title="New chat" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setMinimized(m => !m)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/60 text-foreground border border-border/30 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                      {msg.streaming && !msg.content && (
                        <span className="inline-flex gap-1 items-center py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick suggestions - show only at start */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-primary/20 text-primary/80 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-4 pb-4 shrink-0 border-t border-border/30 pt-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={loading || isStreaming}
                    className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 max-h-24"
                    style={{ lineHeight: "1.5" }}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading || isStreaming}
                    size="icon"
                    className="w-9 h-9 rounded-xl shrink-0"
                  >
                    {loading || isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/40 mt-1.5 text-center">AI can make mistakes — verify important info.</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
