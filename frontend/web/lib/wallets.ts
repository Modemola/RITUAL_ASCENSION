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

interface ChainMintConfig {
  chainId?: string;
  passportAddress?: string;
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

export async function requestWalletSignature(wallet: BrowserWallet, address: string, message: string): Promise<string> {
  const signature = await wallet.provider.request({
    method: "personal_sign",
    params: [message, address]
  });

  if (typeof signature !== "string" || !signature) {
    throw new Error("Wallet signature was not returned");
  }

  return signature;
}

export async function requestMintSignature(
  wallet: BrowserWallet,
  address: string,
  className: string
): Promise<{ message: string; signature: string }> {
  const issuedAt = new Date().toISOString();
  const message = [
    "Ritual Ascension passport mint",
    "",
    "Sign this message to mint your Soulbound Passport in local demo mode.",
    "When a PassportNFT address is configured, the app will use an on-chain mint transaction instead.",
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

  return { message, signature };
}

export function getChainMintConfig(): ChainMintConfig {
  return {
    chainId: process.env.NEXT_PUBLIC_RITUAL_CHAIN_ID,
    passportAddress: process.env.NEXT_PUBLIC_PASSPORT_NFT_ADDRESS
  };
}

export function isChainMintConfigured(config = getChainMintConfig()) {
  return Boolean(config.passportAddress && /^0x[a-fA-F0-9]{40}$/.test(config.passportAddress));
}

export async function mintPassportOnChain(
  wallet: BrowserWallet,
  address: string,
  classId: number,
  config = getChainMintConfig()
): Promise<string> {
  if (!isChainMintConfigured(config) || !config.passportAddress) {
    throw new Error("PassportNFT address is not configured");
  }

  if (!Number.isInteger(classId) || classId < 1 || classId > 5) {
    throw new Error("Builder class must be between 1 and 5");
  }

  if (config.chainId) {
    await switchChainIfNeeded(wallet, config.chainId);
  }

  const txHash = await wallet.provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: address,
        to: config.passportAddress,
        data: encodeMintPassportCall(classId)
      }
    ]
  });

  if (typeof txHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error("Wallet did not return a valid mint transaction hash");
  }

  await waitForTransactionReceipt(wallet, txHash);
  return txHash;
}

async function switchChainIfNeeded(wallet: BrowserWallet, decimalOrHexChainId: string) {
  const targetChainId = toHexChainId(decimalOrHexChainId);
  const currentChainId = await wallet.provider.request({ method: "eth_chainId" });

  if (typeof currentChainId === "string" && currentChainId.toLowerCase() === targetChainId.toLowerCase()) {
    return;
  }

  await wallet.provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: targetChainId }]
  });
}

function toHexChainId(chainId: string) {
  if (/^0x[0-9a-fA-F]+$/.test(chainId)) return chainId;

  const parsed = Number(chainId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("NEXT_PUBLIC_RITUAL_CHAIN_ID must be a decimal or hex chain ID");
  }

  return `0x${parsed.toString(16)}`;
}

function encodeMintPassportCall(classId: number) {
  const selector = "b00d78ae";
  const encodedClassId = classId.toString(16).padStart(64, "0");
  return `0x${selector}${encodedClassId}`;
}

async function waitForTransactionReceipt(wallet: BrowserWallet, txHash: string) {
  const startedAt = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - startedAt < timeoutMs) {
    const receipt = await wallet.provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash]
    });

    if (isTransactionReceipt(receipt)) {
      if (receipt.status && receipt.status !== "0x1") {
        throw new Error("Passport mint transaction reverted");
      }
      return receipt;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }

  throw new Error("Timed out waiting for passport mint confirmation");
}

function isTransactionReceipt(value: unknown): value is { status?: string } {
  return Boolean(value && typeof value === "object" && "transactionHash" in value);
}
