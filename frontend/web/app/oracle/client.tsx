"use client";

import { AlertCircle, Bot, RotateCcw, Send, Sparkles } from "lucide-react";
import { useRitual } from "@/lib/store";
import { useAsync, useForm } from "@/lib/hooks";
import { apiClient } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const OracleClient = () => {
  const { wallet, authToken, isConnected } = useRitual();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { execute: sendMessage, status } = useAsync(async (content: string) => {
    if (!wallet) throw new Error("Wallet not connected");

    const response = await apiClient.askOracle(content, wallet, authToken ?? undefined, conversationId ?? undefined);
    if (response.error) throw new Error(response.error);

    return response.data;
  }, false);

  const submitMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `${Date.now()}-u`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setError("");
    setLastFailed(null);

    try {
      const result = await sendMessage(trimmed);
      if (result?.conversationId && !conversationId) {
        setConversationId(result.conversationId);
      }
      const assistantMessage: Message = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: result?.message || "The Oracle is silent...",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reach the Oracle");
      setLastFailed(trimmed);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const form = useForm({ message: "" }, (values) => submitMessage(values.message));

  const retry = () => {
    if (lastFailed) submitMessage(lastFailed);
  };

  // Scroll only the message list itself — never the page — so the latest
  // reply and the composer stay in view instead of drifting off-screen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status, error]);

  return (
    <main className="relative mx-auto flex h-[calc(100dvh-169px)] max-w-4xl flex-col px-4 py-4 sm:px-6 md:h-[calc(100dvh-73px)] md:py-6">
      <header className="mb-4 flex shrink-0 items-center gap-3 fade-in">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-purple/40 bg-purple/10 text-purple shadow-purple">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-cipher text-[11px] uppercase tracking-[0.22em] text-muted">Divine Council</p>
          <h1 className="display-title text-aurora truncate text-2xl sm:text-3xl">The Oracle Speaks</h1>
        </div>
      </header>

      {!isConnected ? (
        <div className="rune-panel flex-1 space-y-4 border-orange-500/30 bg-orange-500/5 p-6 text-center">
          <p className="text-muted">Connect your wallet to commune with the oracle.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {/* Messages Container */}
          <div
            ref={scrollRef}
            className="rune-panel rune-panel--scroll relative min-h-0 flex-1 space-y-3 p-4 sm:p-6 fade-in-delay-1"
          >
            <div className="motion-lattice pointer-events-none absolute inset-x-6 top-4 h-16 opacity-35" aria-hidden="true" />
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted">
                <Bot className="size-8 text-purple/70" />
                <p className="oracle-pulse section-title text-aurora inline-block text-lg">The oracle awaits your inquiry...</p>
                <p className="max-w-sm text-xs">Ask about your class, your next quest, or what it takes to ascend.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 float-message ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-purple/40 bg-purple/10 text-purple">
                      <Bot className="size-3.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-2.5 sm:max-w-md ${
                      msg.role === "user"
                        ? "rounded-br-sm border-cyan/30 bg-cyan/10"
                        : "rounded-bl-sm border-purple/30 bg-purple/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
                    <p className="mt-1 text-right text-[10px] uppercase tracking-wide text-muted/70">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {status === "pending" && (
              <div className="flex items-end gap-2 justify-start">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-purple/40 bg-purple/10 text-purple">
                  <Bot className="size-3.5" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-purple/30 bg-purple/10 px-4 py-3">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: "160ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "320ms" }} />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-end gap-2 justify-start">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-red-500/40 bg-red-500/10 text-red-400">
                  <AlertCircle className="size-3.5" />
                </span>
                <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-red-500/30 bg-red-500/10 px-4 py-2.5 sm:max-w-md">
                  <p className="text-sm text-red-300">{error}</p>
                  {lastFailed && (
                    <button
                      type="button"
                      onClick={retry}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-red-100"
                    >
                      <RotateCcw className="size-3" /> Try again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={form.handleSubmit} className="rune-panel shrink-0 p-3 fade-in-delay-2 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                name="message"
                value={form.values.message}
                onChange={form.handleChange}
                placeholder="Ask the oracle..."
                className="detail-cell min-w-0 flex-1 rounded-full px-4 py-2.5 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                disabled={status === "pending"}
                maxLength={1000}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={status === "pending" || !form.values.message.trim()}
                className="rune-button grid size-11 shrink-0 place-items-center rounded-full button-press hover-lift disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-right text-[10px] text-muted">{form.values.message.length}/1000</p>
          </form>
        </div>
      )}
    </main>
  );
};
