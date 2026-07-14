export type BuilderClassId = 1 | 2 | 3 | 4 | 5;

export type QuestType = "CORE" | "CLASS" | "ORACLE" | "FULL_PROJECT" | "COMMUNITY";

export type QuestCategoryId = "builders" | "testers" | "discord";

export type VerificationMethod =
  | "TX_HASH"
  | "MANUAL_REVIEW"
  | "AI_REVIEW"
  | "TESTNET_ACTIVITY"
  | "DISCORD_ACTIVITY"
  | "DISCORD_ROLE";

export type QuestStatus = "available" | "in_progress" | "completed" | "locked";

export type QuestDifficulty = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type TestnetMetric = "completedTasks" | "uniqueContracts" | "transactions" | "activeDays";

export type DiscordMetric = "messages" | "roles";

export interface QuestCategory {
  id: QuestCategoryId;
  name: string;
  shortName: string;
  description: string;
  verificationSummary: string;
}

export interface BuilderClass {
  id: BuilderClassId;
  name: string;
  focus: string;
  achievement: string;
  tone: string;
}

export type MascotId = "siggy" | "ploplo" | "initiate";

export interface Mascot {
  id: MascotId;
  name: string;
  tagline: string;
  accentColor: string;
  welcomeLine: string;
  voiceInstructions: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategoryId;
  type: QuestType;
  classId?: BuilderClassId;
  xp: number;
  verification: VerificationMethod;
  status: QuestStatus;
  expectedProof: string;
  difficulty: QuestDifficulty;
  steps: string[];
  limit?: number;
  metric?: TestnetMetric | DiscordMetric;
  target?: number;
  roleName?: string;
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

export interface TestnetActivity {
  wallet: string;
  network: "ritual-testnet";
  completedTasks: number;
  uniqueContracts: number;
  transactions: number;
  activeDays: number;
  lastIndexedBlock: number;
}

export interface DiscordActivity {
  discordId: string;
  username: string;
  serverId: string;
  messages: number;
  roles: string[];
  connectedWallet?: string;
}

export interface IdentityLink {
  wallet: string;
  passportTokenId: number;
  discordId: string;
  discordUsername: string;
  discordAvatarUrl?: string;
  discordAccountHash?: string;
}

export interface VerifiedRitualProduct {
  id: string;
  name: string;
  builderWallet: string;
  category: "Agent" | "Dashboard" | "Template" | "Protocol" | "Tool";
  description: string;
  url: string;
  repositoryUrl?: string;
  approvedAt: string;
  verificationBadge: "Backend approved" | "Security reviewed" | "Community verified";
  tags: string[];
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

export const mascots: Mascot[] = [
  {
    id: "siggy",
    name: "Siggy",
    tagline: "Your upbeat campus companion",
    accentColor: "#ef4444",
    welcomeLine: "Siggy's here! Let's figure out your next move.",
    voiceInstructions:
      "You are speaking as Siggy — playful, upbeat, quick with a light joke or aside, casual phrasing. Still genuinely helpful and never lets the jokes get in the way of a real answer."
  },
  {
    id: "ploplo",
    name: "Ploplo",
    tagline: "A visitor from somewhere else entirely",
    accentColor: "#8b5cf6",
    welcomeLine: "Ploplo has arrived! Many questions, much curiosity — let's begin.",
    voiceInstructions:
      "You are speaking as Ploplo — a warm, curious visitor from another planet. Occasionally slip in charmingly offbeat interplanetary phrasing (references to 'back home', slightly imperfect but endearing grammar) without ever becoming hard to understand or losing the thread of the answer."
  },
  {
    id: "initiate",
    name: "Initiate",
    tagline: "Serious, focused, no wasted words",
    accentColor: "#f59e0b",
    welcomeLine: "Initiate is ready. State your objective.",
    voiceInstructions:
      "You are speaking as Initiate — serious, focused, economical with words. No jokes, no small talk. Mentor-like discipline: direct answers, clear next steps."
  }
];

export const evolutionStages = [
  { id: 1, name: "Genesis", trigger: "Passport minted" },
  { id: 2, name: "Initiate", trigger: "First contract deployed on Ritual" },
  { id: 3, name: "Builder", trigger: "First Ritual LLM precompile call" },
  { id: 4, name: "Architect", trigger: "First full project quest completed" },
  { id: 5, name: "Ascendant", trigger: "Reputation reaches 90 or community approval" }
];

export const questCategories: QuestCategory[] = [
  {
    id: "builders",
    name: "Builders on Ritual",
    shortName: "Builders",
    description: "Product-building quests for builders shipping contracts, apps, agents, dashboards, and full Ritual projects.",
    verificationSummary: "Validated with transaction hashes, shipped project links, AI review, or manual review."
  },
  {
    id: "testers",
    name: "Testers on Ritual",
    shortName: "Testers",
    description: "Testnet participation quests for wallets that complete tasks, interact with contracts, and keep Ritual testnet activity alive.",
    verificationSummary: "Validated from Ritual testnet wallet activity only."
  },
  {
    id: "discord",
    name: "Discord tasks",
    shortName: "Discord",
    description: "Community progression quests tied to activity and roles inside the Ritual Discord server.",
    verificationSummary: "Validated through a connected Discord account and Ritual Discord server roles/activity."
  }
];

export const quests: Quest[] = [
  {
    id: "deploy-contract",
    title: "Deploy Your First Ritual Contract",
    description: "Ship a small contract to Ritual testnet and submit the deployment transaction hash.",
    category: "builders",
    type: "CORE",
    xp: 500,
    verification: "TX_HASH",
    status: "available",
    expectedProof: "Deployment transaction hash",
    difficulty: "common",
    steps: [
      "Deploy a contract on Ritual testnet.",
      "Copy the deployment transaction hash.",
      "Submit the hash for verification."
    ]
  },
  {
    id: "llm-precompile",
    title: "Call the Ritual LLM Precompile",
    description: "Make a verified call to the Ritual LLM precompile and capture the successful transaction.",
    category: "builders",
    type: "CORE",
    xp: 750,
    verification: "TX_HASH",
    status: "in_progress",
    expectedProof: "Transaction hash with LLM precompile logs",
    difficulty: "uncommon",
    steps: [
      "Call the Ritual LLM precompile from a contract or script.",
      "Confirm the transaction succeeded on Ritual testnet.",
      "Submit the transaction hash with the relevant logs."
    ]
  },
  {
    id: "build-agent",
    title: "Deploy an Autonomous Agent",
    description: "Create an agent that can perform a scheduled on-chain or off-chain action.",
    category: "builders",
    type: "CLASS",
    classId: 2,
    xp: 1000,
    verification: "TX_HASH",
    status: "available",
    expectedProof: "Agent deployment transaction hash",
    difficulty: "rare",
    steps: [
      "Build an autonomous agent for a useful Ritual workflow.",
      "Deploy or register the agent.",
      "Submit the transaction hash or public run proof."
    ]
  },
  {
    id: "analytics-dashboard",
    title: "Build a Ritual Analytics Dashboard",
    description: "Publish a public dashboard that tracks useful Ritual ecosystem activity.",
    category: "builders",
    type: "CLASS",
    classId: 4,
    xp: 1500,
    verification: "AI_REVIEW",
    status: "available",
    expectedProof: "GitHub or live dashboard URL",
    difficulty: "rare",
    steps: [
      "Build a dashboard with useful Ritual testnet or ecosystem data.",
      "Publish the dashboard or repository.",
      "Submit the public URL for review."
    ]
  },
  {
    id: "full-project",
    title: "Launch a Full Ritual Project",
    description: "Combine contracts, a frontend, and documented usage into a complete builder artifact.",
    category: "builders",
    type: "FULL_PROJECT",
    xp: 2500,
    verification: "MANUAL_REVIEW",
    status: "locked",
    expectedProof: "Repository URL and project summary",
    difficulty: "legendary",
    steps: [
      "Ship a full Ritual project with contracts, frontend, and docs.",
      "Publish a repository or live demo.",
      "Submit the project summary for manual review."
    ]
  },
  {
    id: "oracle-checkin",
    title: "Ask the Oracle for Your Next Move",
    description: "Start an Oracle Mentor conversation and turn the recommendation into your next quest.",
    category: "builders",
    type: "ORACLE",
    xp: 300,
    verification: "MANUAL_REVIEW",
    status: "available",
    expectedProof: "Oracle conversation ID",
    difficulty: "common",
    steps: [
      "Open the Oracle mentor.",
      "Ask for the next best Ritual builder task.",
      "Submit the Oracle conversation ID."
    ]
  },
  {
    id: "tester-contract-explorer",
    title: "Interact With 10 Different Ritual Contracts",
    description: "Explore the testnet by interacting with ten unique contract addresses on Ritual testnet.",
    category: "testers",
    type: "COMMUNITY",
    xp: 900,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with interactions across 10 unique Ritual testnet contracts",
    difficulty: "rare",
    steps: [
      "Use your wallet across different Ritual testnet contracts.",
      "Reach at least ten unique contract interactions.",
      "Run Ritual testnet wallet verification."
    ],
    limit: 1,
    metric: "uniqueContracts",
    target: 10
  },
  {
    id: "tester-active-week",
    title: "Stay Active for 7 Ritual Testnet Days",
    description: "Build testnet consistency by recording wallet activity across seven different days.",
    category: "testers",
    type: "COMMUNITY",
    xp: 700,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with Ritual testnet activity on 7 different days",
    difficulty: "uncommon",
    steps: [
      "Use Ritual testnet across several days.",
      "Reach seven unique active days.",
      "Run the wallet activity check."
    ],
    limit: 1,
    metric: "activeDays",
    target: 7
  },
  {
    id: "discord-first-message",
    title: "Send Your First Ritual Discord Message",
    description: "Join the Ritual Discord server and send the first message from your connected Discord account.",
    category: "discord",
    type: "COMMUNITY",
    xp: 100,
    verification: "DISCORD_ACTIVITY",
    status: "available",
    expectedProof: "Connected Discord account with at least 1 message in the Ritual server",
    difficulty: "common",
    steps: [
      "Connect your Discord account.",
      "Send a message in the Ritual Discord server.",
      "Run Discord activity verification."
    ],
    limit: 1,
    metric: "messages",
    target: 1
  },
  {
    id: "discord-bitty-role",
    title: "Attain the Bitty Role",
    description: "Earn the Bitty role in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 250,
    verification: "DISCORD_ROLE",
    status: "available",
    expectedProof: "Connected Discord account with the Bitty role in the Ritual server",
    difficulty: "uncommon",
    steps: [
      "Connect your Discord account.",
      "Earn or receive the Bitty role in the Ritual server.",
      "Run Discord role verification."
    ],
    limit: 1,
    metric: "roles",
    roleName: "Bitty"
  },
  {
    id: "discord-ritty-role",
    title: "Attain the Ritty Role",
    description: "Earn the Ritty role in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 500,
    verification: "DISCORD_ROLE",
    status: "available",
    expectedProof: "Connected Discord account with the Ritty role in the Ritual server",
    difficulty: "rare",
    steps: [
      "Connect your Discord account.",
      "Earn or receive the Ritty role in the Ritual server.",
      "Run Discord role verification."
    ],
    limit: 1,
    metric: "roles",
    roleName: "Ritty"
  },
  {
    id: "discord-community-voice",
    title: "Send 100 Ritual Discord Messages",
    description: "Become an active Ritual community member with one hundred messages in the server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 1000,
    verification: "DISCORD_ACTIVITY",
    status: "available",
    expectedProof: "Connected Discord account with at least 100 messages in the Ritual server",
    difficulty: "epic",
    steps: [
      "Connect your Discord account.",
      "Participate constructively in the Ritual Discord server.",
      "Run Discord activity verification after reaching 100 messages."
    ],
    limit: 1,
    metric: "messages",
    target: 100
  },
  {
    id: "builder-starter-frontend",
    title: "Ship a Ritual Frontend",
    description: "Build a public frontend that reads from or writes to a Ritual testnet contract.",
    category: "builders",
    type: "FULL_PROJECT",
    xp: 1200,
    verification: "AI_REVIEW",
    status: "available",
    expectedProof: "Live app URL and repository URL",
    difficulty: "rare",
    steps: [
      "Build a usable frontend for a Ritual testnet contract.",
      "Publish the frontend and source code.",
      "Submit the live URL and repository for review."
    ],
    limit: 1
  },
  {
    id: "builder-open-source-template",
    title: "Publish a Ritual Starter Template",
    description: "Create a reusable starter repo that helps other builders ship faster on Ritual.",
    category: "builders",
    type: "FULL_PROJECT",
    xp: 1800,
    verification: "MANUAL_REVIEW",
    status: "available",
    expectedProof: "Template repository URL with setup instructions",
    difficulty: "epic",
    steps: [
      "Create a starter template for a Ritual builder workflow.",
      "Document setup, environment variables, and deployment.",
      "Submit the repository for manual review."
    ],
    limit: 1
  },
  {
    id: "builder-contract-suite",
    title: "Deploy a Contract Suite",
    description: "Deploy at least three related contracts that work together as one Ritual protocol primitive.",
    category: "builders",
    type: "CORE",
    xp: 1600,
    verification: "TX_HASH",
    status: "available",
    expectedProof: "Deployment transaction hashes for the related contracts",
    difficulty: "rare",
    steps: [
      "Design three related contracts.",
      "Deploy them on Ritual testnet.",
      "Submit the transaction hashes for verification."
    ],
    limit: 1
  },
  {
    id: "builder-integration-guide",
    title: "Write a Ritual Integration Guide",
    description: "Publish a technical guide that teaches another builder how to use a Ritual primitive.",
    category: "builders",
    type: "COMMUNITY",
    xp: 800,
    verification: "MANUAL_REVIEW",
    status: "available",
    expectedProof: "Published guide URL",
    difficulty: "uncommon",
    steps: [
      "Choose a Ritual primitive or workflow.",
      "Write a clear technical guide with runnable examples.",
      "Submit the published URL for review."
    ],
    limit: 1
  },
  {
    id: "tester-fifty-transactions",
    title: "Send 50 Ritual Testnet Transactions",
    description: "Prove hands-on testing by sending fifty successful transactions on Ritual testnet.",
    category: "testers",
    type: "COMMUNITY",
    xp: 850,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with at least 50 Ritual testnet transactions",
    difficulty: "uncommon",
    steps: [
      "Use Ritual testnet contracts with your connected wallet.",
      "Reach fifty successful transactions.",
      "Run Ritual testnet wallet verification."
    ],
    limit: 1,
    metric: "transactions",
    target: 50
  },
  {
    id: "tester-hundred-transactions",
    title: "Send 100 Ritual Testnet Transactions",
    description: "Reach the capped transaction-volume tester milestone on Ritual testnet.",
    category: "testers",
    type: "COMMUNITY",
    xp: 1500,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with at least 100 Ritual testnet transactions",
    difficulty: "epic",
    steps: [
      "Send one hundred successful Ritual testnet transactions.",
      "Avoid duplicate spam patterns; activity should be meaningful.",
      "Run wallet activity verification."
    ],
    limit: 1,
    metric: "transactions",
    target: 100
  },
  {
    id: "tester-thousand-transactions",
    title: "Send 1000 Ritual Transactions",
    description: "Reach the capped high-volume tester milestone with one thousand successful Ritual testnet transactions.",
    category: "testers",
    type: "COMMUNITY",
    xp: 5000,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with at least 1000 Ritual testnet transactions",
    difficulty: "legendary",
    steps: [
      "Use Ritual testnet consistently with your connected wallet.",
      "Reach one thousand successful Ritual testnet transactions.",
      "Run wallet activity verification. This milestone is capped to one claim."
    ],
    limit: 1,
    metric: "transactions",
    target: 1000
  },
  {
    id: "tester-twenty-five-contracts",
    title: "Interact With 25 Different Ritual Contracts",
    description: "Explore deeper into the testnet by touching twenty-five unique Ritual contract addresses.",
    category: "testers",
    type: "COMMUNITY",
    xp: 1700,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with interactions across 25 unique Ritual testnet contracts",
    difficulty: "epic",
    steps: [
      "Interact with different Ritual testnet contracts.",
      "Reach twenty-five unique contract addresses.",
      "Run Ritual testnet wallet verification."
    ],
    limit: 1,
    metric: "uniqueContracts",
    target: 25
  },
  {
    id: "tester-fifty-contracts",
    title: "Interact With 50 Different Ritual Contracts",
    description: "Explore broadly by interacting with fifty unique Ritual testnet contract addresses.",
    category: "testers",
    type: "COMMUNITY",
    xp: 2800,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with interactions across 50 unique Ritual testnet contracts",
    difficulty: "legendary",
    steps: [
      "Interact with many different Ritual testnet contracts.",
      "Reach fifty unique contract addresses.",
      "Run Ritual testnet wallet verification."
    ],
    limit: 1,
    metric: "uniqueContracts",
    target: 50
  },
  {
    id: "tester-hundred-contracts",
    title: "Interact With 100 Different Ritual Contracts",
    description: "Reach the top contract-explorer milestone by interacting with one hundred unique Ritual contracts.",
    category: "testers",
    type: "COMMUNITY",
    xp: 5500,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with interactions across 100 unique Ritual testnet contracts",
    difficulty: "legendary",
    steps: [
      "Explore the Ritual testnet across a wide contract set.",
      "Reach one hundred unique contract addresses.",
      "Run Ritual testnet wallet verification. This milestone is capped to one claim."
    ],
    limit: 1,
    metric: "uniqueContracts",
    target: 100
  },
  {
    id: "tester-active-month",
    title: "Stay Active for 30 Ritual Testnet Days",
    description: "Become a long-running tester with activity across thirty different Ritual testnet days.",
    category: "testers",
    type: "COMMUNITY",
    xp: 2200,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with Ritual testnet activity on 30 different days",
    difficulty: "legendary",
    steps: [
      "Use Ritual testnet consistently across a month.",
      "Reach thirty unique active days.",
      "Run wallet activity verification. This milestone is capped to one claim."
    ],
    limit: 1,
    metric: "activeDays",
    target: 30
  },
  {
    id: "tester-active-fifty-days",
    title: "Stay Active for 50 Ritual Testnet Days",
    description: "Show long-term Ritual testnet activity across fifty different active days.",
    category: "testers",
    type: "COMMUNITY",
    xp: 3500,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with Ritual testnet activity on 50 different days",
    difficulty: "legendary",
    steps: [
      "Use Ritual testnet across many different days.",
      "Reach fifty unique active days.",
      "Run wallet activity verification."
    ],
    limit: 1,
    metric: "activeDays",
    target: 50
  },
  {
    id: "tester-active-hundred-days",
    title: "Stay Active for 100 Ritual Testnet Days",
    description: "Reach a major consistency milestone with one hundred different Ritual testnet active days.",
    category: "testers",
    type: "COMMUNITY",
    xp: 7000,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with Ritual testnet activity on 100 different days",
    difficulty: "legendary",
    steps: [
      "Keep using Ritual testnet over a long period.",
      "Reach one hundred unique active days.",
      "Run wallet activity verification. This milestone is capped to one claim."
    ],
    limit: 1,
    metric: "activeDays",
    target: 100
  },
  {
    id: "tester-active-two-hundred-days",
    title: "Stay Active for 200 Ritual Testnet Days",
    description: "Earn the highest tester consistency milestone with two hundred Ritual testnet active days.",
    category: "testers",
    type: "COMMUNITY",
    xp: 12000,
    verification: "TESTNET_ACTIVITY",
    status: "available",
    expectedProof: "Connected wallet with Ritual testnet activity on 200 different days",
    difficulty: "legendary",
    steps: [
      "Stay active on Ritual testnet across two hundred different days.",
      "Keep the same wallet connected for verification.",
      "Run wallet activity verification. This milestone is capped to one claim."
    ],
    limit: 1,
    metric: "activeDays",
    target: 200
  },
  {
    id: "discord-ten-messages",
    title: "Send 10 Ritual Discord Messages",
    description: "Move beyond your first hello with ten constructive messages in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 200,
    verification: "DISCORD_ACTIVITY",
    status: "available",
    expectedProof: "Connected Discord account with at least 10 messages in the Ritual server",
    difficulty: "common",
    steps: [
      "Connect your Discord account.",
      "Send ten constructive messages in the Ritual Discord server.",
      "Run Discord activity verification."
    ],
    limit: 1,
    metric: "messages",
    target: 10
  },
  {
    id: "discord-fifty-messages",
    title: "Send 50 Ritual Discord Messages",
    description: "Become visibly active in the Ritual Discord server with fifty messages.",
    category: "discord",
    type: "COMMUNITY",
    xp: 600,
    verification: "DISCORD_ACTIVITY",
    status: "available",
    expectedProof: "Connected Discord account with at least 50 messages in the Ritual server",
    difficulty: "uncommon",
    steps: [
      "Connect your Discord account.",
      "Participate in Ritual Discord conversations.",
      "Run verification after reaching fifty messages."
    ],
    limit: 1,
    metric: "messages",
    target: 50
  },
  {
    id: "discord-ritualist-role",
    title: "Attain the Ritualist Role",
    description: "Earn the Ritualist role in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 900,
    verification: "DISCORD_ROLE",
    status: "available",
    expectedProof: "Connected Discord account with the Ritualist role in the Ritual server",
    difficulty: "epic",
    steps: [
      "Connect your Discord account.",
      "Earn or receive the Ritualist role in the Ritual server.",
      "Run Discord role verification."
    ],
    limit: 1,
    metric: "roles",
    roleName: "Ritualist"
  },
  {
    id: "discord-radiant-ritualist-role",
    title: "Attain the Radiant Ritualist Role",
    description: "Earn the Radiant Ritualist role in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 1600,
    verification: "DISCORD_ROLE",
    status: "available",
    expectedProof: "Connected Discord account with the Radiant Ritualist role in the Ritual server",
    difficulty: "legendary",
    steps: [
      "Connect your Discord account.",
      "Earn or receive the Radiant Ritualist role in the Ritual server.",
      "Run Discord role verification."
    ],
    limit: 1,
    metric: "roles",
    roleName: "Radiant Ritualist"
  },
  {
    id: "discord-mage-role",
    title: "Attain the Mage Role",
    description: "Earn the Mage role in the Ritual Discord server.",
    category: "discord",
    type: "COMMUNITY",
    xp: 1200,
    verification: "DISCORD_ROLE",
    status: "available",
    expectedProof: "Connected Discord account with the Mage role in the Ritual server",
    difficulty: "epic",
    steps: [
      "Connect your Discord account.",
      "Earn or receive the Mage role in the Ritual server.",
      "Run Discord role verification."
    ],
    limit: 1,
    metric: "roles",
    roleName: "Mage"
  },
  {
    id: "discord-helper",
    title: "Help 5 Builders in Discord",
    description: "Support other Ritual builders by answering questions or sharing useful resources.",
    category: "discord",
    type: "COMMUNITY",
    xp: 750,
    verification: "MANUAL_REVIEW",
    status: "available",
    expectedProof: "Links to helpful Ritual Discord messages",
    difficulty: "rare",
    steps: [
      "Help five builders in Ritual Discord.",
      "Collect links to the relevant messages.",
      "Submit the links for review."
    ],
    limit: 1
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
  completedQuestIds: ["deploy-contract", "tester-contract-explorer", "discord-first-message"],
  activeWeeks: 3,
  projectsCompleted: 0,
  agentsDeployed: 1
};

export const demoTestnetActivity: TestnetActivity = {
  wallet: demoPassport.wallet,
  network: "ritual-testnet",
  completedTasks: 18,
  uniqueContracts: 58,
  transactions: 1200,
  activeDays: 75,
  lastIndexedBlock: 1289402
};

export const demoDiscordActivity: DiscordActivity = {
  discordId: "ritual-demo-user",
  username: "ritual_builder",
  serverId: "ritual-discord-demo",
  messages: 42,
  roles: ["Bitty", "Ritty", "Ritualist", "Mage"],
  connectedWallet: demoPassport.wallet
};

export const demoIdentityLink: IdentityLink = {
  wallet: demoPassport.wallet,
  passportTokenId: demoPassport.tokenId,
  discordId: demoDiscordActivity.discordId,
  discordUsername: demoDiscordActivity.username,
  discordAvatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png"
};

export const builderLeaderboard = [
  { wallet: "0x9f7E...18B2", className: "Agent Smith", reputation: 88, level: 31, builderXp: 18100 },
  { wallet: "0xA5C3...8124", className: "Builder", reputation: calculateReputation(demoPassport), level: getLevel(demoPassport.xp), builderXp: 3450 },
  { wallet: "0x71Ca...D447", className: "Analyst", reputation: 37, level: 12, builderXp: 2900 },
  { wallet: "0x45a1...F902", className: "Creator", reputation: 29, level: 9, builderXp: 2100 }
];

export const leaderboard = builderLeaderboard;

export const verifiedRitualProducts: VerifiedRitualProduct[] = [
  {
    id: "ritual-agent-foundry",
    name: "Ritual Agent Foundry",
    builderWallet: "0x9f7E...18B2",
    category: "Agent",
    description: "A scheduler for launching autonomous Ritual testnet agents with reusable run templates.",
    url: "https://example.com/ritual-agent-foundry",
    repositoryUrl: "https://github.com/example/ritual-agent-foundry",
    approvedAt: "2026-06-02",
    verificationBadge: "Backend approved",
    tags: ["agents", "automation", "templates"]
  },
  {
    id: "infernet-observatory",
    name: "Infernet Observatory",
    builderWallet: "0x71Ca...D447",
    category: "Dashboard",
    description: "A public analytics surface for tracking Infernet jobs, contract calls, and builder activity.",
    url: "https://example.com/infernet-observatory",
    repositoryUrl: "https://github.com/example/infernet-observatory",
    approvedAt: "2026-05-29",
    verificationBadge: "Community verified",
    tags: ["analytics", "infernet", "dashboard"]
  },
  {
    id: "ritual-llm-starter",
    name: "Ritual LLM Starter",
    builderWallet: "0xA5C3...8124",
    category: "Template",
    description: "A starter repository for calling Ritual AI primitives from contracts and a Next.js frontend.",
    url: "https://example.com/ritual-llm-starter",
    repositoryUrl: "https://github.com/example/ritual-llm-starter",
    approvedAt: "2026-05-21",
    verificationBadge: "Security reviewed",
    tags: ["llm", "starter", "frontend"]
  },
  {
    id: "ritual-swap-console",
    name: "Ritual Swap Console",
    builderWallet: "0x45a1...F902",
    category: "Tool",
    description: "A guided interface for testnet swaps, contract approvals, and transaction inspection on Ritual.",
    url: "https://example.com/ritual-swap-console",
    repositoryUrl: "https://github.com/example/ritual-swap-console",
    approvedAt: "2026-05-18",
    verificationBadge: "Backend approved",
    tags: ["wallet", "transactions", "testnet"]
  },
  {
    id: "ritual-name-kit",
    name: "Ritual Name Kit",
    builderWallet: "0x52Bd...91AF",
    category: "Protocol",
    description: "A lightweight naming and profile primitive for users who want readable identities on Ritual.",
    url: "https://example.com/ritual-name-kit",
    repositoryUrl: "https://github.com/example/ritual-name-kit",
    approvedAt: "2026-05-12",
    verificationBadge: "Security reviewed",
    tags: ["identity", "profiles", "contracts"]
  },
  {
    id: "ritual-gas-lens",
    name: "Ritual Gas Lens",
    builderWallet: "0x8c13...7D21",
    category: "Dashboard",
    description: "A user-facing dashboard for checking network health, gas patterns, and recent Ritual activity.",
    url: "https://example.com/ritual-gas-lens",
    repositoryUrl: "https://github.com/example/ritual-gas-lens",
    approvedAt: "2026-05-08",
    verificationBadge: "Community verified",
    tags: ["network", "gas", "activity"]
  }
];

export function getBuilderClass(id: BuilderClassId): BuilderClass {
  return builderClasses.find((builderClass) => builderClass.id === id) ?? builderClasses[0];
}

export function getQuest(id: string): Quest | undefined {
  return quests.find((quest) => quest.id === id);
}

export function getQuestsByCategory(category: QuestCategoryId): Quest[] {
  return quests.filter((quest) => quest.category === category);
}

export function getQuestCategory(id: QuestCategoryId): QuestCategory {
  return questCategories.find((category) => category.id === id) ?? questCategories[0];
}
