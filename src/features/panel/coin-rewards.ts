// Coin payout per match outcome. Used to derive each member's starting
// balance from their flex/inhouse win-loss record.

export const DEFAULT_COIN_REWARDS = {
  flex: { win: 20, loss: 10 },
  inhouse: { win: 60, loss: 20 },
} as const;

// Kept for backwards compat with code that imports COIN_REWARDS.
// New code should read from `useCoinRewards()` for live values.
export const COIN_REWARDS = DEFAULT_COIN_REWARDS;

export type ModeStats = { wins: number; losses: number };
export type Winrates = {
  flex: ModeStats;
  inhouse: ModeStats;
};

export type CoinRewards = {
  flex: { win: number; loss: number };
  inhouse: { win: number; loss: number };
};

export function computeCoinsFromWinrates(
  stats: Winrates,
  rewards: CoinRewards = DEFAULT_COIN_REWARDS,
): number {
  const { flex, inhouse } = stats;
  return (
    flex.wins * rewards.flex.win +
    flex.losses * rewards.flex.loss +
    inhouse.wins * rewards.inhouse.win +
    inhouse.losses * rewards.inhouse.loss
  );
}
