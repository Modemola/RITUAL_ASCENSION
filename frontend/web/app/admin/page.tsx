"use client";

import { useEffect, useState, useCallback } from "react";
import { BadgeCheck, ChevronDown, ChevronUp, Clock, ShieldAlert, XCircle } from "lucide-react";
import { apiClient, ReviewQueueItem } from "@/lib/api";
import { useRitual } from "@/lib/store";
import { LoadingSpinner, Toast } from "@/lib/components";

const ADMIN_WALLET = (process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "").toLowerCase();

type Tab = "pending" | "log";

export default function AdminPage() {
  const { wallet, authToken, isConnected } = useRitual();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<ReviewQueueItem[]>([]);
  const [log, setLog] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deciding, setDeciding] = useState<string | null>(null);

  const isAdmin = isConnected && wallet?.toLowerCase() === ADMIN_WALLET;

  const fetchQueue = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    const [pendingRes, allRes] = await Promise.all([
      apiClient.getReviewQueue(authToken, 50, "pending"),
      apiClient.getReviewQueue(authToken, 100, "all"),
    ]);
    if (pendingRes.data) setPending(pendingRes.data.reviews);
    if (allRes.data) setLog(allRes.data.reviews.filter(r => r.review.status !== "pending"));
    setLoading(false);
  }, [authToken]);

  useEffect(() => {
    if (isAdmin) fetchQueue();
    else setLoading(false);
  }, [isAdmin, fetchQueue]);

  const decide = async (reviewId: string, status: "approved" | "rejected") => {
    if (!authToken) return;
    setDeciding(reviewId);
    const res = await apiClient.decideReview(reviewId, { status, notes: notes[reviewId] || undefined }, authToken);
    setDeciding(null);
    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({ type: "success", message: `Review ${status}.` });
      setExpanded(null);
      await fetchQueue();
    }
  };

  if (!isConnected) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center fade-in">
        <ShieldAlert className="mx-auto mb-4 size-12 text-muted" />
        <h1 className="display-title text-aurora text-3xl">Connect your wallet</h1>
        <p className="copy-muted mt-3">Admin access requires your connected wallet to be verified.</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center fade-in">
        <ShieldAlert className="mx-auto mb-4 size-12 text-red-400" />
        <h1 className="display-title text-aurora text-3xl">Access denied</h1>
        <p className="copy-muted mt-3">This wallet does not have admin permissions.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="fade-in mb-6">
        <p className="text-cipher text-xs uppercase tracking-[0.22em]">Admin console</p>
        <h1 className="display-title text-aurora mt-2 text-4xl slide-up">Review queue.</h1>
        <p className="copy-muted mt-2">
          Connected as <span className="font-mono text-cyan">{wallet}</span>
        </p>
      </div>

      <div className="flex gap-1 mb-6 rune-panel p-1 w-fit">
        {([["pending", "Pending queue"], ["log", "Decision log"]] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold transition-colors rounded-sm ${
              tab === key ? "bg-cyan/20 text-cyan border border-cyan/40" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {key === "pending" && pending.length > 0 && (
              <span className="ml-2 rounded-full bg-cyan/25 px-2 py-0.5 font-mono text-xs text-cyan">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rune-panel p-12 text-center">
          <LoadingSpinner size="lg" message="Loading reviews..." />
        </div>
      ) : tab === "pending" ? (
        <PendingQueue
          items={pending}
          expanded={expanded}
          notes={notes}
          deciding={deciding}
          onToggle={id => setExpanded(prev => prev === id ? null : id)}
          onNoteChange={(id, val) => setNotes(prev => ({ ...prev, [id]: val }))}
          onDecide={decide}
        />
      ) : (
        <DecisionLog items={log} />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </main>
  );
}

function PendingQueue({
  items, expanded, notes, deciding, onToggle, onNoteChange, onDecide
}: {
  items: ReviewQueueItem[];
  expanded: string | null;
  notes: Record<string, string>;
  deciding: string | null;
  onToggle: (id: string) => void;
  onNoteChange: (id: string, val: string) => void;
  onDecide: (id: string, status: "approved" | "rejected") => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rune-panel p-12 text-center fade-in">
        <BadgeCheck className="mx-auto mb-3 size-10 text-green" />
        <p className="section-title text-xl font-semibold">Queue is clear</p>
        <p className="copy-muted mt-2">All submissions have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const { review, attempt, quest } = item;
        const isOpen = expanded === review.id;
        const isDeciding = deciding === review.id;

        return (
          <div
            key={review.id}
            className="rune-panel overflow-hidden fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-cyan/5 transition-colors"
              onClick={() => onToggle(review.id)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="status-pill px-2 py-0.5 font-mono text-xs uppercase">
                    {quest?.category ?? attempt.questId}
                  </span>
                  <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${
                    quest?.difficulty === "legendary" ? "border-gold/40 text-gold" :
                    quest?.difficulty === "epic" ? "border-purple/40 text-purple" :
                    "border-cyan/30 text-cyan"
                  }`}>
                    {quest?.difficulty ?? "—"}
                  </span>
                  <Clock className="size-3.5 text-muted" />
                  <span className="text-xs text-muted">
                    {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="section-title font-semibold">{quest?.title ?? attempt.questId}</p>
                <p className="mt-1 break-all font-mono text-xs text-muted">{attempt.wallet}</p>
              </div>
              {isOpen ? <ChevronUp className="size-5 shrink-0 text-muted mt-1" /> : <ChevronDown className="size-5 shrink-0 text-muted mt-1" />}
            </button>

            {isOpen && (
              <div className="border-t border-cyan/10 p-5 space-y-4 fade-in">
                <div>
                  <p className="text-cipher mb-2 text-xs uppercase tracking-widest">Submitted proof</p>
                  <pre className="detail-cell overflow-x-auto whitespace-pre-wrap break-all p-4 font-mono text-sm text-ink">
                    {attempt.proof || <span className="text-muted italic">No proof submitted</span>}
                  </pre>
                </div>

                {quest?.description && (
                  <div>
                    <p className="text-cipher mb-2 text-xs uppercase tracking-widest">Quest description</p>
                    <p className="copy-muted text-sm">{quest.description}</p>
                  </div>
                )}

                <div>
                  <label className="text-cipher mb-2 block text-xs uppercase tracking-widest">
                    Review notes (optional)
                  </label>
                  <textarea
                    value={notes[review.id] ?? ""}
                    onChange={e => onNoteChange(review.id, e.target.value)}
                    placeholder="Add notes visible to the builder..."
                    rows={3}
                    className="detail-cell w-full px-3 py-2 font-mono text-sm outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={() => onDecide(review.id, "approved")}
                    className="rune-button flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold button-press hover-lift disabled:opacity-50"
                  >
                    <BadgeCheck className="size-4" />
                    {isDeciding ? "Processing..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={isDeciding}
                    onClick={() => onDecide(review.id, "rejected")}
                    className="quiet-button flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold border-red-500/30 text-red-400 hover:border-red-400/50 disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    {isDeciding ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DecisionLog({ items }: { items: ReviewQueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rune-panel p-12 text-center fade-in">
        <p className="copy-muted">No decisions yet.</p>
      </div>
    );
  }

  return (
    <div className="rune-panel overflow-hidden fade-in">
      {items.map((item, i) => {
        const { review, attempt, quest } = item;
        const approved = review.status === "approved";

        return (
          <div
            key={review.id}
            className="grid grid-cols-[1fr_auto] gap-4 border-b border-cyan/10 p-4 last:border-b-0 float-message"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${
                  approved ? "border-green/35 bg-green/10 text-green" : "border-red-500/35 bg-red-500/10 text-red-400"
                }`}>
                  {review.status.toUpperCase()}
                </span>
                <span className="text-xs text-muted">
                  {review.decidedAt ? new Date(review.decidedAt).toLocaleString() : "—"}
                </span>
              </div>
              <p className="font-semibold">{quest?.title ?? attempt.questId}</p>
              <p className="mt-0.5 break-all font-mono text-xs text-muted">{attempt.wallet}</p>
              {review.notes && (
                <p className="mt-1.5 text-sm text-muted italic">&quot;{review.notes}&quot;</p>
              )}
            </div>
            <div className="shrink-0 text-right">
              {approved ? (
                <BadgeCheck className="size-6 text-green" />
              ) : (
                <XCircle className="size-6 text-red-400" />
              )}
              {quest?.xp && (
                <p className="mt-1 font-mono text-xs text-cyan">{quest.xp} XP</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
