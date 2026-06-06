"use client";

import Link from "next/link";
import { LockKeyhole, Wallet } from "lucide-react";
import { ReactNode } from "react";
import { LoadingSpinner } from "./components";
import { useRitual } from "./store";

export function PrivateGate({ children }: { children: ReactNode }) {
  const { isConnected, isLoading, passport } = useRitual();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rune-panel p-6">
          <LoadingSpinner message="Checking passport access..." />
        </div>
      </main>
    );
  }

  if (!isConnected || !passport) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <section className="rune-panel p-6 fade-in">
          <div className="flex items-center gap-3">
            <LockKeyhole className="size-6 text-cyan" />
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Private passport area</p>
          </div>
          <h1 className="mt-4 text-3xl font-semibold">Connect and mint your Soulbound Passport.</h1>
          <p className="mt-3 leading-7 text-muted">
            Dashboard, quests, badges, and level progress are only visible after the current wallet signs in and has a minted SBT.
          </p>
          <Link href="/onboarding" className="rune-button mt-6 inline-flex items-center gap-2 px-4 py-3 font-semibold hover-lift">
            <Wallet className="size-4" />
            Connect Wallet
          </Link>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
