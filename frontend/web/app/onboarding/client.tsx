"use client";

import Link from "next/link";
import { Check, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { builderClasses } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { LoadingSpinner, Toast, Modal } from "@/lib/components";
import { BrowserWallet, discoverBrowserWallets, requestMintSignature, requestWalletAddress, requestWalletSignature } from "@/lib/wallets";

export const OnboardingClient = () => {
  const router = useRouter();
  const { wallet, connectWallet, mintPassport, isConnected, passport, isLoading, error: storeError } = useRitual();
  const [selectedClass, setSelectedClass] = useState(1);
  const [activeStep, setActiveStep] = useState<"class" | "mint">("class");
  const [connectedBrowserWallet, setConnectedBrowserWallet] = useState<BrowserWallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState<BrowserWallet[]>([]);
  const [isDiscoveringWallets, setIsDiscoveringWallets] = useState(false);
  const [walletPickerError, setWalletPickerError] = useState("");
  const [mintError, setMintError] = useState("");

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
      setWalletPickerError(error instanceof Error ? error.message : "Failed to discover browser wallets");
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
      setWalletPickerError(error instanceof Error ? error.message : "Wallet connection failed");
    }
  };

  const selectedClassData = builderClasses.find((c) => c.id === selectedClass) ?? builderClasses[0];

  const handlePrepareMint = () => {
    setMintError("");
    if (!isConnected) {
      setMintError("Connect and sign with your wallet before minting.");
      return;
    }

    setActiveStep("mint");
  };

  const handleMintPassport = async () => {
    setMintError("");
    if (!wallet || !connectedBrowserWallet) {
      setMintError("Reconnect your wallet so the mint signature can be requested.");
      return;
    }

    try {
      const mintSignature = await requestMintSignature(connectedBrowserWallet, wallet, selectedClassData.name);
      await mintPassport(selectedClass, mintSignature);
      router.push("/dashboard");
    } catch (error) {
      setMintError(error instanceof Error ? error.message : "Mint signature failed");
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
            <span className="grid size-9 place-items-center rounded-full border border-cyan/30 font-mono text-cyan">
              0{index + 1}
            </span>
            <span className="font-medium">{step}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="rune-panel h-fit p-6 fade-in-delay-1">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">
            Onboarding ritual
          </p>
          <h1 className="mt-3 text-4xl font-semibold slide-up">
            Mint your Soulbound Passport.
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Connect and sign with the wallet that will own your Soulbound Passport, select a permanent class, then send the mint transaction. That same wallet becomes the only wallet checked for task verification.
          </p>
          <button
            onClick={openWalletModal}
            className="rune-button mt-6 inline-flex items-center gap-2 px-4 py-3 font-semibold button-press hover-lift"
          >
            <Wallet className="size-4" />
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>

          <div className="mt-6 border border-cyan/15 bg-black/25 p-4 pulse-subtle">
            <div className="flex items-center gap-3 text-sm text-muted">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Connecting wallet...</span>
                </>
              ) : (
                <>
                  <span className="size-4 text-green">OK</span>
                  <span>Ready to connect</span>
                </>
              )}
            </div>
          </div>
        </section>

        {isConnected && passport ? (
          <section className="rune-panel flex min-h-80 flex-col justify-between p-6 fade-in-delay-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Passport already minted</p>
              <h2 className="mt-3 text-3xl font-semibold">This wallet has completed onboarding.</h2>
              <p className="mt-3 leading-7 text-muted">
                Onboarding only happens once per wallet. Future visits require a fresh wallet signature, then the existing Soulbound Passport is loaded for this wallet.
              </p>
            </div>
            <div className="mt-6 grid gap-3 border border-cyan/10 bg-black/20 p-4 font-mono text-sm">
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
            <Link href="/dashboard" className="rune-button mt-6 inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift">
              Open Dashboard
            </Link>
          </section>
        ) : (
        activeStep === "class" ? (
        <section className="grid gap-3 md:grid-cols-2">
          {builderClasses.map((builderClass, i) => (
            <article
              key={builderClass.id}
              onClick={() => setSelectedClass(builderClass.id)}
              className={`rune-panel p-5 scale-in-stagger hover-lift cursor-pointer transition-all ${
                selectedClass === builderClass.id
                  ? "border-cyan/45 bg-cyan/10 shadow-rune hover-glow"
                  : ""
              }`}
              style={{ "--index": i } as React.CSSProperties}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-cyan">CLASS {builderClass.id}</p>
                  <h2 className="mt-2 text-xl font-semibold">{builderClass.name}</h2>
                </div>
                {selectedClass === builderClass.id ? (
                  <Check className="size-5 text-green pop-in" />
                ) : null}
              </div>
              <p className="mt-3 min-h-20 text-sm leading-6 text-muted">{builderClass.focus}</p>
              <p className="mt-4 border-t border-cyan/10 pt-3 text-sm font-medium text-cyan">
                {builderClass.achievement}
              </p>
            </article>
          ))}
          <button
            type="button"
            onClick={handlePrepareMint}
            className="rune-button inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift md:col-span-2"
          >
            Continue with {builderClasses.find((c) => c.id === selectedClass)?.name}
          </button>
        </section>
        ) : (
          <section className="rune-panel p-6 fade-in-delay-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan">Mint Soulbound Passport</p>
                <h2 className="mt-3 text-3xl font-semibold">Review the token details.</h2>
              </div>
              <ShieldCheck className="size-7 text-green" />
            </div>
            <p className="mt-3 leading-7 text-muted">
              This is the final onboarding step. Your wallet will be asked to sign the mint confirmation, then your Soulbound Passport will unlock the dashboard.
            </p>
            <div className="mt-6 grid gap-3 border border-cyan/10 bg-black/20 p-4 font-mono text-sm">
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
                <span className="text-muted">Transferability</span>
                <span>Soulbound</span>
              </div>
            </div>
            {mintError ? <p className="mt-4 text-sm text-red-400">{mintError}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setActiveStep("class")}
                className="border border-cyan/20 px-4 py-3 font-semibold text-cyan hover:border-cyan/50"
              >
                Back to Class
              </button>
              <button
                type="button"
                onClick={handleMintPassport}
                disabled={isLoading}
                className="rune-button inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 font-semibold button-press hover-lift disabled:opacity-50"
              >
                <ShieldCheck className="size-4" />
                {isLoading ? "Minting..." : "Sign and Mint Passport"}
              </button>
            </div>
          </section>
        )
        )}
      </div>

      {/* Wallet Connection Modal */}
      <Modal
        isOpen={showWalletModal}
        title="Connect Wallet"
        onClose={() => setShowWalletModal(false)}
        actions={
          <>
            <button
              onClick={() => setShowWalletModal(false)}
              className="flex-1 border border-cyan/20 px-4 py-2 font-semibold text-muted hover:text-cyan"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={refreshWallets}
              disabled={isDiscoveringWallets}
              className="rune-button flex-1 px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
            >
              {isDiscoveringWallets ? "Scanning..." : "Refresh"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted">
              Choose the EVM-compatible wallet that will be bound to your Soulbound Passport. You will be asked to sign a session message every time you connect.
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
                    className="flex items-center justify-between gap-3 border border-cyan/15 bg-black/20 px-3 py-3 text-left hover:border-cyan/45 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-3">
                      {browserWallet.icon ? (
                        <img src={browserWallet.icon} alt="" className="size-7" />
                      ) : (
                        <span className="grid size-7 place-items-center border border-cyan/20 text-xs text-cyan">EVM</span>
                      )}
                      <span>
                        <span className="block font-medium">{browserWallet.name}</span>
                        <span className="block text-xs text-muted">Browser wallet provider</span>
                      </span>
                    </span>
                    <Wallet className="size-4 text-cyan" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-amber/30 bg-amber/10 p-3 text-sm text-muted">
                No browser wallet detected. Install or unlock an EVM wallet, then refresh.
              </div>
            )}
          </div>

          <div className="border-t border-cyan/10 pt-4 text-sm leading-6 text-muted">
            Manual fallback addresses are disabled. Passport identity must start from a real wallet connection and fresh wallet signature so task checks can use the same bound wallet later.
          </div>
          {walletPickerError && <p className="text-sm text-red-400">{walletPickerError}</p>}
          {storeError && <p className="text-sm text-red-400">{storeError}</p>}
        </div>
      </Modal>

      {/* Error Toast */}
      {storeError && (
        <Toast
          type="error"
          message={storeError}
          onClose={() => {}}
        />
      )}

      {/* Success Toast */}
    </main>
  );
};
