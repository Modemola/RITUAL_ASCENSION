import { demoDiscordActivity, demoTestnetActivity } from "@ritual/domain";
import type { DiscordActivity, TestnetActivity } from "@ritual/domain";
import type { VerificationConfig } from "../../config.js";

export interface TestnetActivitySource {
  sourceName: string;
  getActivity(wallet: string): Promise<TestnetActivity>;
}

export interface DiscordActivitySource {
  sourceName: string;
  getActivity(discordId: string): Promise<DiscordActivity>;
}

export class DemoTestnetActivitySource implements TestnetActivitySource {
  sourceName = "demo-ritual-testnet-indexer";

  async getActivity(wallet: string) {
    return {
      ...demoTestnetActivity,
      wallet: wallet.toLowerCase()
    };
  }
}

export class HttpTestnetActivitySource implements TestnetActivitySource {
  sourceName = "ritual-testnet-indexer";

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string
  ) {}

  async getActivity(wallet: string) {
    const url = new URL(this.endpoint);
    url.searchParams.set("wallet", wallet.toLowerCase());
    const response = await fetch(url, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Testnet activity source returned HTTP ${response.status}`);
    }

    const data = await response.json() as { activity?: TestnetActivity } | TestnetActivity;
    const activity = "activity" in data && data.activity ? data.activity : data as TestnetActivity;
    return {
      ...activity,
      wallet: wallet.toLowerCase(),
      network: "ritual-testnet" as const
    };
  }
}

export class DemoDiscordActivitySource implements DiscordActivitySource {
  sourceName = "demo-ritual-discord-bot";

  async getActivity(discordId: string) {
    return {
      ...demoDiscordActivity,
      discordId
    };
  }
}

export class HttpDiscordActivitySource implements DiscordActivitySource {
  sourceName = "ritual-discord-bot";

  constructor(
    private readonly endpoint: string,
    private readonly apiKey?: string
  ) {}

  async getActivity(discordId: string) {
    const url = new URL(this.endpoint);
    url.searchParams.set("discordId", discordId);
    const response = await fetch(url, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined
    });

    if (!response.ok) {
      throw new Error(`Discord activity source returned HTTP ${response.status}`);
    }

    const data = await response.json() as { activity?: DiscordActivity } | DiscordActivity;
    const activity = "activity" in data && data.activity ? data.activity : data as DiscordActivity;
    return {
      ...activity,
      discordId
    };
  }
}

export function createActivitySources(config: VerificationConfig = {}) {
  return {
    discord: config.discord?.endpoint
      ? new HttpDiscordActivitySource(config.discord.endpoint, config.discord.apiKey)
      : new DemoDiscordActivitySource(),
    testnet: config.testnet?.endpoint
      ? new HttpTestnetActivitySource(config.testnet.endpoint, config.testnet.apiKey)
      : new DemoTestnetActivitySource()
  };
}
