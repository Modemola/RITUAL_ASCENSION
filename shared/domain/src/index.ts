export type BuilderClassId = 1 | 2 | 3 | 4 | 5;

export type QuestType = "CORE" | "CLASS" | "ORACLE" | "FULL_PROJECT" | "COMMUNITY";

export type VerificationMethod = "TX_HASH" | "MANUAL_REVIEW" | "AI_REVIEW";

export type QuestStatus = "available" | "in_progress" | "completed" | "locked";

export interface BuilderClass {
  id: BuilderClassId;
  name: string;
  focus: string;
  achievement: string;
  tone: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  classId?: BuilderClassId;
  xp: number;
  verification: VerificationMethod;
  status: QuestStatus;
  expectedProof: string;
}

export interface Achievement {
  id: string;
  name: string;
  trigger: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  xpBonus: number;
  unlocked: boolean;
}

export interface PassportProfile {
  wallet: string;
  tokenId: number;
  classId: BuilderClassId;
  xp: number;
  stage: number;
  achievements: Achievement[];
  completedQuestIds: string[];
  activeWeeks: number;
  projectsCompleted: number;
  agentsDeployed: number;
}

export const builderClasses: BuilderClass[] = [
  {
    id: 1,
    name: "Builder",
    focus: "Solidity, smart contracts, protocols, and DeFi primitives",
    achievement: "Protocol Architect",
    tone: "Protocol-first and systems-minded"
  },
  {
    id: 2,
    name: "Agent Smith",
    focus: "Autonomous agents, AI automation, job scheduling, and AI systems",
    achievement: "Agent Overlord",
    tone: "Automation-heavy and experimental"
  },
  {
    id: 3,
    name: "Creator",
    focus: "AI media, generative NFTs, image models, and AI art",
    achievement: "Digital Alchemist",
    tone: "Expressive and artifact-driven"
  },
  {
    id: 4,
    name: "Analyst",
    focus: "Dashboards, on-chain metrics, data pipelines, and indexing",
    achievement: "Data Oracle",
    tone: "Evidence-led and clarity obsessed"
  },
  {
    id: 5,
    name: "Explorer",
    focus: "Broad onboarding, learning paths, and community participation",
    achievement: "Trailblazer",
    tone: "Curious and wide-ranging"
  }
];

export const evolutionStages = [
  { id: 1, name: "Genesis", trigger: "Passport minted" },
  { id: 2, name: "Initiate", trigger: "First contract deployed on Ritual" },
  { id: 3, name: "Builder", trigger: "First Ritual LLM precompile call" },
  { id: 4, name: "Architect", trigger: "First full project quest completed" },
  { id: 5, name: "Ascendant", trigger: "Reputation reaches 90 or community approval" }
];

export const quests: Quest[] = [
  {
    id: "deploy-contract",
    title: "Deploy Your First Ritual Contract",
    description: "Ship a small contract to Ritual testnet and submit the deployment transaction hash.",
    type: "CORE",
    xp: 500,
    verification: "TX_HASH",
    status: "available",
    expectedProof: "Deployment transaction hash"
  },
  {
    id: "llm-precompile",
    title: "Call the Ritual LLM Precompile",
    description: "Make a verified call to the Ritual LLM precompile and capture the successful transaction.",
    type: "CORE",
    xp: 750,
    verification: "TX_HASH",
    status: "in_progress",
    expectedProof: "Transaction hash with LLM precompile logs"
  },
  {
    id: "build-agent",
    title: "Deploy an Autonomous Agent",
    description: "Create an agent that can perform a scheduled on-chain or off-chain action.",
    type: "CLASS",
    classId: 2,
    xp: 1000,
    verification: "TX_HASH",
    status: "available",
    expectedProof: "Agent deployment transaction hash"
  },
  {
    id: "analytics-dashboard",
    title: "Build a Ritual Analytics Dashboard",
    description: "Publish a public dashboard that tracks useful Ritual ecosystem activity.",
    type: "CLASS",
    classId: 4,
    xp: 1500,
    verification: "AI_REVIEW",
    status: "available",
    expectedProof: "GitHub or live dashboard URL"
  },
  {
    id: "full-project",
    title: "Launch a Full Ritual Project",
    description: "Combine contracts, a frontend, and documented usage into a complete builder artifact.",
    type: "FULL_PROJECT",
    xp: 2500,
    verification: "MANUAL_REVIEW",
    status: "locked",
    expectedProof: "Repository URL and project summary"
  },
  {
    id: "oracle-checkin",
    title: "Ask the Oracle for Your Next Move",
    description: "Start an Oracle Mentor conversation and turn the recommendation into your next quest.",
    type: "ORACLE",
    xp: 300,
    verification: "MANUAL_REVIEW",
    status: "available",
    expectedProof: "Oracle conversation ID"
  }
];

