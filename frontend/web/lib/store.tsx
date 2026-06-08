"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient, IdentityLink } from "./api";

interface UserSession {
  wallet: string | null;
  authToken: string | null;
  identityLink: IdentityLink | null;
  passport: any | null;
  profile: any | null;
  isConnected: boolean;
  isLoading: boolean;
}

interface RitualContextType extends UserSession {
  connectWallet: (wallet: string, message: string, signature: string) => Promise<void>;
  mintPassport: (classId: number, mintSignature: string) => Promise<void>;
  connectDiscord: (discordId: string, username: string) => Promise<IdentityLink>;
  disconnectWallet: () => void;
  fetchUserData: (wallet: string) => Promise<void>;
  clearError: () => void;
  error: string | null;
}

const RitualContext = createContext<RitualContextType | undefined>(undefined);

export const RitualProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>({
    wallet: null,
    authToken: null,
    identityLink: null,
    passport: null,
    profile: null,
    isConnected: false,
    isLoading: false,
  });
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async (wallet: string, message: string, signature: string) => {
    setSession((s) => ({ ...s, isLoading: true }));
    setError(null);

    try {
      // Validate wallet format (basic check)
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        throw new Error("Invalid wallet address format");
      }

      if (!signature) {
        throw new Error("Wallet signature is required to connect");
      }

      const authResponse = await apiClient.verifyAuthSignature(wallet, message, signature);
      if (authResponse.error || !authResponse.data) {
        throw new Error(authResponse.error || "Wallet signature could not be verified");
      }
      const authData = authResponse.data;
      const [passportRes, profileRes] = await Promise.all([
        apiClient.getPassport(authData.wallet),
        apiClient.getProfile(authData.wallet),
      ]);

      setSession((s) => ({
        ...s,
        wallet: authData.wallet,
        authToken: authData.token,
        isConnected: true,
        passport: passportRes.data?.passport ?? null,
        profile: profileRes.data?.profile ?? null,
        identityLink: profileRes.data?.profile.identityLink ?? null,
        isLoading: false,
      }));
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
        identityLink: profileRes.data?.profile.identityLink ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMsg);
      setSession((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const mintPassport = useCallback(async (classId: number, mintSignature: string) => {
    if (!session.wallet || !session.authToken) {
      throw new Error("Connect your wallet before minting");
    }

    if (!mintSignature) {
      throw new Error("Wallet mint signature is required");
    }

    setSession((s) => ({ ...s, isLoading: true }));

    try {
      const response = await apiClient.mintPassport(
        {
          wallet: session.wallet,
          classId,
          mintSignature,
        },
        session.authToken
      );

      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to mint passport");
      }

      const passport = response.data.passport;

      setSession((s) => ({
        ...s,
        passport,
        profile: {
          wallet: session.wallet,
          passport,
          achievements: [],
          completedQuests: [],
          identityLink: null,
        },
        identityLink: null,
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to mint passport";
      setError(errorMsg);
      setSession((s) => ({ ...s, isLoading: false }));
      throw err;
    }
  }, [session.authToken, session.wallet]);

  const connectDiscord = useCallback(async (discordId: string, username: string) => {
    if (!session.wallet || !session.authToken) {
      throw new Error("Connect your passport wallet before linking Discord");
    }

    if (session.identityLink && session.identityLink.discordId !== discordId) {
      throw new Error("This passport already has one Discord account linked");
    }

    const challengeResponse = await apiClient.createDiscordLinkChallenge(session.wallet, session.authToken);
    if (challengeResponse.error || !challengeResponse.data) {
      throw new Error(challengeResponse.error || "Failed to create Discord link challenge");
    }

    const response = await apiClient.verifyDiscordLink(
      {
        wallet: session.wallet,
        challenge: challengeResponse.data.challenge,
        discordId,
        username,
      },
      session.authToken
    );
    if (response.error || !response.data) {
      throw new Error(response.error || "Failed to connect Discord");
    }

    const identityLink: IdentityLink = {
      wallet: response.data.discord.connectedWallet ?? session.wallet,
      passportTokenId: session.passport?.tokenId ?? 0,
      discordId: response.data.discord.discordId,
      discordUsername: response.data.discord.username,
      discordAvatarUrl: response.data.discord.avatarUrl,
      discordAccountHash: response.data.discord.accountHash,
    };

    setSession((s) => ({
      ...s,
      identityLink,
      profile: s.profile ? { ...s.profile, identityLink } : s.profile,
    }));

    return identityLink;
  }, [session.authToken, session.identityLink, session.passport?.tokenId, session.wallet]);

  const disconnectWallet = useCallback(() => {
    setSession({
      wallet: null,
      authToken: null,
      identityLink: null,
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
    mintPassport,
    connectDiscord,
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
