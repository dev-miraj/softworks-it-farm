import { useState, useRef, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Bot, MessageSquare, Send, RefreshCw, Loader2, ChevronRight, Trash2, Sparkles } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "");

interface ConvSummary { id: number; title: string; createdAt: string; }
interface Msg { id: number; conversationId: number; role: string; content: string; createdAt: string; }
interface ConvDetail extends ConvSummary { messages: Msg[]; }

async function* streamMessage(conversationId: number, content: string): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/api/openai/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.done) return;
          if (d.content) yield d.content;
        } catch { /**/ }
      }
    }
  }
}

export function AiChatAdminPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [streamingMessages, setStreamingMessages] = useState<{ role: string; content: string; streaming?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchList } = useQuery<ConvSummary[]>({
    queryKey: ["ai-conversations"],
    queryFn: () => fetch(`${BASE_URL}/api/openai/conversations`).then(r => r.json()),
  });

  const { data: detail, refetch: refetchDetail } = useQuery<ConvDetail>({
    queryKey: ["ai-conversation", selectedId],
    queryFn: () => fetch(`${BASE_URL}/api/openai/conversations/${selectedId}`).then(r => r.json()),
    enabled: !!selectedId,
  });

  useEffect(() => {
    if (detail) {
      setStreamingMessages(detail.messages.map(m => ({ role: m.role, content: m.content })));
    } else {
      setStreamingMessages([]);
    }
  }, [detail]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [streamingMessages]);

  const createNewConversation = async () => {
    const res = await fetch(`${BASE_URL}/api/openai/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Admin Chat ${new Date().toLocaleTimeString()}` }),
    });
    const conv: ConvSummary = await res.json();
    await refetchList();
    setSelectedId(conv.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedId || sending) return;
    const text = input;
    setInput("");
    setSending(true);
    const botMsg = { role: "assistant", content: "", streaming: true };
    setStreamingMessages(prev => [...prev, { role: "user", content: text }, botMsg]);
    try {
      for await (const chunk of streamMessage(selectedId, text)) {
        setStreamingMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      }
      setStreamingMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) updated[updated.length - 1] = { ...last, streaming: false };
        return updated;
      });
      refetchDetail();
      refetchList();
    } finally {
      setSending(false);
    }
  };

  const isStreaming = streamingMessages.some(m => m.streaming);

  return (
    <AdminLayout>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-1 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm">Chat with SOFTWORKS AI · {conversations?.length ?? 0} conversations</p>
        </div>
        <Button onClick={createNewConversation} className="bg-primary hover:bg-primary/90 gap-2">
          <MessageSquare className="w-4 h-4" />New Chat
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar - conversations list */}
        <div className="w-64 shrink-0 gradient-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/10 shrink-0">
            <h3 className="font-semibold text-sm text-foreground">Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {!conversations?.length && (
              <div className="text-center py-8 text-muted-foreground text-xs px-4">
                No conversations yet.<br />Start a new chat above.
              </div>
            )}
            {conversations?.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/20 flex items-center gap-2 hover:bg-white/3 transition-colors ${selectedId === c.id ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
              >
                <Bot className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 gradient-border rounded-xl flex flex-col overflow-hidden min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">SOFTWORKS AI Assistant</h3>
                <p className="text-sm text-muted-foreground max-w-xs">Select an existing conversation or start a new one to chat with the AI.</p>
              </div>
              <Button onClick={createNewConversation} variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />Start New Chat
              </Button>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">SOFTWORKS AI</div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                  </div>
                </div>
                <button onClick={refetchDetail} className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                {streamingMessages.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No messages yet. Say hello!</div>
                )}
                {streamingMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
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

              {/* Input */}
              <div className="px-4 pb-4 pt-3 border-t border-border/30 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask SOFTWORKS AI..."
                    disabled={sending || isStreaming}
                    className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors text-foreground placeholder:text-muted-foreground/50 disabled:opacity-50 max-h-32"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending || isStreaming}
                    size="icon"
                    className="w-9 h-9 rounded-xl shrink-0"
                  >
                    {sending || isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
