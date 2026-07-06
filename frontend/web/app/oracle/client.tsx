"use client";

import { Send } from "lucide-react";
import { useRitual } from "@/lib/store";
import { useAsync, useForm } from "@/lib/hooks";
import { apiClient } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { LoadingSpinner, Toast } from "@/lib/components";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export const OracleClient = () => {
  const { wallet, authToken, isConnected } = useRitual();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { execute: sendMessage, status } = useAsync(async (content: string) => {
    if (!wallet) throw new Error("Wallet not connected");

    const response = await apiClient.askOracle(content, wallet, authToken ?? undefined, conversationId ?? undefined);
    if (response.error) throw new Error(response.error);

    return response.data;
  }, false);

  const form = useForm(
    { message: "" },
    async (values) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: values.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setError("");

      try {
        const result = await sendMessage(values.message);
        if (result?.conversationId && !conversationId) {
          setConversationId(result.conversationId);
        }
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result?.message || "The Oracle is silent...",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reach the Oracle");
        setMessages((prev) => prev.slice(0, -1));
      }
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, status]);

  return (
    <main className="art-surface art-surface--visible relative mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl flex-col px-4 py-8 sm:px-6">
      <header className="relative z-10 mb-8 fade-in">
        <p className="text-cipher text-xs uppercase tracking-[0.22em]">Divine Council</p>
        <h1 className="display-title text-aurora mt-2 text-4xl slide-up">The Oracle Speaks</h1>
        <p className="copy-muted mt-3 max-w-2xl">
          Seek guidance from the mystic oracle. Ask questions about your journey, the realms, or your ritual
          progression.
        </p>
      </header>

      {!isConnected ? (
        <div className="rune-panel relative z-10 space-y-4 border-orange-500/30 bg-orange-500/5 p-6 text-center">
          <p className="text-muted">Connect your wallet to commune with the oracle.</p>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* Messages Container */}
          <div className="rune-panel rune-panel--scroll mb-6 h-[min(58vh,34rem)] min-h-80 space-y-4 p-6 fade-in-delay-1">
            <div className="motion-lattice pointer-events-none absolute inset-x-6 top-4 h-16 opacity-35" aria-hidden="true" />
            {messages.length === 0 ? (
              <div className="text-center text-muted py-8">
                <p className="oracle-pulse section-title text-aurora inline-block text-lg">The oracle awaits your inquiry...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`animate-fade-in ${
                    msg.role === "user"
                      ? "ml-auto max-w-[85%] bg-cyan/10 border-cyan/30 sm:max-w-md"
                      : "max-w-[85%] bg-purple/10 border-purple/30 sm:max-w-md"
                  } border rounded-lg p-3 float-message`}
                >
                  <p className="text-xs font-mono uppercase mb-1 opacity-60">
                    {msg.role === "user" ? "You" : "Oracle"}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              ))
            )}
            {status === "pending" && (
              <div className="max-w-xs rounded-lg border border-purple/30 bg-purple/10 p-3">
                <LoadingSpinner size="sm" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={form.handleSubmit} className="rune-panel relative z-10 p-6 fade-in-delay-2">
            <div className="flex gap-3">
              <input
                type="text"
                name="message"
                value={form.values.message}
                onChange={form.handleChange}
                placeholder="Ask the oracle..."
                className="detail-cell min-w-0 flex-1 px-4 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                disabled={status === "pending"}
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={status === "pending" || !form.values.message.trim()}
                className="rune-button inline-flex items-center gap-2 px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
              >
                <Send className="size-4" />
                {status === "pending" ? "..." : "Send"}
              </button>
            </div>
            {form.errors.message && (
              <p className="mt-2 text-sm text-red-400">{form.errors.message}</p>
            )}
            <p className="mt-2 text-xs text-muted text-right">
              {form.values.message.length}/1000 characters
            </p>
          </form>

          {/* Error Toast */}
          {error && (
            <Toast
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          )}
        </div>
      )}
    </main>
  );
};
