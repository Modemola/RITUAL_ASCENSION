import type { Metadata } from "next";
import Link from "next/link";
import { Award, Bot, CircleGauge, LayoutDashboard, ListChecks, Trophy, Wallet } from "lucide-react";
import { ReactNode } from "react";
import { appProgress, demoPassport } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ritual Ascension",
  description: "Soulbound builder identity, quests, XP, reputation, and Oracle guidance for Ritual."
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quests", label: "Quests", icon: ListChecks },
  { href: "/oracle", label: "Oracle", icon: Bot },
  { href: "/achievements", label: "Badges", icon: Award },
  { href: "/leaderboard", label: "Rankings", icon: Trophy }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="fixed inset-x-0 top-0 z-30 border-b border-cyan/15 bg-void/78 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-3 font-semibold text-ink">
              <span className="passport-art grid size-10 place-items-center border border-cyan/35 text-sm text-cyan shadow-rune">RA</span>
              <span className="hidden sm:inline">Ritual Ascension</span>
              <span className="hidden border border-cyan/20 px-2 py-1 font-mono text-xs text-cyan md:inline">Ritualnet</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="px-3 py-2 text-sm text-muted hover:text-cyan">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 border border-cyan/20 bg-panel/70 px-3 py-2 text-sm lg:flex">
                <CircleGauge className="size-4 text-cyan" />
                <span className="font-mono">LVL {appProgress.level}</span>
                <span className="text-muted">{demoPassport.xp} XP</span>
              </div>
              <Link href="/onboarding" className="rune-button inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold">
                <Wallet className="size-4" />
                Connect
              </Link>
            </div>
          </div>
        </header>
        <div className="pointer-events-none fixed inset-0 z-0 opacity-30" aria-hidden="true">
          <div className="absolute left-[8%] top-28 font-mono text-6xl text-cyan/10 float-rune">◇</div>
          <div className="absolute right-[12%] top-52 font-mono text-5xl text-purple/10 float-rune">⌁</div>
          <div className="absolute bottom-24 left-[16%] font-mono text-4xl text-green/10 float-rune">△</div>
        </div>
        <div className="relative z-10 min-h-screen pt-[73px] pb-24 md:pb-0">{children}</div>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-cyan/15 bg-void/90 backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-2 py-3 text-[11px] text-muted">
              <item.icon className="size-5 text-cyan" />
              {item.label}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
