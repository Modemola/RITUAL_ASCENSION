import {
  achievements,
  builderClasses,
  calculateReputation,
  demoPassport,
  evolutionStages,
  getBuilderClass,
  getLevelProgress,
  getTier,
  leaderboard,
  quests
} from "@ritual/domain";

export const appWallet = demoPassport.wallet;
export const appClass = getBuilderClass(demoPassport.classId);
export const appProgress = getLevelProgress(demoPassport.xp);
export const appTier = getTier(appProgress.level);
export const appReputation = calculateReputation(demoPassport);

export { achievements, builderClasses, demoPassport, evolutionStages, leaderboard, quests };
