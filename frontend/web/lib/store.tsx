"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { apiClient } from "./api";

interface UserSession {
  wallet: string | null;
  passport: any | null;
  profile: any | null;
  isConnected: boolean;
  isLoading: boolean;
}

interface RitualContextType extends UserSession {
  connectWallet: (wallet: string) => Promise<void>;
  disconnectWallet: () => void;
  fetchUserData: (wallet: string) => Promise<void>;
  clearError: () => void;
  error: string | null;
}

const RitualContext = createContext<RitualContextType | undefined>(undefined);

export const RitualProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({
    wallet: null,
    passport: null,
    profile: null,
    isConnected: false,
    isLoading: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("ritual_wallet");
    if (savedWallet) {
      connectWallet(savedWallet);
    }
  }, []);

  const connectWallet = useCallback(async (wallet: string) => {
    setSession((s) => ({ ...s, isLoading: true }));
    setError(null);

    try {
      // Validate wallet format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        throw new Error("Invalid wallet address format");
      }

      // Store wallet
      localStorage.setItem("ritual_wallet", wallet);
      setSession((s) => ({
        ...s,
        wallet,
        isConnected: true,
      }));

      // Fetch user data
      await fetchUserData(wallet);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMsg);
      setSession((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const fetchUserData = useCallback(async (wallet: string) => {
    try {
      const [passportRes, profileRes] = await Promise.all([
        apiClient.getPassport(wallet),
        apiClient.getProfile(wallet),
      ]);

      setSession((s) => ({
        ...s,
        passport: passportRes.data?.passport ?? null,
        profile: profileRes.data?.profile ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMsg);
      setSession((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    localStorage.removeItem("ritual_wallet");
    setSession({
      wallet: null,
      passport: null,
      profile: null,
      isConnected: false,
      isLoading: false,
    });
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: RitualContextType = {
    ...session,
    connectWallet,
    disconnectWallet,
    fetchUserData,
    clearError,
    error,
  };

  return <RitualContext.Provider value={value}>{children}</RitualContext.Provider>;
};

export const useRitual = () => {
  const context = useContext(RitualContext);
  if (!context) {
    throw new Error("useRitual must be used within RitualProvider");
  }
  return context;
};
