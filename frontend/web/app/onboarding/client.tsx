"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wallet
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { builderClasses } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { LoadingSpinner, Modal, Toast } from "@/lib/components";
import {
  BrowserWallet,
  discoverBrowserWallets,
  isChainMintConfigured,
  mintPassportOnChain,
  requestMintSignature,
  requestWalletAddress,
  requestWalletSignature
} from "@/lib/wallets";

export const OnboardingClient = () => {
  const router = useRouter();
  const {
    wallet,
    connectWallet,
    mintPassport,
    syncPassportFromChain,
    isConnected,
    passport,
    isLoading,
    error: storeError,
    clearError
  } = useRitual();
  const [selectedClass, setSelectedClass] = useState(1);
  const [activeStep, setActiveStep] = useState<"class" | "mint">("class");
  const [connectedBrowserWallet, setConnectedBrowserWallet] = useState<BrowserWallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState<BrowserWallet[]>([]);
  const [isDiscoveringWallets, setIsDiscoveringWallets] = useState(false);
  const [walletPickerError, setWalletPickerError] = useState("");
  const [mintError, setMintError] = useState("");
  const chainMintEnabled = isChainMintConfigured();

  const refreshWallets = async () => {
    setIsDiscoveringWallets(true);
    setWalletPickerError("");
    try {
      const discoveredWallets = await discoverBrowserWallets();
      setWallets(discoveredWallets);
      if (!discoveredWallets.length) {
        setWalletPickerError("No injected EVM wallet was found in this browser.");
      }
    } catch (error) {
      setWalletPickerError(getErrorMessage(error, "Failed to discover browser wallets"));
    } finally {
      setIsDiscoveringWallets(false);
    }
  };

  const openWalletModal = async () => {
    setShowWalletModal(true);
    await refreshWallets();
  };

  const connectDetectedWallet = async (browserWallet: BrowserWallet) => {
    setWalletPickerError("");
    try {
      const address = await requestWalletAddress(browserWallet);
      const nonceResponse = await apiClient.createAuthNonce(address);
      if (nonceResponse.error || !nonceResponse.data) {
        throw new Error(nonceResponse.error || "Failed to create wallet auth challenge");
      }

      const signature = await requestWalletSignature(browserWallet, address, nonceResponse.data.message);
      await connectWallet(address, nonceResponse.data.message, signature);
      setConnectedBrowserWallet(browserWallet);
      setShowWalletModal(false);
    } catch (error) {
      setWalletPickerError(getErrorMessage(error, "Wallet connection failed"));
    }
  };

  const selectedClassData = builderClasses.find((c) => c.id === selectedClass) ?? builderClasses[0];

  const handlePrepareMint = () => {
    setMintError("");
    if (!isConnected) {
      // Open the wallet modal instead of showing a silent error
      openWalletModal();
      return;
    }

    setActiveStep("mint");
  };

  const handleMintPassport = async () => {
    setMintError("");
    if (!wallet) {
      setMintError("Connect your wallet before minting.");
      return;
    }

    // Re-discover if the browser wallet state was lost (e.g. page refresh after session restore)
    let browserWallet = connectedBrowserWallet;
    if (!browserWallet) {
      const found = await discoverBrowserWallets();
      browserWallet = found[0] ?? null;
      if (browserWallet) setConnectedBrowserWallet(browserWallet);
    }

    if (!browserWallet) {
      setMintError("No wallet extension found. Unlock MetaMask or another EVM wallet and try again.");
      return;
    }

    try {
      const activeWallet = await requestWalletAddress(browserWallet);
      if (activeWallet.toLowerCase() !== wallet.toLowerCase()) {
        throw new Error(`MetaMask is using ${shortWallet(activeWallet)}. Switch to ${shortWallet(wallet)} and try again.`);
      }

      if (chainMintEnabled) {
        await mintPassportOnChain(browserWallet, wallet, selectedClass);
        await syncPassportFromChain();
      } else {
        const { message: mintMessage, signature: mintSignature } = await requestMintSignature(
          browserWallet,
          wallet,
          selectedClassData.name
        );
        await mintPassport(selectedClass, mintMessage, mintSignature);
      }

      router.push("/dashboard");
    } catch (error) {
      setMintError(getErrorMessage(error, "Passport mint failed"));
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 grid gap-3 md:grid-cols-3 fade-in">
        {["Connect Wallet", "Choose Class", "Mint Passport"].map((step, index) => (
          <div
            key={step}
            className="rune-panel flex items-center gap-3 p-4 scale-in-stagger hover-lift"
            style={{ "--index": index } as React.CSSProperties}
          >
            <span className="status-pill grid size-9 place-items-center font-mono text-xs">0{index + 1}</span>
            <div>
              <span className="font-medium">{step}</span>
              <p className="mt-1 text-xs text-muted">
                {index === 0 ? "Signed session" : index === 1 ? "Permanent path" : "Soulbound token"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="rune-panel art-surface h-fit p-6 fade-in-delay-1">
          <div aria-hidden="true" className="art-bg art-bg--identity art-bg--panel" />
          <p className="text-cipher text-xs uppercase tracking-[0.22em]">Onboarding ritual</p>
          <h1 className="display-title text-aurora mt-3 text-4xl slide-up">Mint your Soulbound Passport.</h1>
          <p className="copy-muted mt-4">
            Bind one wallet, choose your class, and unlock the dashboard with a passport that carries XP, quests,
            reputation, and evolution history.
          </p>
          <button
            onClick={openWalletModal}
            className="rune-button mt-6 inline-flex items-center gap-2 px-4 py-3 font-semibold button-press hover-lift"
          >
            <Wallet className="size-4" />
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>

          <div className="detail-cell mt-6 p-4 pulse-subtle">
            <div className="flex items-center gap-3 text-sm text-muted">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Connecting wallet...</span>
                </>
              ) : (
                <>
                  <BadgeCheck className="size-4 text-green" />
                  <span>{wallet ? "Wallet session ready" : "Ready for wallet signature"}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {isConnected && passport ? (
          <section className="rune-panel art-surface flex min-h-80 flex-col justify-between p-6 fade-in-delay-2">
            <div aria-hidden="true" className="art-bg art-bg--passport art-bg--panel" />
            <div>
              <p className="text-cipher text-xs uppercase tracking-[0.22em]">Passport already minted</p>
              <h2 className="section-title mt-3 text-3xl font-semibold">This wallet has completed onboarding.</h2>
              <p className="copy-muted mt-3">
                Future visits ask for a fresh wallet signature, then load this Soulbound Passport.
              </p>
            </div>
            <div className="detail-cell mt-6 grid gap-3 p-4 font-mono text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Passport token</span>
                <span className="text-cyan">#{passport.tokenId}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Stage</span>
                <span>{passport.stage}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">XP</span>
                <span>{passport.xp}</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="rune-button mt-6 inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift"
            >
              Open Dashboard
            </Link>
          </section>
        ) : activeStep === "class" ? (
          <section className="grid gap-3 md:grid-cols-2">
            {builderClasses.map((builderClass, i) => (
              <article
                key={builderClass.id}
                role="button"
                tabIndex={0}
                aria-pressed={selectedClass === builderClass.id}
                onClick={() => setSelectedClass(builderClass.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedClass(builderClass.id);
                  }
                }}
                className={`rune-panel card-shift cursor-pointer p-5 transition-all scale-in-stagger hover-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan/60 ${
                  selectedClass === builderClass.id ? "border-cyan/45 bg-cyan/10 shadow-rune hover-glow" : ""
                }`}
                style={{ "--index": i } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="status-pill inline-flex px-2.5 py-1 font-mono text-xs">CLASS {builderClass.id}</p>
                    <h2 className="section-title mt-3 text-xl font-semibold">{builderClass.name}</h2>
                  </div>
                  {selectedClass === builderClass.id ? <Check className="size-5 text-green pop-in" /> : null}
                </div>
                <p className="mt-3 min-h-20 text-sm leading-6 text-muted">{builderClass.focus}</p>
                <div className="mt-4 flex items-center gap-2 border-t border-cyan/10 pt-3 text-sm font-medium text-cyan">
                  <Sparkles className="size-4 shrink-0" />
                  <span>{builderClass.achievement}</span>
                </div>
              </article>
            ))}
            <button
              type="button"
              onClick={handlePrepareMint}
              className="rune-button inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift md:col-span-2"
            >
              Continue with {selectedClassData.name}
            </button>
          </section>
        ) : (
          <section className="rune-panel art-surface p-6 fade-in-delay-2">
            <div aria-hidden="true" className="art-bg art-bg--passport art-bg--panel" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-cipher text-xs uppercase tracking-[0.22em]">Mint Soulbound Passport</p>
                <h2 className="section-title mt-3 text-3xl font-semibold">Review the token details.</h2>
              </div>
              <ShieldCheck className="size-7 text-green" />
            </div>
            <p className="copy-muted mt-3">
              {chainMintEnabled
                ? "Your wallet sends the PassportNFT mint transaction. After confirmation, the backend syncs the token from chain."
                : "Your wallet signs a local mint confirmation, then the dashboard opens with this class and token identity attached."}
            </p>
            <div className="detail-cell mt-6 grid gap-3 p-4 font-mono text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted">Wallet</span>
                <span className="break-all text-right text-cyan">{wallet}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Class</span>
                <span>{selectedClassData.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Initial stage</span>
                <span>Genesis</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Mint mode</span>
                <span>{chainMintEnabled ? "On-chain transaction" : "Local demo signature"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">Transferability</span>
                <span>Soulbound</span>
              </div>
            </div>
            {mintError ? <p className="mt-4 text-sm text-red-400">{mintError}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setActiveStep("class")}
                className="quiet-button inline-flex items-center justify-center gap-2 px-4 py-3 font-semibold"
              >
                <ArrowLeft className="size-4" />
                Back to class
              </button>
              <button
                type="button"
                onClick={handleMintPassport}
                disabled={isLoading}
                className="rune-button inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 font-semibold button-press hover-lift disabled:opacity-50"
              >
                <ShieldCheck className="size-4" />
                {isLoading ? "Minting..." : chainMintEnabled ? "Send Mint Transaction" : "Sign and Mint Passport"}
              </button>
            </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={showWalletModal}
        title="Connect Wallet"
        onClose={() => setShowWalletModal(false)}
        actions={
          <>
            <button
              onClick={() => setShowWalletModal(false)}
              className="quiet-button flex-1 px-4 py-2 font-semibold text-muted hover:text-cyan"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={refreshWallets}
              disabled={isDiscoveringWallets}
              className="rune-button inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isDiscoveringWallets ? "animate-spin" : ""}`} />
              {isDiscoveringWallets ? "Scanning..." : "Refresh"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="copy-muted text-sm">
              Pick the EVM wallet that will own this passport. The next prompt is a session signature, not a transfer.
            </p>
            {isDiscoveringWallets ? (
              <LoadingSpinner size="sm" message="Scanning browser wallets..." />
            ) : wallets.length ? (
              <div className="grid gap-2">
                {wallets.map((browserWallet) => (
                  <button
                    type="button"
                    key={`${browserWallet.id}-${browserWallet.name}`}
                    onClick={() => connectDetectedWallet(browserWallet)}
                    disabled={isLoading}
                    className="wallet-option flex items-center justify-between gap-3 px-3 py-3 text-left disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      {browserWallet.icon ? (
                        <img src={browserWallet.icon} alt="" className="size-8 rounded-md" />
                      ) : (
                        <span className="status-pill grid size-8 place-items-center font-mono text-xs">EVM</span>
                      )}
                      <span>
                        <span className="block font-medium">{browserWallet.name}</span>
                        <span className="block text-xs text-muted">Injected wallet provider</span>
                      </span>
                    </span>
                    <Wallet className="size-4 text-cyan" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="detail-cell flex gap-3 border-amber/30 bg-amber/10 p-3 text-sm text-muted">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
                <span>No browser wallet detected. Install or unlock an EVM wallet, then refresh.</span>
              </div>
            )}
          </div>

          <div className="detail-cell p-3 text-sm leading-6 text-muted">
            Manual addresses are disabled so quest checks always use the same bound wallet.
          </div>
          {walletPickerError ? (
            <div className="detail-cell flex gap-3 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{walletPickerError}</span>
            </div>
          ) : null}
          {storeError ? (
            <div className="detail-cell flex gap-3 border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{storeError}</span>
            </div>
          ) : null}
        </div>
      </Modal>

      {storeError ? <Toast type="error" message={storeError} onClose={clearError} /> : null}
    </main>
  );
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}
