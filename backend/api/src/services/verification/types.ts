import type { Quest } from "@ritual/domain";

export interface QuestVerificationContext {
  quest: Quest;
  wallet?: string;
  discordId?: string;
  proof?: string;
}

export interface QuestVerificationResult {
  ok: boolean;
  reason: string;
  source?: string;
  value?: number;
  required?: number;
  roles?: string[];
  requiredRole?: string;
  capped?: boolean;
}

export interface QuestVerifier {
  verify(context: QuestVerificationContext): Promise<QuestVerificationResult>;
}
