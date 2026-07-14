"use client";

import { AlertCircle, RotateCcw, Send, Sparkles, Users } from "lucide-react";
import { useRitual } from "@/lib/store";
import { useAsync, useForm } from "@/lib/hooks";
import { apiClient } from "@/lib/api";
import { mascots, type MascotId } from "@/lib/data";
import { MascotAvatar } from "@/components/mascot-avatar";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

type Phase = "resolving" | "picker" | "entrance" | "chat";

const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const mascotStorageKey = (wallet: string) => `ritual.ascension.mascot.${wallet.toLowerCase()}`;

export const OracleClient = () => {
  const { wallet, authToken, isConnected } = useRitual();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const [mascotId, setMascotId] = useState<MascotId | null>(null);
  const [phase, setPhase] = useState<Phase>("resolving");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const mascot = mascotId ? mascots.find((m) => m.id === mascotId) ?? null : null;

  const { execute: sendMessage, status } = useAsync(async (content: string) => {
    if (!wallet) throw new Error("Wallet not connected");

    const response = await apiClient.askOracle(
      content,
      wallet,
      authToken ?? undefined,
      conversationId ?? undefined,
      mascotId ?? undefined
    );
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

  // Resolve a returning wallet's saved companion, or send them to the picker.
  useEffect(() => {
    if (!wallet) {
      setPhase("resolving");
      return;
    }
    const stored = window.localStorage.getItem(mascotStorageKey(wallet));
    if (stored && mascots.some((m) => m.id === stored)) {
      setMascotId(stored as MascotId);
      setPhase("entrance");
    } else {
      setPhase("picker");
    }
  }, [wallet]);

  // The welcome beat is brief and auto-dismisses into the chat.
  useEffect(() => {
    if (phase !== "entrance") return;
    const timer = setTimeout(() => setPhase("chat"), 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  const chooseMascot = (id: MascotId) => {
    if (wallet) window.localStorage.setItem(mascotStorageKey(wallet), id);
    setMascotId(id);
    setPhase("entrance");
  };

  const changeCompanion = () => {
    if (wallet) window.localStorage.removeItem(mascotStorageKey(wallet));
    setMascotId(null);
    setPhase("picker");
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
      <header className="mb-4 flex shrink-0 items-center justify-between gap-3 fade-in">
        <div className="flex min-w-0 items-center gap-3">
          {mascot && phase === "chat" ? (
            <MascotAvatar mascotId={mascot.id} size="md" />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-purple/40 bg-purple/10 text-purple shadow-purple">
              <Sparkles className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-cipher text-[11px] uppercase tracking-[0.22em] text-muted">Divine Council</p>
            <h1 className="display-title text-aurora truncate text-2xl sm:text-3xl">
              {mascot && phase === "chat" ? mascot.name : "The Oracle Speaks"}
            </h1>
          </div>
        </div>
        {phase === "chat" && mascot && (
          <button
            type="button"
            onClick={changeCompanion}
            className="quiet-button inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-semibold"
          >
            <Users className="size-3.5" />
            <span className="hidden sm:inline">Change companion</span>
          </button>
        )}
      </header>

      {!isConnected ? (
        <div className="rune-panel flex-1 space-y-4 border-orange-500/30 bg-orange-500/5 p-6 text-center">
          <p className="text-muted">Connect your wallet to commune with the oracle.</p>
        </div>
      ) : phase === "resolving" ? (
        <div className="flex-1" />
      ) : phase === "picker" ? (
        <div className="rune-panel flex-1 space-y-6 p-6 sm:p-10 fade-in">
          <div className="text-center">
            <p className="text-cipher text-xs uppercase tracking-[0.22em] text-muted">Choose your companion</p>
            <h2 className="section-title text-aurora mt-2 text-2xl">Who will guide you?</h2>
            <p className="copy-muted mx-auto mt-2 max-w-md text-sm">
              Pick the face of your Oracle. This is who greets you and answers from here on — you can change it any time.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {mascots.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMascot(m.id)}
                className="wallet-option mascot-card-in flex flex-col items-center gap-3 p-5 text-center hover-lift"
                style={{ animationDelay: `${i * 90}ms`, opacity: 0 }}
              >
                <MascotAvatar mascotId={m.id} size="lg" />
                <span>
                  <span className="block text-base font-semibold" style={{ color: m.accentColor }}>
                    {m.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{m.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : phase === "entrance" && mascot ? (
        <button
          type="button"
          onClick={() => setPhase("chat")}
          className="rune-panel flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center scale-in"
          aria-label="Continue to chat"
        >
          <span className="mascot-glow rounded-full" style={{ color: mascot.accentColor }}>
            <MascotAvatar mascotId={mascot.id} size="xl" />
          </span>
          <h2 className="display-title text-3xl" style={{ color: mascot.accentColor }}>
            {mascot.name}
          </h2>
          <p className="copy-muted max-w-sm text-sm">{mascot.welcomeLine}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted/70">Tap to continue</p>
        </button>
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
                {mascot && <MascotAvatar mascotId={mascot.id} size="lg" />}
                <p className="oracle-pulse section-title text-aurora inline-block text-lg">
                  {mascot ? `${mascot.name} awaits your inquiry...` : "The oracle awaits your inquiry..."}
                </p>
                <p className="max-w-sm text-xs">Ask about your class, your next quest, or what it takes to ascend.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 float-message ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && mascot && <MascotAvatar mascotId={mascot.id} size="sm" />}
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-2.5 sm:max-w-md ${
                      msg.role === "user" ? "rounded-br-sm border-cyan/30 bg-cyan/10" : "rounded-bl-sm"
                    }`}
                    style={
                      msg.role === "assistant" && mascot
                        ? { borderColor: `${mascot.accentColor}4d`, background: `${mascot.accentColor}1a` }
                        : undefined
                    }
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
                {mascot && <MascotAvatar mascotId={mascot.id} size="sm" />}
                <div
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-4 py-3"
                  style={mascot ? { borderColor: `${mascot.accentColor}4d`, background: `${mascot.accentColor}1a` } : undefined}
                >
                  <span className="typing-dot" style={mascot ? { background: mascot.accentColor } : undefined} />
                  <span
                    className="typing-dot"
                    style={{ animationDelay: "160ms", ...(mascot ? { background: mascot.accentColor } : {}) }}
                  />
                  <span
                    className="typing-dot"
                    style={{ animationDelay: "320ms", ...(mascot ? { background: mascot.accentColor } : {}) }}
                  />
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
                placeholder={mascot ? `Ask ${mascot.name}...` : "Ask the oracle..."}
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
