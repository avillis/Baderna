export type InhouseSide = "blue" | "red" | "pool";

export type InhousePlayer = {
  id: string;
  nickname: string;
  name: string;
  lane: "TOP" | "JG" | "MID" | "ADC" | "SUP";
  laneLabel: string;
  laneWinRate: number;
  side: InhouseSide;
  avatarSrc?: string;
};

// Static lobby metadata used as fallback display data (match type / region /
// status / connect URL). The real list of players agora vem dos inhouses
// dinâmicos criados via admin (use-inhouses + localStorage).
export const inhouseLobby = {
  matchType: "5v5",
  region: "Brasil",
  status: "Pronto",
  series: "Melhor de 1",
  connectTime: "02:21",
  consoleLinkLabel: "gg.riotgames.com/LOL?joinCode=izV6-MAAU-Yfuj",
  consoleLinkHref: "https://gg.riotgames.com/LOL?joinCode=izV6-MAAU-Yfuj",
  connectHref: "https://gg.riotgames.com/LOL?joinCode=izV6-MAAU-Yfuj",
  server: "Sao Paulo",
  map: "Summoner's Rift",
};
