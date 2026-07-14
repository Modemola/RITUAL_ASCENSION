import {
  achievements,
  builderClasses,
  calculateReputation,
  demoDiscordActivity,
  demoIdentityLink,
  demoPassport,
  demoTestnetActivity,
  evolutionStages,
  builderLeaderboard,
  getBuilderClass,
  getLevelProgress,
  getTier,
  leaderboard,
  mascots,
  questCategories,
  quests,
  verifiedRitualProducts
} from "@ritual/domain";
export type { Mascot, MascotId } from "@ritual/domain";

export const appWallet = demoPassport.wallet;
export const appClass = getBuilderClass(demoPassport.classId);
export const appProgress = getLevelProgress(demoPassport.xp);
export const appTier = getTier(appProgress.level);
export const appReputation = calculateReputation(demoPassport);

export {
  achievements,
  builderClasses,
  builderLeaderboard,
  demoDiscordActivity,
  demoIdentityLink,
  demoPassport,
  demoTestnetActivity,
  evolutionStages,
  leaderboard,
  mascots,
  questCategories,
  quests,
  verifiedRitualProducts
};
