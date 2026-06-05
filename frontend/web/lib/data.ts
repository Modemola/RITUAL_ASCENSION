import {
  achievements,
  builderClasses,
  calculateReputation,
  demoDiscordActivity,
  demoPassport,
  demoTestnetActivity,
  evolutionStages,
  getBuilderClass,
  getLevelProgress,
  getTier,
  leaderboard,
  questCategories,
  quests
} from "@ritual/domain";

export const appWallet = demoPassport.wallet;
export const appClass = getBuilderClass(demoPassport.classId);
export const appProgress = getLevelProgress(demoPassport.xp);
export const appTier = getTier(appProgress.level);
export const appReputation = calculateReputation(demoPassport);

export {
  achievements,
  builderClasses,
  demoDiscordActivity,
  demoPassport,
  demoTestnetActivity,
  evolutionStages,
  leaderboard,
  questCategories,
  quests
};
