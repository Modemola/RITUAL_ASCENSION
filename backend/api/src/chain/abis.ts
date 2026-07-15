export const passportNftAbi = [
  "function hasMinted(address wallet) view returns (bool)",
  "function tokenOfOwner(address wallet) view returns (uint256)",
  "function passportClass(uint256 tokenId) view returns (uint8)",
  "function passportStage(uint256 tokenId) view returns (uint8)",
  "function discordAccountHash(uint256 tokenId) view returns (bytes32)",
  "function linkDiscordAccount(address wallet, bytes32 discordHash)",
  "function updateStage(uint256 tokenId, uint8 newStage)",
  "event PassportMinted(address indexed owner, uint256 indexed tokenId, uint8 classId)",
  "event StageAdvanced(uint256 indexed tokenId, uint8 newStage, uint256 timestamp)",
  "event DiscordAccountLinked(address indexed owner, uint256 indexed tokenId, bytes32 indexed discordHash)"
] as const;

export const progressManagerAbi = [
  "function getXP(address wallet) view returns (uint256)",
  "function totalXP(address wallet) view returns (uint256)",
  "function usedSourceRefs(bytes32 sourceRef) view returns (bool)",
  "function awardXP(address wallet, uint256 amount, string reason, bytes32 sourceRef)",
  "event XPAwarded(address indexed wallet, uint256 amount, string reason, bytes32 sourceRef)"
] as const;
