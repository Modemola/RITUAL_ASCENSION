"use client";

import Link from "next/link";
import { AlertTriangle, Award, Bot, ChevronDown, CircleGauge, LayoutDashboard, ListChecks, RefreshCw, ShieldCheck, Trophy, Wallet } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { appProgress, demoPassport } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { discoverBrowserWallets, requestWalletAddress, requestWalletSignature, BrowserWallet } from "@/lib/wallets";
import { LoadingSpinner, Modal } from "@/lib/components";
import { RitualSurface } from "@/components/ui/ritual-surface";

const ADMIN_WALLET = (process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "").toLowerCase();

const privateNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quests", label: "Quests", icon: ListChecks },
  { href: "/oracle", label: "Oracle", icon: Bot },
  { href: "/achievements", label: "Badges", icon: Award },
  { href: "/leaderboard", label: "Rankings", icon: Trophy }
];

export function AppShell({ children }: { children: ReactNode }) {
  const { wallet, isConnected, passport, connectWallet, disconnectWallet } = useRitual();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectWallets, setConnectWallets] = useState<BrowserWallet[]>([]);
  const [connectScanning, setConnectScanning] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const hasPrivateAccess = isConnected && Boolean(passport);
  const isAdmin = isConnected && wallet?.toLowerCase() === ADMIN_WALLET;
  const navItems = hasPrivateAccess ? privateNavItems : [];

  // Close the wallet menu on outside click or Escape so it never lingers
  // open over the rest of the navbar while the user interacts elsewhere.
  useEffect(() => {
    if (!walletMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setWalletMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setWalletMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [walletMenuOpen]);

  const openConnectModal = async () => {
    setConnectError("");
    setShowConnectModal(true);
    setConnectScanning(true);
    try {
      const found = await discoverBrowserWallets();
      setConnectWallets(found);
      if (!found.length) setConnectError("No EVM wallet detected. Install or unlock MetaMask, then try again.");
    } catch (err) {
      setConnectError(getErrorMessage(err, "Failed to scan browser wallets"));
    } finally {
      setConnectScanning(false);
    }
  };

  const rescanWallets = async () => {
    setConnectError("");
    setConnectScanning(true);
    try {
      const found = await discoverBrowserWallets();
      setConnectWallets(found);
      if (!found.length) setConnectError("Still no wallet found. Make sure your extension is unlocked.");
    } catch (err) {
      setConnectError(getErrorMessage(err, "Failed to scan browser wallets"));
    } finally {
      setConnectScanning(false);
    }
  };

  const connectFromNav = async (bw: BrowserWallet) => {
    setConnectError("");
    setConnectingId(bw.id);
    try {
      const address = await requestWalletAddress(bw);
      const nonceRes = await apiClient.createAuthNonce(address);
      if (nonceRes.error || !nonceRes.data) throw new Error(nonceRes.error ?? "Could not create auth challenge");
      const sig = await requestWalletSignature(bw, address, nonceRes.data.message);
      await connectWallet(address, nonceRes.data.message, sig);
      setShowConnectModal(false);
    } catch (err) {
      setConnectError(getErrorMessage(err, "Wallet connection failed"));
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletMenuOpen(false);
  };

  const walletLabel = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect";

  return (
    <>
      <RitualSurface />
      <header className="fixed inset-x-0 top-0 z-30 border-b border-cyan/12 bg-void/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-nowrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-3 font-semibold text-ink">
            <span className="passport-art grid size-10 place-items-center border border-cyan/35 text-sm text-cyan shadow-rune">RA</span>
            <span className="hidden sm:inline">Ritual Ascension</span>
            <span className="status-pill hidden px-2.5 py-1 font-mono text-xs md:inline">Ritualnet</span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-cyan/5 hover:text-cyan hover-lift">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
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
            {isAdmin && (
              <Link
                href="/admin"
                className="quiet-button hidden items-center gap-1.5 px-3 py-2 text-sm font-semibold sm:inline-flex"
                title="Admin console"
              >
                <ShieldCheck className="size-4 text-cyan" />
                Admin
              </Link>
            )}
            {isConnected && wallet ? (
              <div className="relative" ref={walletMenuRef}>
                <button
                  type="button"
                  onClick={() => setWalletMenuOpen((open) => !open)}
                  className="rune-button inline-flex min-w-32 items-center justify-center gap-2 px-3 py-2 text-sm font-semibold hover-lift"
                >
                  <Wallet className="size-4" />
                  <span className="font-mono">{walletLabel}</span>
                  <ChevronDown className="size-4" />
                </button>
                {walletMenuOpen ? (
                  <div className="rune-panel absolute right-0 top-full z-50 mt-3 w-56 p-2 shadow-rune">
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
              <button
                type="button"
                onClick={openConnectModal}
                className="rune-button inline-flex min-w-32 items-center justify-center gap-2 px-3 py-2 text-sm font-semibold hover-lift"
              >
                <Wallet className="size-4" />
                Connect
              </button>
            )}
          </div>
        </div>
      </header>
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

      <Modal
        isOpen={showConnectModal}
        title="Connect Wallet"
        onClose={() => { setShowConnectModal(false); setConnectError(""); }}
        actions={
          <>
            <button
              type="button"
              onClick={() => { setShowConnectModal(false); setConnectError(""); }}
              className="quiet-button flex-1 px-4 py-2 font-semibold text-muted hover:text-cyan"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={rescanWallets}
              disabled={connectScanning}
              className="rune-button inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 font-semibold button-press disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${connectScanning ? "animate-spin" : ""}`} />
              {connectScanning ? "Scanning..." : "Refresh"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="copy-muted text-sm">
            Pick the wallet that will sign your session. This is not a transaction — no funds move.
          </p>
          {connectScanning ? (
            <LoadingSpinner size="sm" message="Scanning browser wallets..." />
          ) : connectWallets.length ? (
            <div className="grid gap-2">
              {connectWallets.map((bw) => (
                <button
                  key={bw.id}
                  type="button"
                  onClick={() => connectFromNav(bw)}
                  disabled={connectingId !== null}
                  className="wallet-option flex items-center justify-between gap-3 px-3 py-3 text-left disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    {bw.icon ? (
                      <img src={bw.icon} alt="" className="size-8 rounded-md" />
                    ) : (
                      <span className="status-pill grid size-8 place-items-center font-mono text-xs">EVM</span>
                    )}
                    <span>
                      <span className="block font-medium">{bw.name}</span>
                      <span className="block text-xs text-muted">
                        {connectingId === bw.id ? "Connecting..." : "Injected wallet"}
                      </span>
                    </span>
                  </span>
                  {connectingId === bw.id
                    ? <LoadingSpinner size="sm" />
                    : <Wallet className="size-4 text-cyan" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="detail-cell flex gap-3 border-amber/30 bg-amber/10 p-3 text-sm text-muted">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
              No browser wallet detected. Install or unlock MetaMask, then click Refresh.
            </div>
          )}
          {connectError && (
            <div className="detail-cell flex gap-3 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {connectError}
            </div>
          )}
          <p className="text-xs text-muted">
            New here? <Link href="/onboarding" onClick={() => setShowConnectModal(false)} className="text-cyan hover:underline">Mint your Soulbound Passport</Link> after connecting.
          </p>
        </div>
      </Modal>
    </>
  );
}
