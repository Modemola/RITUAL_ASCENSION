"use client";

import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { useState } from "react";
import { builderClasses } from "@/lib/data";
import { useRitual } from "@/lib/store";
import { useForm, validators } from "@/lib/hooks";
import { LoadingSpinner, Toast, Modal } from "@/lib/components";

export const OnboardingClient = () => {
  const { connectWallet, isLoading, error: storeError } = useRitual();
  const [selectedClass, setSelectedClass] = useState(1);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const form = useForm(
    { wallet: "" },
    async (values) => {
      await connectWallet(values.wallet);
      setShowWalletModal(false);
    }
  );

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
            onClick={() => setShowWalletModal(true)}
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
              onClick={(e) => form.handleSubmit(e)}
              disabled={isLoading}
              className="rune-button flex-1 px-4 py-2 font-semibold button-press hover-lift disabled:opacity-50"
            >
              {isLoading ? "Connecting..." : "Connect"}
            </button>
          </>
        }
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ethereum Address (0x...)</label>
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
          </div>
          {storeError && <p className="text-sm text-red-400">{storeError}</p>}
        </form>
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
