export type RankType =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "emerald"
  | "diamond"
  | "master"
  | "grandmaster"
  | "challenger";

const rankFrameByType: Record<RankType, string> = {
  iron: "/images/rank-frames/iron.png",
  bronze: "/images/rank-frames/bronze.png",
  silver: "/images/rank-frames/silver.png",
  gold: "/images/rank-frames/gold.png",
  platinum: "/images/rank-frames/platinum.png",
  emerald: "/images/rank-frames/emerald.png",
  diamond: "/images/rank-frames/diamond.png",
  master: "/images/rank-frames/master.png",
  grandmaster: "/images/rank-frames/grandmaster.png",
  challenger: "/images/rank-frames/challenger.png",
};

export function getRankFrameSrc(rankType: RankType) {
  return rankFrameByType[rankType];
}