export const achievements: Achievement[] = [
  {
    id: "ACH_001",
    name: "First Blood",
    trigger: "First contract deployment quest completed",
    rarity: "Common",
    xpBonus: 0,
    unlocked: true
  },
  {
    id: "ACH_002",
    name: "AI Summoner",
    trigger: "First Ritual LLM precompile call verified",
    rarity: "Common",
    xpBonus: 0,
    unlocked: false
  },
  {
    id: "ACH_004",
    name: "Founder",
    trigger: "First full project quest completed",
    rarity: "Epic",
    xpBonus: 1000,
    unlocked: false
  },
  {
    id: "ACH_006",
    name: "Oracle Whisperer",
    trigger: "50 Oracle Mentor conversations initiated",
    rarity: "Uncommon",
    xpBonus: 300,
    unlocked: false
  },
  {
    id: "ACH_010",
    name: "Ascendant",
    trigger: "Passport reaches Stage 5",
    rarity: "Legendary",
    xpBonus: 5000,
    unlocked: false
  }
];

export const levelThresholds = [
  0, 500, 1500, 3000, 5000, 8000, 11000, 14000, 17000, 20000, 23000, 28000,
  33000, 38000, 43000, 48000, 53000, 58000, 63000, 68000, 73000, 81000, 89000,
  97000, 105000, 113000, 121000, 129000, 137000, 145000, 153000, 161000, 169000,
  177000, 185000, 193000, 205000, 217000, 229000, 241000, 253000, 265000, 277000,
  289000, 301000, 313000, 325000, 337000, 349000, 361000
];

export function getLevel(xp: number): number {
  return Math.min(50, levelThresholds.filter((threshold) => xp >= threshold).length);
}

export function getTier(level: number): string {
  if (level >= 36) return "Ascendant";
  if (level >= 21) return "Architect";
  if (level >= 11) return "Builder";
  if (level >= 6) return "Apprentice";
  return "Initiate";
}

export function getLevelProgress(xp: number): { level: number; percent: number; nextXp: number } {
  const level = getLevel(xp);
  const current = levelThresholds[level - 1] ?? 0;
  const next = levelThresholds[level] ?? current;
  const span = Math.max(1, next - current);
  return {
    level,
    percent: Math.min(100, Math.round(((xp - current) / span) * 100)),
    nextXp: next
  };
}

export function calculateReputation(profile: PassportProfile): number {
  const xpScore = Math.min(profile.xp / 50000, 1) * 100;
  const achievementScore = Math.min(profile.achievements.filter((item) => item.unlocked).length / 20, 1) * 100;
  const projectScore = Math.min(profile.projectsCompleted / 5, 1) * 100;
  const agentScore = Math.min(profile.agentsDeployed / 10, 1) * 100;
  const consistencyScore = Math.min(profile.activeWeeks / 12, 1) * 100;

  return Math.round(
    xpScore * 0.4 +
      achievementScore * 0.2 +
      projectScore * 0.2 +
      agentScore * 0.1 +
      consistencyScore * 0.1
  );
}

export const demoPassport: PassportProfile = {
  wallet: "0xA5C3f19D0b8e6A45B6f1b9B4A21c7F1D9E3b8124",
  tokenId: 42,
  classId: 1,
  xp: 3450,
  stage: 2,
  achievements,
  completedQuestIds: ["deploy-contract"],
  activeWeeks: 3,
  projectsCompleted: 0,
  agentsDeployed: 1
};

export const leaderboard = [
  { wallet: "0x9f7E...18B2", className: "Agent Smith", reputation: 88, level: 31 },
  { wallet: "0xA5C3...8124", className: "Builder", reputation: calculateReputation(demoPassport), level: getLevel(demoPassport.xp) },
  { wallet: "0x71Ca...D447", className: "Analyst", reputation: 37, level: 12 },
  { wallet: "0x45a1...F902", className: "Creator", reputation: 29, level: 9 }
];

export function getBuilderClass(id: BuilderClassId): BuilderClass {
  return builderClasses.find((builderClass) => builderClass.id === id) ?? builderClasses[0];
}
