const walletPattern = /^0x[a-fA-F0-9]{40}$/;

export function normalizeWallet(wallet?: string) {
  return typeof wallet === "string" && walletPattern.test(wallet) ? wallet.toLowerCase() : null;
}

export function isWalletAddress(wallet?: string) {
  return normalizeWallet(wallet) !== null;
}
