import type { RankType } from "@/features/panel/rank-utils";
import type { InhousePlayer } from "@/features/panel/inhouse-data";

export type Lane = "TOP" | "JG" | "MID" | "ADC" | "SUP";

const ALL_LANES: Lane[] = ["TOP", "JG", "MID", "ADC", "SUP"];

const LANE_LABELS: Record<Lane, string> = {
  TOP: "Top",
  JG: "Jungle",
  MID: "Mid",
  ADC: "ADC",
  SUP: "Support",
};

const RANK_POINTS: Record<RankType, number> = {
  iron: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  platinum: 5,
  diamond: 6,
  master: 7,
  grandmaster: 8,
  challenger: 9,
};

export interface InhouseParticipant {
  id: string;
  nickname: string;
  name: string;
  rankType: RankType;
  avatarSrc?: string;
  lane1?: Lane;
  lane2?: Lane;
}

export type InhouseMode = "random" | "leader";

export interface InhouseMatchResult {
  players: InhousePlayer[];
  blueLeaderId: string;
  redLeaderId: string;
  mode: InhouseMode;
  /** Time vencedor (depois de admin/criador marcar). null enquanto não fechou. */
  winner?: "blue" | "red" | null;
  /** Timestamp ms de quando o vencedor foi definido. */
  winnerSetAt?: number | null;
}

/* ── helpers ──────────────────────────────────────────── */

function combinations(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map((c) => [first, ...c]),
    ...combinations(rest, k),
  ];
}

function assignLanesForTeam(team: InhouseParticipant[]): Map<string, Lane> {
  const assignment = new Map<string, Lane>();
  const usedLanes = new Set<Lane>();
  // Shuffle for fairness when resolving conflicts
  const shuffled = [...team].sort(() => Math.random() - 0.5);

  // Pass 1 — primary preference
  for (const p of shuffled) {
    if (p.lane1 && !usedLanes.has(p.lane1)) {
      assignment.set(p.id, p.lane1);
      usedLanes.add(p.lane1);
    }
  }

  // Pass 2 — secondary preference
  for (const p of shuffled) {
    if (!assignment.has(p.id) && p.lane2 && !usedLanes.has(p.lane2)) {
      assignment.set(p.id, p.lane2);
      usedLanes.add(p.lane2);
    }
  }

  // Pass 3 — fill remaining lanes randomly
  const remaining = ALL_LANES.filter((l) => !usedLanes.has(l)).sort(
    () => Math.random() - 0.5,
  );
  let idx = 0;
  for (const p of shuffled) {
    if (!assignment.has(p.id)) {
      assignment.set(p.id, remaining[idx++]);
    }
  }

  return assignment;
}

/* ── main export ──────────────────────────────────────── */

export function buildInhouseMatch(
  participants: InhouseParticipant[],
): InhouseMatchResult {
  if (participants.length !== 10) {
    throw new Error("Precisa de exatamente 10 participantes.");
  }

  const indices = Array.from({ length: 10 }, (_, i) => i);
  const combos = combinations(indices, 5);

  // Find minimum rank-sum difference across all C(10,5) splits
  let bestDiff = Infinity;
  for (const combo of combos) {
    const blueSum = combo.reduce(
      (s, i) => s + RANK_POINTS[participants[i].rankType],
      0,
    );
    const redSum = indices
      .filter((i) => !combo.includes(i))
      .reduce((s, i) => s + RANK_POINTS[participants[i].rankType], 0);
    const diff = Math.abs(blueSum - redSum);
    if (diff < bestDiff) bestDiff = diff;
  }

  // Collect all combos that achieve that minimum diff
  const bestCombos = combos.filter((combo) => {
    const blueSum = combo.reduce(
      (s, i) => s + RANK_POINTS[participants[i].rankType],
      0,
    );
    const redSum = indices
      .filter((i) => !combo.includes(i))
      .reduce((s, i) => s + RANK_POINTS[participants[i].rankType], 0);
    return Math.abs(blueSum - redSum) === bestDiff;
  });

  // Pick one of the balanced splits randomly for variety
  const chosen = bestCombos[Math.floor(Math.random() * bestCombos.length)];
  const blueTeam = chosen.map((i) => participants[i]);
  const redTeam = indices
    .filter((i) => !chosen.includes(i))
    .map((i) => participants[i]);

  // Assign lanes within each team
  const blueLanes = assignLanesForTeam(blueTeam);
  const redLanes = assignLanesForTeam(redTeam);

  // Random leaders
  const blueLeader = blueTeam[Math.floor(Math.random() * blueTeam.length)];
  const redLeader = redTeam[Math.floor(Math.random() * redTeam.length)];

  const players: InhousePlayer[] = [
    ...blueTeam.map((p) => {
      const lane = blueLanes.get(p.id) ?? "TOP";
      return {
        id: p.id,
        nickname: p.nickname,
        name: p.name,
        lane,
        laneLabel: LANE_LABELS[lane],
        laneWinRate: 50,
        side: "blue" as const,
        avatarSrc: p.avatarSrc,
      };
    }),
    ...redTeam.map((p) => {
      const lane = redLanes.get(p.id) ?? "TOP";
      return {
        id: p.id,
        nickname: p.nickname,
        name: p.name,
        lane,
        laneLabel: LANE_LABELS[lane],
        laneWinRate: 50,
        side: "red" as const,
        avatarSrc: p.avatarSrc,
      };
    }),
  ];

  return {
    players,
    blueLeaderId: blueLeader.id,
    redLeaderId: redLeader.id,
    mode: "random",
  };
}

/* ── Leader-mode builder ────────────────────────────────── */
// Aceita N >= 2 participantes + 2 líderes. Líderes vão pros lados; o resto
// fica na pool. Os líderes escolhem na UI quem vai pro time deles — os que
// sobrarem na pool ficam fora da partida.
export function buildLeaderInhouseMatch(args: {
  participants: InhouseParticipant[];
  blueLeaderId: string;
  redLeaderId: string;
}): InhouseMatchResult {
  const { participants, blueLeaderId, redLeaderId } = args;
  if (participants.length < 2) {
    throw new Error("Precisa de pelo menos 2 participantes.");
  }
  if (blueLeaderId === redLeaderId) {
    throw new Error("Os dois líderes não podem ser a mesma pessoa.");
  }
  if (!participants.some((p) => p.id === blueLeaderId)) {
    throw new Error("Líder azul não está entre os participantes.");
  }
  if (!participants.some((p) => p.id === redLeaderId)) {
    throw new Error("Líder vermelho não está entre os participantes.");
  }

  const players: InhousePlayer[] = participants.map((p) => {
    const side: "blue" | "red" | "pool" =
      p.id === blueLeaderId
        ? "blue"
        : p.id === redLeaderId
          ? "red"
          : "pool";
    return {
      id: p.id,
      nickname: p.nickname,
      name: p.name,
      lane: "TOP" as const,
      laneLabel: LANE_LABELS.TOP,
      laneWinRate: 50,
      side,
      avatarSrc: p.avatarSrc,
    };
  });

  return { players, blueLeaderId, redLeaderId, mode: "leader" };
}
