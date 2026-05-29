import { getSplashImageSrc } from "@/features/panel/banner-selection";
import {
  computeCoinsFromWinrates,
  type Winrates,
} from "@/features/panel/coin-rewards";

// Match record for the logged-in user. Other members keep their stats in
// panelMemberWinrates; coins for everyone are derived from these.
export const panelOwnerWinrates: Winrates = {
  flex: { wins: 30, losses: 26 },
  inhouse: { wins: 24, losses: 20 },
};

export const panelMenuItems = [
  { label: "Feed", tone: "default" as const, href: "/" },
  { label: "Meu Perfil", tone: "active" as const, href: "/membro" },
  { label: "Membros", tone: "default" as const, href: "/membros" },
  { label: "Inhouse", tone: "default" as const, href: "/inhouse" },
  { label: "RPG", tone: "default" as const, href: "/rpg" },
  { label: "Loja", tone: "default" as const, href: "/loja" },
];

export const panelProfile = {
  displayName: "Membro",
  fullName: "Membro Baderna",
  email: "membro@baderna.gg",
  isAdmin: true,
  gameNick: "",
  bio: "",
  avatarSrc: "",
  rankType: "gold" as const,
  // Note: Blitzcrank_Original.webp não está no source, então caímos pra Garen
  // (que era o featured champion antigo) até a Riot incluir o splash base do Blitz.
  bannerFileName: "Garen_Original.webp",
  bannerSrc: getSplashImageSrc("Garen_Original.webp"),
  // Featured-champion card pulls from the legacy pack first (it has the
  // base "_0" splash for every champion). API falls back to the processed
  // pack automatically when something newer like Lillia is needed.
  featuredChampionSrc: getSplashImageSrc("Yasuo_0.jpg"),
  rankFrameSrc: "/images/ranks/gold.png",
  coins: computeCoinsFromWinrates(panelOwnerWinrates),
};

export const panelStats = [
  {
    eyebrow: "Winrate Geral",
    value: "54/100",
    tone: "default" as const,
    placeholder: false,
  },
  {
    eyebrow: "Rank da Baderna",
    value: "#01",
    tone: "default" as const,
    placeholder: false,
  },
  {
    eyebrow: "Gold III",
    value: "45 pdl",
    tone: "rank" as const,
    placeholder: false,
  },
  {
    eyebrow: "Campe\u00e3o mais jogado",
    value: "Yasuo",
    tone: "featured" as const,
    placeholder: false,
  },
];

export const panelSidebarAccount = {
  avatarSrc: "",
  rankType: panelProfile.rankType,
};

export const panelSidebarAdminItem = {
  label: "Admin",
};

export const panelFavoriteChampions = [
  {
    name: "Yasuo",
    matches: 45,
    role: "Mid",
    winRate: 58,
    imageSrc: "/images/baderna/favorite-yasuo-tile.jpg",
  },
  {
    name: "Lee Sin",
    matches: 32,
    role: "Jungle",
    winRate: 62,
    imageSrc: "/images/baderna/favorite-leesin-tile.jpg",
  },
  {
    name: "Ezreal",
    matches: 28,
    role: "ADC",
    winRate: 50,
    imageSrc: "/images/baderna/favorite-ezreal-tile.jpg",
  },
  {
    name: "Garen",
    matches: 22,
    role: "Top",
    winRate: 38,
    imageSrc: "/images/baderna/favorite-garen-tile.jpg",
  },
  {
    name: "Thresh",
    matches: 19,
    role: "Support",
    winRate: 54,
    imageSrc: "/images/baderna/favorite-thresh-tile.jpg",
  },
];

