export const passportNftAbi = [
  "function hasMinted(address wallet) view returns (bool)",
  "function tokenOfOwner(address wallet) view returns (uint256)",
  "function passportClass(uint256 tokenId) view returns (uint8)",
  "function passportStage(uint256 tokenId) view returns (uint8)"
] as const;

export const progressManagerAbi = [
  "function getXP(address wallet) view returns (uint256)",
  "function totalXP(address wallet) view returns (uint256)"
] as const;
