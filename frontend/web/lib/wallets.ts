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

// With multiple wallet extensions installed, picking discoverBrowserWallets()[0]
// silently swaps to whichever extension happens to announce first — not
// necessarily the one the session's wallet address actually belongs to. This
// finds the specific already-authorized wallet for that address using
// eth_accounts, which never prompts (unlike eth_requestAccounts), so probing
// every installed wallet doesn't pop up a connection dialog for each one.
export async function findConnectedBrowserWallet(
  wallets: BrowserWallet[],
  targetAddress: string
): Promise<BrowserWallet | null> {
  const normalizedTarget = targetAddress.toLowerCase();

  for (const candidate of wallets) {
    try {
      const accounts = await candidate.provider.request({ method: "eth_accounts" });
      if (Array.isArray(accounts) && accounts.some((a) => typeof a === "string" && a.toLowerCase() === normalizedTarget)) {
        return candidate;
      }
    } catch {
      // Some providers reject eth_accounts if never connected — skip and keep looking.
    }
  }

  return null;
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

  // Ritual chain only accepts EIP-1559 (type 2) transactions. Leaving gas
  // fields unset lets some wallets default to a legacy gasPrice-style
  // transaction on unfamiliar chains, which the RPC then rejects outright
  // with "transaction type not supported" — so fetch live fee data and set
  // maxFeePerGas/maxPriorityFeePerGas explicitly instead of gasPrice.
  const fees = await getEip1559Fees(wallet);

  const txHash = await wallet.provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: address,
        to: config.passportAddress,
        data: encodeMintPassportCall(classId),
        type: "0x2",
        ...fees
      }
    ]
  });

  if (typeof txHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    throw new Error("Wallet did not return a valid mint transaction hash");
  }

  await waitForTransactionReceipt(wallet, txHash);
  return txHash;
}

// Conservative EIP-1559 fallback if the live fee query fails or the wallet
// doesn't proxy eth_maxPriorityFeePerGas/eth_getBlockByNumber correctly for
// an unfamiliar chain. Ritual's real network fees observed at time of
// writing are well under 1 gwei, so this leaves generous headroom while
// still guaranteeing we always send maxFeePerGas/maxPriorityTFeePerGas —
// never gasPrice, and never nothing — so the wallet can't fall back to a
// legacy-style transaction that this chain's RPC rejects.
const FALLBACK_MAX_PRIORITY_FEE_PER_GAS = 2_000_000_000n; // 2 gwei
const FALLBACK_MAX_FEE_PER_GAS = 10_000_000_000n; // 10 gwei

async function getEip1559Fees(wallet: BrowserWallet): Promise<{ maxFeePerGas: string; maxPriorityFeePerGas: string }> {
  try {
    const [priorityFeeHex, block] = await Promise.all([
      wallet.provider.request({ method: "eth_maxPriorityFeePerGas" }) as Promise<string>,
      wallet.provider.request({ method: "eth_getBlockByNumber", params: ["latest", false] }) as Promise<{ baseFeePerGas?: string }>
    ]);

    const baseFeePerGas = block?.baseFeePerGas ? BigInt(block.baseFeePerGas) : null;
    const maxPriorityFeePerGas = BigInt(priorityFeeHex);
    if (baseFeePerGas === null || maxPriorityFeePerGas <= 0n) {
      throw new Error("Chain did not return usable EIP-1559 fee data");
    }

    const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

    return {
      maxFeePerGas: `0x${maxFeePerGas.toString(16)}`,
      maxPriorityFeePerGas: `0x${maxPriorityFeePerGas.toString(16)}`
    };
  } catch (error) {
    console.warn("Falling back to a fixed EIP-1559 fee for the mint transaction:", error);
    return {
      maxFeePerGas: `0x${FALLBACK_MAX_FEE_PER_GAS.toString(16)}`,
      maxPriorityFeePerGas: `0x${FALLBACK_MAX_PRIORITY_FEE_PER_GAS.toString(16)}`
    };
  }
}

// Public RPC endpoint, safe to ship client-side (no key). Mirrors RITUAL_RPC_URL
// on the backend — update both if the RPC endpoint ever changes.
const RITUAL_PUBLIC_RPC_URL = "https://rpc.ritualfoundation.org/";

async function switchChainIfNeeded(wallet: BrowserWallet, decimalOrHexChainId: string) {
  const targetChainId = toHexChainId(decimalOrHexChainId);
  const currentChainId = await wallet.provider.request({ method: "eth_chainId" });

  if (typeof currentChainId === "string" && currentChainId.toLowerCase() === targetChainId.toLowerCase()) {
    return;
  }

  // wallet_addEthereumChain registers full chain metadata with the wallet —
  // for wallets that only have a bare-minimum profile for this chain (added
  // manually by the user with no metadata), this gives them enough to build
  // a correct transaction instead of falling back to legacy format. If the
  // wallet already knows this chain, most implementations just switch.
  try {
    await wallet.provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: targetChainId,
          chainName: "Ritual Chain",
          nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
          rpcUrls: [RITUAL_PUBLIC_RPC_URL]
        }
      ]
    });
    return;
  } catch {
    // Fall through to a plain switch — some wallets reject re-adding an
    // already-known chain rather than treating it as a no-op.
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
