export const passportNftAbi = [
  "function hasMinted(address wallet) view returns (bool)",
  "function tokenOfOwner(address wallet) view returns (uint256)",
  "function passportClass(uint256 tokenId) view returns (uint8)",
  "function passportStage(uint256 tokenId) view returns (uint8)",
  "event PassportMinted(address indexed owner, uint256 indexed tokenId, uint8 classId)",
  "event StageAdvanced(uint256 indexed tokenId, uint8 newStage, uint256 timestamp)"
] as const;

export const progressManagerAbi = [
  "function getXP(address wallet) view returns (uint256)",
  "function totalXP(address wallet) view returns (uint256)",
  "event XPAwarded(address indexed wallet, uint256 amount, string reason, bytes32 sourceRef)"
] as const;