export const panelCommentsPreview = {
  comments: [
    {
      author: "Caio Avillis",
      publishedAt: "Hoje, 19:45",
      body: "Perfil limpinho, layout bonito e pronto para a gente encher de estat\u00edstica quando a integra\u00e7\u00e3o chegar.",
      accent: "online" as const,
    },
    {
      author: "Victwink",
      publishedAt: "Hoje, 18:12",
      body: "Quando a Riot API entrar, isso aqui vai ficar absurdo. A base visual j\u00e1 est\u00e1 muito no ponto.",
      accent: "warm" as const,
    },
    {
      author: "Victwink",
      publishedAt: "Ontem, 23:08",
      body: "Curti bastante a ideia de deixar tudo mais clean por enquanto e depois plugar as partidas reais sem quebrar o layout.",
      accent: "neutral" as const,
    },
    {
      author: "Breno Support",
      publishedAt: "Ontem, 22:31",
      body: "A navega\u00e7\u00e3o ficou muito gostosa de usar. Quando entrar match history real, esse perfil vai voar.",
      accent: "neutral" as const,
    },
    {
      author: "Nico Mid",
      publishedAt: "Ontem, 21:04",
      body: "Gostei de como as resenhas entraram sem pesar o layout. Ficou com cara de produto mesmo.",
      accent: "neutral" as const,
    },
  ],
  composerPlaceholder: "Fazer um coment\u00e1rio...",
};

// Vazia até virmos da base de dados via Laravel (após o sistema de cadastro).
export const panelMemberWinrates: Array<{
  id: string;
  nickname: string;
  name: string;
  avatarSrc?: string;
  activeNameId?: string;
  flex: { wins: number; losses: number };
  inhouse: { wins: number; losses: number };
}> = [];

export const panelFavoriteChampionsByMode = {
  Todos: [
    { name: "Yasuo",   matches: 45, role: "Mid",     winRate: 58, imageSrc: "/images/baderna/favorite-yasuo-tile.jpg" },
    { name: "Lee Sin", matches: 32, role: "Jungle",  winRate: 62, imageSrc: "/images/baderna/favorite-leesin-tile.jpg" },
    { name: "Ezreal",  matches: 28, role: "ADC",     winRate: 50, imageSrc: "/images/baderna/favorite-ezreal-tile.jpg" },
    { name: "Garen",   matches: 22, role: "Top",     winRate: 38, imageSrc: "/images/baderna/favorite-garen-tile.jpg" },
    { name: "Thresh",  matches: 19, role: "Support", winRate: 54, imageSrc: "/images/baderna/favorite-thresh-tile.jpg" },
  ],
  Flex: [
    { name: "Yasuo",   matches: 28, role: "Mid",     winRate: 61, imageSrc: "/images/baderna/favorite-yasuo-tile.jpg" },
    { name: "Ezreal",  matches: 20, role: "ADC",     winRate: 55, imageSrc: "/images/baderna/favorite-ezreal-tile.jpg" },
    { name: "Garen",   matches: 14, role: "Top",     winRate: 43, imageSrc: "/images/baderna/favorite-garen-tile.jpg" },
    { name: "Lee Sin", matches: 12, role: "Jungle",  winRate: 58, imageSrc: "/images/baderna/favorite-leesin-tile.jpg" },
    { name: "Thresh",  matches: 8,  role: "Support", winRate: 50, imageSrc: "/images/baderna/favorite-thresh-tile.jpg" },
  ],
  Inhouse: [
    { name: "Lee Sin", matches: 20, role: "Jungle",  winRate: 65, imageSrc: "/images/baderna/favorite-leesin-tile.jpg" },
    { name: "Thresh",  matches: 11, role: "Support", winRate: 55, imageSrc: "/images/baderna/favorite-thresh-tile.jpg" },
    { name: "Yasuo",   matches: 17, role: "Mid",     winRate: 53, imageSrc: "/images/baderna/favorite-yasuo-tile.jpg" },
    { name: "Garen",   matches: 8,  role: "Top",     winRate: 37, imageSrc: "/images/baderna/favorite-garen-tile.jpg" },
    { name: "Ezreal",  matches: 8,  role: "ADC",     winRate: 37, imageSrc: "/images/baderna/favorite-ezreal-tile.jpg" },
  ],
};
