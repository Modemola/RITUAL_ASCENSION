"use client";

export interface BrowserWallet {
  id: string;
  name: string;
  icon?: string;
  provider: Eip1193Provider;
}

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isRabby?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  providers?: Eip1193Provider[];
}

interface Eip6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
  };
  provider: Eip1193Provider;
}

type EthereumWindow = Window & {
  ethereum?: Eip1193Provider;
};

function getInjectedProviderName(provider: Eip1193Provider, index: number) {
  if (provider.isRabby) return "Rabby";
  if (provider.isCoinbaseWallet) return "Coinbase Wallet";
  if (provider.isTrust) return "Trust Wallet";
  if (provider.isMetaMask) return "MetaMask";
  return index === 0 ? "Injected EVM Wallet" : `Injected EVM Wallet ${index + 1}`;
}

function uniqueWallets(wallets: BrowserWallet[]) {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    const key = `${wallet.id}:${wallet.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function discoverBrowserWallets(timeoutMs = 500): Promise<BrowserWallet[]> {
  if (typeof window === "undefined") return [];

  const discovered: BrowserWallet[] = [];

  const handleAnnouncement = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
    if (!detail?.provider || !detail?.info) return;

    discovered.push({
      id: detail.info.rdns || detail.info.uuid,
      name: detail.info.name,
      icon: detail.info.icon,
      provider: detail.provider,
    });
  };

  window.addEventListener("eip6963:announceProvider", handleAnnouncement);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  await new Promise((resolve) => setTimeout(resolve, timeoutMs));
  window.removeEventListener("eip6963:announceProvider", handleAnnouncement);

  const ethereum = (window as EthereumWindow).ethereum;
  if (ethereum) {
    const providers = ethereum.providers?.length ? ethereum.providers : [ethereum];
    providers.forEach((provider, index) => {
      discovered.push({
        id: `injected-${index}-${getInjectedProviderName(provider, index).toLowerCase().replace(/\s+/g, "-")}`,
        name: getInjectedProviderName(provider, index),
        provider,
      });
    });
  }

  return uniqueWallets(discovered);
}

export async function requestWalletAddress(wallet: BrowserWallet): Promise<string> {
  const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
  if (!Array.isArray(accounts) || typeof accounts[0] !== "string") {
    throw new Error("No EVM account returned by wallet");
  }

  return accounts[0];
}

export async function requestWalletSignature(wallet: BrowserWallet, address: string): Promise<string> {
  const issuedAt = new Date().toISOString();
  const message = [
    "Ritual Ascension wallet verification",
    "",
    "Sign this message to connect your wallet for this session.",
    "This does not approve a transaction or spend funds.",
    "",
    `Wallet: ${address}`,
    `Issued At: ${issuedAt}`
  ].join("\n");

  const signature = await wallet.provider.request({
    method: "personal_sign",
    params: [message, address]
  });

  if (typeof signature !== "string" || !signature) {
    throw new Error("Wallet signature was not returned");
  }

  return signature;
}

export async function requestMintSignature(wallet: BrowserWallet, address: string, className: string): Promise<string> {
  const issuedAt = new Date().toISOString();
  const message = [
    "Ritual Ascension passport mint",
    "",
    "Sign this message to mint your Soulbound Passport in this demo flow.",
    "Production will replace this with PassportNFT.mintPassport.",
    "",
    `Wallet: ${address}`,
    `Class: ${className}`,
    `Issued At: ${issuedAt}`
  ].join("\n");

  const signature = await wallet.provider.request({
    method: "personal_sign",
    params: [message, address]
  });

  if (typeof signature !== "string" || !signature) {
    throw new Error("Mint signature was not returned");
  }

  return signature;
}
