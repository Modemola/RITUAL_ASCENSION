"use client";

import Link from "next/link";
import { Award, Bot, ChevronDown, CircleGauge, LayoutDashboard, ListChecks, Trophy, Wallet } from "lucide-react";
import { ReactNode } from "react";
import { appProgress, demoPassport } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { useState } from "react";

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quests", label: "Quests", icon: ListChecks },
  { href: "/oracle", label: "Oracle", icon: Bot },
  { href: "/achievements", label: "Badges", icon: Award },
  { href: "/leaderboard", label: "Rankings", icon: Trophy }
];

export function AppShell({ children }: { children: ReactNode }) {
  const { wallet, isConnected, passport, disconnectWallet } = useRitual();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const hasPrivateAccess = isConnected && Boolean(passport);
  const navItems = hasPrivateAccess ? privateNavItems : [];
  const walletLabel = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect";

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletMenuOpen(false);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-cyan/12 bg-void/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold text-ink">
            <span className="passport-art grid size-10 place-items-center border border-cyan/35 text-sm text-cyan shadow-rune">RA</span>
            <span className="hidden sm:inline">Ritual Ascension</span>
            <span className="status-pill hidden px-2.5 py-1 font-mono text-xs md:inline">Ritualnet</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-cyan/5 hover:text-cyan hover-lift">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {hasPrivateAccess ? (
              <div className="detail-cell hidden items-center gap-2 px-3 py-2 text-sm lg:flex scale-in">
                <CircleGauge className="size-4 text-cyan" />
                <span className="font-mono">LVL {passport?.level ?? appProgress.level}</span>
                <span className="text-muted">{passport?.xp ?? demoPassport.xp} XP</span>
              </div>
            ) : null}
            {!hasPrivateAccess ? (
              <Link href="/leaderboard" className="quiet-button hidden items-center gap-2 px-3 py-2 text-sm font-semibold sm:inline-flex">
                <Trophy className="size-4" />
                Rankings
              </Link>
            ) : null}
            {isConnected && wallet ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWalletMenuOpen((open) => !open)}
                  className="rune-button inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold hover-lift"
                >
                  <Wallet className="size-4" />
                  <span className="font-mono">{walletLabel}</span>
                  <ChevronDown className="size-4" />
                </button>
                {walletMenuOpen ? (
                  <div className="rune-panel absolute right-0 mt-2 w-56 p-2 shadow-rune">
                    <p className="break-all px-3 py-2 font-mono text-xs text-muted">{wallet}</p>
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="quiet-button w-full px-3 py-2 text-left text-sm font-semibold"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/onboarding" className="rune-button inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold hover-lift">
                <Wallet className="size-4" />
                Connect
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30" aria-hidden="true">
        <div className="absolute left-[8%] top-28 font-mono text-6xl text-cyan/10 float-rune">RA</div>
        <div className="absolute right-[12%] top-52 font-mono text-5xl text-purple/10 float-rune">SBT</div>
        <div className="absolute bottom-24 left-[16%] font-mono text-4xl text-green/10 float-rune">XP</div>
      </div>
      <div className="relative z-10 min-h-screen pt-[73px] pb-24 md:pb-0">{children}</div>
      {navItems.length ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid border-t border-cyan/15 bg-void/90 backdrop-blur-xl md:hidden"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map((item, i) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-2 py-3 text-[11px] text-muted hover:text-cyan hover-lift transition-colors float-message" style={{ animationDelay: `${i * 50}ms` }}>
              <item.icon className="size-5 text-cyan" />
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}
