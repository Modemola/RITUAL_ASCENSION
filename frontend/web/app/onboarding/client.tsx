"use client";

import Link from "next/link";
import { Check, RefreshCw, Wallet } from "lucide-react";
import { useState } from "react";
import { builderClasses } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { useForm } from "@/lib/hooks";
import { LoadingSpinner, Toast, Modal } from "@/lib/components";
import { BrowserWallet, discoverBrowserWallets, requestWalletAddress } from "@/lib/wallets";

export const OnboardingClient = () => {
  const { connectWallet, isLoading, error: storeError } = useRitual();
  const [selectedClass, setSelectedClass] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [wallets, setWallets] = useState<BrowserWallet[]>([]);
  const [isDiscoveringWallets, setIsDiscoveringWallets] = useState(false);
  const [walletPickerError, setWalletPickerError] = useState("");

  const form = useForm(
    { wallet: "" },
    async (values) => {
      await connectWallet(values.wallet);
      setShowWalletModal(false);
    }
  );

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
      await connectWallet(address);
      setShowWalletModal(false);
    } catch (error) {
      setWalletPickerError(error instanceof Error ? error.message : "Wallet connection failed");
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
            Connect a wallet, select a permanent class, then send the mint transaction. Production will wire this into Wagmi, SIWE, and PassportNFT.mintPassport.
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
          {/* Mint Button */}
          <Link
            href="/dashboard"
            className="rune-button inline-flex items-center justify-center px-4 py-3 font-semibold button-press hover-lift md:col-span-2"
          >
            Continue with {builderClasses.find((c) => c.id === selectedClass)?.name}
          </Link>
        </section>
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
              Choose an EVM-compatible wallet detected in this browser.
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

          <div className="border-t border-cyan/10 pt-4">
            <label className="block text-sm font-medium mb-2">Manual fallback address</label>
            <input
              type="text"
              name="wallet"
              value={form.values.wallet}
              onChange={form.handleChange}
              placeholder="0xA5C3f19D0b8e6A45B6f1b9B4A21c7F1D9E3b8124"
              className="w-full border border-cyan/15 bg-void px-3 py-2 outline-none placeholder:text-muted focus:border-cyan/50 focus:ring-2 focus:ring-cyan/30 rounded"
            />
            {form.errors.wallet && (
              <p className="mt-1 text-sm text-red-400">{form.errors.wallet}</p>
            )}
            <button
              type="button"
              onClick={(event) => form.handleSubmit(event)}
              disabled={isLoading}
              className="mt-3 w-full border border-cyan/20 px-4 py-2 font-semibold text-cyan hover:border-cyan/50 disabled:opacity-50"
            >
              Connect manual address
            </button>
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
      {form.submitSuccess && (
        <Toast
          type="success"
          message="Wallet connected successfully!"
          onClose={() => {}}
        />
      )}
    </main>
  );
};
