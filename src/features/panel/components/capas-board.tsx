"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { History, RotateCcw, Zap } from "lucide-react";

import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { PurchaseHistoryModal } from "@/features/panel/components/purchase-history-modal";
import {
  RaritySmokeOverlay,
  rarityHasSmoke,
} from "@/features/panel/components/rarity-smoke-overlay";
import { StyledName } from "@/features/panel/components/styled-name";
import { NAME_BY_ID, NAME_STYLES, type NameStyle } from "@/features/panel/names-data";
import { type Title, type TitleRarity } from "@/features/panel/titles-data";
import {
  formatCountdown,
  useDailyFreeSpin,
} from "@/features/panel/use-daily-free-spin";
import { useMemberCoins } from "@/features/panel/use-member-coins";
import { useMemberUnlockedTitles } from "@/features/panel/use-member-titles";
import { useMemberUnlockedNames } from "@/features/panel/use-member-unlocked-names";
import { useMemberPurchaseHistory } from "@/features/panel/use-member-purchase-history";
import { useTitles } from "@/features/panel/use-titles";
import { useUnlockedBanners } from "@/features/panel/use-unlocked-banners";
import { panelProfile } from "@/features/panel/panel-data";
import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";

const CAPAS_COST = 10;
const TITULOS_COST = 50;
const NOMES_COST = 80;

// Name pool — limitado excluded (admin grant only) and "preto" excluded
// (it's the fixed default everyone already has).
const NAME_POOL: NameStyle[] = NAME_STYLES.filter(
  (s) => s.rarity !== "limitado" && s.id !== "preto",
);
const NAME_POOL_IDS = NAME_POOL.map((s) => s.id);
const NAMES_BY_RARITY: Record<TitleRarity, NameStyle[]> = {
  limitado: [],
  lendaria: NAME_POOL.filter((s) => s.rarity === "lendaria"),
  exclusivo: NAME_POOL.filter((s) => s.rarity === "exclusivo"),
  epico: NAME_POOL.filter((s) => s.rarity === "epico"),
  raro: NAME_POOL.filter((s) => s.rarity === "raro"),
  comum: NAME_POOL.filter((s) => s.rarity === "comum"),
};
function pickWeightedNameId(): string {
  const r = Math.random();
  let cum = 0;
  for (const [rarity, weight] of TITLE_WEIGHTS) {
    cum += weight;
    if (r < cum) {
      const bucket = NAMES_BY_RARITY[rarity];
      if (bucket.length > 0)
        return bucket[Math.floor(Math.random() * bucket.length)].id;
    }
  }
  return NAME_POOL_IDS[Math.floor(Math.random() * NAME_POOL_IDS.length)];
}

const TITLE_WEIGHTS: Array<[TitleRarity, number]> = [
  ["lendaria", 0.05],
  ["exclusivo", 0.10],
  ["epico", 0.25],
  ["raro", 0.35],
  ["comum", 0.25],
];
// Sort order for the grid (rarest first). Limitado isn't in the pool.
const TITLE_RARITY_RANK: Record<TitleRarity, number> = {
  limitado: 0,
  lendaria: 1,
  exclusivo: 2,
  epico: 3,
  raro: 4,
  comum: 5,
};


// Rarity colors mirror titles-data (limitado is excluded as requested).
const RARITY_COLOR = {
  lendaria: "#E8B53C",
  exclusivo: "#EE89B3",
  epico: "#1D49FF",
  raro: "#0c8c8c",
  comum: "#4a4a4a",
} as const;
type BannerRarity = keyof typeof RARITY_COLOR;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295; // 0..1
}

// Deterministic rarity per banner. Original (base) splashes are always common;
// skins get the weighted distribution: 5% exclusivo, 15% épico, 30% raro, 50% comum.
function getBannerRarity(fileName: string): BannerRarity {
  if (/_Original\.(jpg|jpeg|png|webp)$/i.test(fileName)) return "comum";
  // Legacy "_0" splashes are also the base.
  if (/_0\.(jpg|jpeg|png|webp)$/i.test(fileName)) return "comum";
  const r = hashString(fileName);
  if (r < 0.05) return "exclusivo";
  if (r < 0.2) return "epico";
  if (r < 0.5) return "raro";
  return "comum";
}

// Format a splash filename as a friendly label.
//   "Aatrox_Original.webp"      → "Aatrox"
//   "Aatrox_BloodMoon.webp"     → "Aatrox Blood Moon"
//   "Aurelion_Sol_Storm.webp"   → "Aurelion Sol Storm"
//   "Akali_4.jpg" (legacy)      → "Akali"
function channelLabel(fileName: string): string {
  const noExt = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  // Legacy "_0", "_1"... convention
  const legacy = noExt.match(/^(.+)_(\d+)$/);
  if (legacy) {
    return formatToken(legacy[1]);
  }
  // New convention: "Champion_Skin" (champion may itself contain underscores)
  const idx = noExt.lastIndexOf("_");
  if (idx === -1) return formatToken(noExt);
  const champ = noExt.slice(0, idx);
  const skin = noExt.slice(idx + 1);
  if (skin === "Original") return formatToken(champ);
  return `${formatToken(champ)} ${formatToken(skin)}`;
}

function formatToken(value: string): string {
  let s = value
    .replace(/(\w)27(\w)/g, "$1'$2") // url-encoded apostrophe
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2");
  s = s
    .split(" ")
    .map((word) =>
      word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)
        ? word[0] + word.slice(1).toLowerCase()
        : word,
    )
    .join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ROULETTE_LENGTH = 42;
const WIN_INDEX = 34; // The card that lands under the indicator
// Splash art native aspect ≈ 1215:717 (landscape rectangle)
const CARD_HEIGHT = 200;
const CARD_WIDTH = 340; // ≈ 1215/717 * 200
const CARD_GAP = 12;
const SPIN_DURATION_MS = 4500;
const SPIN_DURATION_FAST_MS = 1200;
const WINNER_SCALE = 1.12;
const WINNER_SIDE_MARGIN = (CARD_WIDTH * (WINNER_SCALE - 1)) / 2;

type CapasBoardProps = {
  pool: string[];
};

export function CapasBoard({ pool: bannerPool }: CapasBoardProps) {
  const { user } = useAuth();
  const LOGGED_USER_ID = user ? String(user.id) : "__guest__";
  // Coins now keyed pelo user.id (numérico) — saldo vem da API.
  const COINS_KEY = LOGGED_USER_ID;
  const { getCoinsFor, setLocalBalance } = useMemberCoins();
  const { unlock: unlockBanner, isUnlocked: isBannerUnlocked, unlocked: unlockedBanners } =
    useUnlockedBanners(LOGGED_USER_ID);
  const { unlocked: unlockedTitles, setUnlocked: setUnlockedTitles } =
    useMemberUnlockedTitles(LOGGED_USER_ID, ["aprendiz"]);
  const { entries: historyEntries, log: logPurchase } =
    useMemberPurchaseHistory(LOGGED_USER_ID);
  // Daily free spin — capas only.
  const {
    isAvailable: freeSpinAvailable,
    msUntilNext: freeSpinMsLeft,
    claim: claimFreeSpin,
  } = useDailyFreeSpin(LOGGED_USER_ID);
  const { unlocked: unlockedNames, unlock: unlockName, isUnlocked: isNameUnlocked } =
    useMemberUnlockedNames(LOGGED_USER_ID);
  const [historyOpen, setHistoryOpen] = useState(false);
  // All titles — defaults (minus removed) + custom titles created in the admin
  // panel. Limitado is excluded from the roulette.
  const { titles: allTitles } = useTitles();
  const sortedBannerPool = useMemo(
    () =>
      [...bannerPool].sort(
        (a, b) =>
          TITLE_RARITY_RANK[getBannerRarity(a)] -
          TITLE_RARITY_RANK[getBannerRarity(b)],
      ),
    [bannerPool],
  );
  const titlePool = useMemo(
    // "aprendiz" is the fixed default title every user already has — exclude.
    () =>
      allTitles.filter((t) => t.rarity !== "limitado" && t.id !== "aprendiz"),
    [allTitles],
  );
  const titlePoolIds = useMemo(() => titlePool.map((t) => t.id), [titlePool]);
  const titleById = useMemo<Record<string, Title>>(
    () => Object.fromEntries(titlePool.map((t) => [t.id, t])),
    [titlePool],
  );
  const titlesByRarity = useMemo<Record<TitleRarity, Title[]>>(
    () => ({
      limitado: [],
      lendaria: titlePool.filter((t) => t.rarity === "lendaria"),
      exclusivo: titlePool.filter((t) => t.rarity === "exclusivo"),
      epico: titlePool.filter((t) => t.rarity === "epico"),
      raro: titlePool.filter((t) => t.rarity === "raro"),
      comum: titlePool.filter((t) => t.rarity === "comum"),
    }),
    [titlePool],
  );
  const pickWeightedTitleId = useCallback((): string => {
    const r = Math.random();
    let cum = 0;
    for (const [rarity, weight] of TITLE_WEIGHTS) {
      cum += weight;
      if (r < cum) {
        const bucket = titlesByRarity[rarity];
        if (bucket.length > 0)
          return bucket[Math.floor(Math.random() * bucket.length)].id;
      }
    }
    return titlePoolIds[Math.floor(Math.random() * titlePoolIds.length)];
  }, [titlesByRarity, titlePoolIds]);

  const [tab, setTab] = useState<"capas" | "titulos" | "nomes">("capas");
  const [spinning, setSpinning] = useState(false);
  // Briefly suppresses the transition so the strip can snap back to 0
  // before the new spin animation starts (otherwise the second spin
  // shows a slow-rewind animation).
  const [resetting, setResetting] = useState(false);
  const [rouletteItems, setRouletteItems] = useState<string[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [previewSeed, setPreviewSeed] = useState(0);
  const [fastMode, setFastMode] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const [burstPos, setBurstPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  // Reveal state: which card index in the strip is the winner, plus its rarity.
  // Used to dim siblings, slightly scale the winner, and add an inner border.
  const [reveal, setReveal] = useState<{
    idx: number;
    rarity: BannerRarity;
  } | null>(null);

  // Build a set of particle configs whenever a new burst is triggered.
  // Physics: explode upward in an arc, then fall down under gravity and fade.
  const confettiPieces = useMemo(() => {
    if (confettiBurst === 0) return [];
    const palette = ["#ff4100", "#e10000", "#888888", "#ff7a3d", "#bdbdbd"];
    const pieces = [];
    const COUNT = 45;
    for (let i = 0; i < COUNT; i++) {
      const tx = (Math.random() - 0.5) * 640; // -320..320 — wider spread
      const peak = 110 + Math.random() * 140; // 110..250
      const fall = 140 + Math.random() * 120; // 140..260 — paper falls gently
      const rot = (Math.random() * 540 - 270).toFixed(0) + "deg";
      const dur = (1200 + Math.random() * 500).toFixed(0) + "ms";
      const size = 6 + Math.random() * 7;
      const color = palette[Math.floor(Math.random() * palette.length)];
      pieces.push({
        id: i,
        tx: `${tx.toFixed(0)}px`,
        peak: `${peak.toFixed(0)}px`,
        fall: `${fall.toFixed(0)}px`,
        rot,
        dur,
        size,
        color,
      });
    }
    return pieces;
  }, [confettiBurst]);

  // Clean up confetti after the longest animation finishes
  useEffect(() => {
    if (confettiBurst === 0) return;
    const t = window.setTimeout(() => {
      setConfettiBurst(0);
      setBurstPos(null);
    }, 1900);
    return () => window.clearTimeout(t);
  }, [confettiBurst]);


  const [displayCoins, setDisplayCoins] = useState<number | null>(null);
  const prevCoinsRef = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Lazy load the capas grid (1210+ items would block the main thread on tab
  // switch and prevent the indicator from animating smoothly).
  const [visibleCount, setVisibleCount] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  // Reset visible count when switching tabs
  useEffect(() => {
    setVisibleCount(60);
  }, [tab]);
  // Intersection observer: load more when the sentinel scrolls into view
  useEffect(() => {
    if (tab !== "capas") return;
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + 60, bannerPool.length));
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [tab, bannerPool.length, visibleCount]);

  // Sliding tab indicator (orange underline)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicator, setTabIndicator] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  useEffect(() => {
    function update() {
      const el = tabRefs.current[tab];
      if (!el) return;
      setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [tab]);

  // Compute indicator center X relative to the strip's container.
  // The indicator is positioned at the main column center, which may not be
  // the geometric center of the edge-to-edge roulette section.
  function getIndicatorOffset(): number {
    const container = stripRef.current?.parentElement;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return (container?.offsetWidth ?? 0) / 2;
    const cRect = container.getBoundingClientRect();
    const iRect = indicator.getBoundingClientRect();
    return iRect.left + iRect.width / 2 - cRect.left;
  }

  function markImageLoaded(fileName: string) {
    setLoadedImages((prev) => {
      if (prev.has(fileName)) return prev;
      const next = new Set(prev);
      next.add(fileName);
      return next;
    });
  }

  useEffect(() => setMounted(true), []);

  // Center a card under the indicator at rest (idle position).
  // Only runs while we're still showing the preview strip — after a spin
  // completes we keep the winner under the indicator.
  useEffect(() => {
    if (spinning) return;
    if (rouletteItems.length > 0) return;
    function center() {
      const container = stripRef.current?.parentElement;
      if (!container) return;
      const cardStride = CARD_WIDTH + CARD_GAP;
      const STRIP_PADDING_LEFT = 0;
      const indicatorX = getIndicatorOffset();
      // Escolhe a card cujo CENTRO fica MAIS PERTO de indicatorX (em vez de
      // arredondar pra cima com ceil + 1). Com a estratégia anterior a card
      // ficava sempre 1 índice à direita do natural, criando um deslocamento
      // visual de meio cardStride que ninguém consegue calibrar à mão.
      const cardIndex = Math.max(
        0,
        Math.round((indicatorX - STRIP_PADDING_LEFT - CARD_WIDTH / 2) / cardStride),
      );
      const targetCenter =
        STRIP_PADDING_LEFT + cardIndex * cardStride + CARD_WIDTH / 2;
      setTranslateX(-(targetCenter - indicatorX));
    }
    // Roda duas vezes: uma agora e outra no próximo frame, garantindo que
    // o DOM já fez o layout (indicador + strip posicionados certinhos).
    center();
    const raf = requestAnimationFrame(center);
    window.addEventListener("resize", center);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", center);
    };
  }, [spinning, mounted, rouletteItems.length, tab]);

  const coins = getCoinsFor(COINS_KEY, 0);

  // Per-tab configuration: pool of item IDs, cost, ownership, rarity lookup,
  // unlock fn. The spin engine below works against this generic interface.
  const activeConfig = useMemo(() => {
    if (tab === "capas") {
      return {
        pool: bannerPool,
        cost: CAPAS_COST,
        pickWinner: () =>
          bannerPool[Math.floor(Math.random() * bannerPool.length)],
        pickFiller: () =>
          bannerPool[Math.floor(Math.random() * bannerPool.length)],
        isOwned: (id: string) => isBannerUnlocked(id),
        ownedCount: unlockedBanners.length,
        totalCount: bannerPool.length,
        getRarity: (id: string): BannerRarity => getBannerRarity(id),
        unlock: (id: string) => unlockBanner(id),
      };
    }
    if (tab === "titulos") {
      return {
        pool: titlePoolIds,
        cost: TITULOS_COST,
        pickWinner: () => pickWeightedTitleId(),
        pickFiller: () => pickWeightedTitleId(),
        isOwned: (id: string) => unlockedTitles.includes(id),
        ownedCount: unlockedTitles.length,
        totalCount: titlePool.length,
        getRarity: (id: string): BannerRarity =>
          (titleById[id]?.rarity ?? "comum") as BannerRarity,
        unlock: (id: string) => {
          if (!unlockedTitles.includes(id))
            setUnlockedTitles([...unlockedTitles, id]);
        },
      };
    }
    // nomes
    return {
      pool: NAME_POOL_IDS,
      cost: NOMES_COST,
      pickWinner: () => pickWeightedNameId(),
      pickFiller: () => pickWeightedNameId(),
      isOwned: (id: string) => isNameUnlocked(id),
      ownedCount: unlockedNames.length,
      totalCount: NAME_POOL.length,
      getRarity: (id: string): BannerRarity =>
        (NAME_BY_ID[id]?.rarity ?? "comum") as BannerRarity,
      unlock: (id: string) => unlockName(id),
    };
  }, [
    tab,
    bannerPool,
    isBannerUnlocked,
    unlockedBanners,
    unlockBanner,
    unlockedTitles,
    setUnlockedTitles,
    titlePool,
    titlePoolIds,
    titleById,
    pickWeightedTitleId,
    unlockedNames,
    isNameUnlocked,
    unlockName,
  ]);

  // Reset spin state when switching tabs
  useEffect(() => {
    setRouletteItems([]);
    setReveal(null);
    setSpinning(false);
  }, [tab]);

  // Animated coin counter — ticks the displayed number from the previous
  // value to the new one over ~650ms whenever `coins` changes.
  useEffect(() => {
    if (prevCoinsRef.current === null) {
      prevCoinsRef.current = coins;
      setDisplayCoins(coins);
      return;
    }
    const from = prevCoinsRef.current;
    const to = coins;
    if (from === to) return;
    prevCoinsRef.current = to;
    const start = performance.now();
    const DUR = 650;
    let raf = 0;
    function step(now: number) {
      const t = Math.min(1, (now - start) / DUR);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const value = Math.round(from + (to - from) * eased);
      setDisplayCoins(value);
      if (t < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [coins]);
  // Free spin (capas only) lets the user bypass the cost.
  const usingFreeSpin = tab === "capas" && freeSpinAvailable;
  const canOpen =
    !spinning && (usingFreeSpin || coins >= activeConfig.cost);

  // Build initial preview strip so the roulette doesn't appear empty.
  // Re-rolls only when the tab changes, the banner pool changes, or the
  // user hits the reset button (`previewSeed`). NOT when ownership state
  // changes — otherwise the strip would shuffle right after a win.
  const previewStrip = useMemo(() => {
    let pool: string[];
    let pick: () => string;
    if (tab === "capas") {
      pool = bannerPool;
      pick = () => pool[Math.floor(Math.random() * pool.length)];
    } else if (tab === "titulos") {
      pool = titlePoolIds;
      pick = () => pickWeightedTitleId();
    } else {
      pool = NAME_POOL_IDS;
      pick = () => pickWeightedNameId();
    }
    if (pool.length === 0) return [];
    const items: string[] = [];
    for (let i = 0; i < ROULETTE_LENGTH; i++) items.push(pick());
    return items;
    // Intentionally only rerolls on tab change or the manual reset button.
    // Pool reference changes (e.g. titles reloading from storage) would
    // otherwise reroll the strip on every render — we don't want that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, previewSeed]);

  const displayStrip = rouletteItems.length > 0 ? rouletteItems : previewStrip;

  function openCase() {
    if (!canOpen) {
      if (coins < activeConfig.cost) {
        setInsufficientFunds(true);
        setTimeout(() => setInsufficientFunds(false), 2000);
      }
      return;
    }
    if (activeConfig.pool.length === 0) return;

    // Pick the winning item (weighted for titulos, uniform for capas)
    const winner = activeConfig.pickWinner();

    // Build a fresh strip; the winner is placed at WIN_INDEX
    const strip: string[] = [];
    for (let i = 0; i < ROULETTE_LENGTH; i++) {
      strip.push(activeConfig.pickFiller());
    }
    strip[WIN_INDEX] = winner;

    setRouletteItems(strip);
    setReveal(null); // clear any previous reveal styling before this spin
    // Snap to start with NO transition, then start the spin on the next frame
    // so we don't see a slow rewind from the previous spin's final position.
    setResetting(true);
    setTranslateX(0);
    setSpinning(true);
    // Free spin (capas) pula o débito. Senão, deduz LOCAL otimisticamente
    // (sem bater na API) — o débito real acontece server-side no /unlocks
    // quando rolar o unlock no final da animação. Se for duplicada, backend
    // não cobra e devolve o saldo cheio (sincronizado via storage event).
    if (usingFreeSpin) {
      claimFreeSpin();
    } else {
      setLocalBalance(coins - activeConfig.cost);
    }

    // Compute the translateX to land the winner card centered under the indicator
    const cardStride = CARD_WIDTH + CARD_GAP;
    // Strip has paddingLeft = 12, so each card's left edge is shifted by that
    const STRIP_PADDING_LEFT = 0;
    const winnerCenter =
      STRIP_PADDING_LEFT + WIN_INDEX * cardStride + CARD_WIDTH / 2;
    const finalX = -(winnerCenter - getIndicatorOffset());

    const duration = fastMode ? SPIN_DURATION_FAST_MS : SPIN_DURATION_MS;

    // Trigger animation on next tick. The first RAF lets the snap-back
    // (translateX=0 with transition:none) commit, then we re-enable the
    // transition and move to the winner's position.
    requestAnimationFrame(() => {
      setResetting(false);
      requestAnimationFrame(() => setTranslateX(finalX));
    });

    // Reveal after animation completes — snake outline traces the card,
    // glows when the loop closes. Confetti only fires for rare drops
    // (épico / exclusivo) so the celebration feels earned.
    window.setTimeout(() => {
      setSpinning(false);
      const rarity = activeConfig.getRarity(winner);
      const isDuplicate = activeConfig.isOwned(winner);
      const wasFree = usingFreeSpin;
      // Free spin → backend nem é chamado pra debitar.
      // Duplicada (paga) → ainda chamamos unlock; backend devolve {duplicate:true}
      //   sem cobrar e o saldo é sincronizado de volta automaticamente.
      // Nova → backend cobra e devolve o novo saldo.
      if (!wasFree) {
        activeConfig.unlock(winner);
      } else if (!isDuplicate) {
        activeConfig.unlock(winner);
      }
      const balanceAfter = wasFree
        ? coins
        : isDuplicate
          ? coins
          : coins - activeConfig.cost;
      // Log entry for the history modal.
      const itemLabel =
        tab === "capas"
          ? channelLabel(winner)
          : tab === "titulos"
            ? (titleById[winner]?.label ?? winner)
            : (NAME_BY_ID[winner]?.label ?? winner);
      logPurchase({
        kind: tab === "capas" ? "capa" : tab === "titulos" ? "titulo" : "nome",
        itemId: winner,
        itemLabel,
        rarity,
        cost: activeConfig.cost,
        refunded: !wasFree && isDuplicate,
        free: wasFree,
        balanceAfter,
      });
      // Highlight: dim siblings + subtle scale on the winner. The winner
      // gets side margins to push neighbours away; compensate the strip
      // translation by the same amount so the winner stays under the
      // indicator.
      setReveal({ idx: WIN_INDEX, rarity });
      setTranslateX((tx) => tx - WINNER_SIDE_MARGIN);
      if (rarity === "epico" || rarity === "exclusivo" || rarity === "lendaria") {
        const ind = indicatorRef.current;
        if (ind) {
          const r = ind.getBoundingClientRect();
          setBurstPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
        window.setTimeout(() => setConfettiBurst((n) => n + 1), 300);
      }
    }, duration + 100);
  }

  function resetRoulette() {
    if (spinning) return;
    // Back to preview mode + reroll preview cards so it's visually obvious.
    setRouletteItems([]);
    setPreviewSeed((s) => s + 1);
    setReveal(null);
    // Directly snap to the idle position right now (don't wait for effect).
    const cardStride = CARD_WIDTH + CARD_GAP;
    const STRIP_PADDING_LEFT = 0;
    const indicatorX = getIndicatorOffset();
    const cardsToLeft = Math.ceil(indicatorX / cardStride) + 1;
    const targetCenter =
      STRIP_PADDING_LEFT + cardsToLeft * cardStride + CARD_WIDTH / 2;
    setTranslateX(-(targetCenter - indicatorX));
  }

  return (
    <div className="relative pb-12">
      {/* Header */}
      <div className="flex items-start justify-between pt-[6vh]">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Loja
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-[1.6] tracking-[-0.01em] text-[#7c7c7c]">
            Troque seus Riot Points por novas capas, títulos e outros itens da
            comunidade.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-[8px]">
          <Image
            src="/images/coin/Coin_icon2.png"
            alt="moedas"
            width={22}
            height={22}
            className="shrink-0"
          />
          <span className="text-[16px] font-bold tracking-[-0.02em] text-[#0f0f0f] tabular-nums">
            {(displayCoins ?? coins).toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Category tabs — sliding orange indicator */}
      <div className="relative mt-[28px] flex items-center gap-[8px] border-b border-[#e6e0db]">
        <button
          ref={(el) => {
            tabRefs.current.capas = el;
          }}
          type="button"
          onClick={() => setTab("capas")}
          className={`relative px-[4px] py-[10px] text-[14px] font-bold tracking-[-0.02em] transition-colors ${
            tab === "capas" ? "text-[#0f0f0f]" : "text-[#c3bdb8] hover:text-[#0f0f0f]"
          }`}
        >
          Capas
        </button>
        <button
          ref={(el) => {
            tabRefs.current.titulos = el;
          }}
          type="button"
          onClick={() => setTab("titulos")}
          className={`relative px-[4px] py-[10px] text-[14px] font-bold tracking-[-0.02em] transition-colors ${
            tab === "titulos" ? "text-[#0f0f0f]" : "text-[#c3bdb8] hover:text-[#0f0f0f]"
          }`}
        >
          Títulos
        </button>
        <button
          ref={(el) => {
            tabRefs.current.nomes = el;
          }}
          type="button"
          onClick={() => setTab("nomes")}
          className={`relative px-[4px] py-[10px] text-[14px] font-bold tracking-[-0.02em] transition-colors ${
            tab === "nomes" ? "text-[#0f0f0f]" : "text-[#c3bdb8] hover:text-[#0f0f0f]"
          }`}
        >
          Nomes
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-px h-[2px] bg-[#ff4100] transition-[left,width] duration-300 ease-out"
          style={{ left: tabIndicator.left, width: tabIndicator.width }}
        />
      </div>

      <div className="flex flex-col items-center pt-[28px]">
      {/* Roulette — extends edge-to-edge of the viewport on xl. The indicator
          stays aligned with the main column center (where the action button is). */}
      <section className="relative z-0 w-full overflow-hidden xl:-mr-[45px] xl:w-[calc(100%+45px)]">
        <div className="relative h-[240px] overflow-hidden">
          <div
            ref={stripRef}
            className="absolute inset-y-0 flex items-center"
            style={{
              gap: `${CARD_GAP}px`,
              paddingLeft: 0,
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: resetting
                ? "none"
                : spinning
                  ? `transform ${fastMode ? SPIN_DURATION_FAST_MS : SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.72, 0.28, 1)`
                  : reveal
                    ? "transform 300ms ease-out"
                    : "none",
              willChange: "transform",
            }}
          >
            {displayStrip.map((id, idx) => {
              const isWinner = reveal !== null && reveal.idx === idx;
              const isDimmed = reveal !== null && !isWinner;
              const rarity = activeConfig.getRarity(id);
              const itemRarity: TitleRarity | null =
                tab === "titulos"
                  ? ((titleById[id]?.rarity ?? "comum") as TitleRarity)
                  : tab === "nomes"
                    ? ((NAME_BY_ID[id]?.rarity ?? "comum") as TitleRarity)
                    : null;
              const hasSmoke =
                itemRarity !== null && rarityHasSmoke(itemRarity);
              // Tab-specific card background:
              //   capas: dark (image fills it)
              //   titulos: solid rarity colour (or dark for smoke premium)
              //   nomes: light grey (text styling needs contrast) or dark for smoke premium
              let cardBg: string | undefined = undefined;
              if (tab === "titulos") {
                cardBg = hasSmoke ? undefined : RARITY_COLOR[rarity];
              } else if (tab === "nomes") {
                cardBg = "#ededed";
              }
              return (
                <div
                  key={idx}
                  className={`relative shrink-0 overflow-hidden rounded-[var(--panel-radius-card)] bg-[#0c0c0c] transition-[transform,opacity,filter,margin] duration-300 ease-out ${
                    tab === "capas" || tab === "nomes" ? "border-[2px]" : ""
                  }`}
                  style={{
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    opacity: isDimmed ? 0.35 : 1,
                    filter: isDimmed ? "brightness(0.7)" : "none",
                    transform: isWinner ? `scale(${WINNER_SCALE})` : "scale(1)",
                    marginLeft: isWinner ? WINNER_SIDE_MARGIN : 0,
                    marginRight: isWinner ? WINNER_SIDE_MARGIN : 0,
                    zIndex: isWinner ? 2 : 1,
                    background: cardBg,
                    borderColor:
                      tab === "capas" || tab === "nomes"
                        ? RARITY_COLOR[rarity]
                        : undefined,
                  }}
                >
                  {tab === "capas" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getSplashImageSrc(id, "thumb")}
                        alt={id}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </>
                  ) : tab === "titulos" ? (
                    <>
                      {hasSmoke && itemRarity && (
                        <RaritySmokeOverlay rarity={itemRarity} />
                      )}
                      <div className="absolute inset-0 z-10 flex items-center justify-center px-[16px] text-center">
                        <span className="text-[18px] font-medium leading-[1.15] tracking-[-0.02em] text-white">
                          {titleById[id]?.label ?? id}
                        </span>
                      </div>
                    </>
                  ) : (
                    // nomes — bg neutro, sem smoke, sem dot de raridade
                    <div className="absolute inset-0 z-10 flex items-center justify-center px-[16px] text-center">
                      <StyledName
                        styleId={id}
                        className="text-[18px] font-medium leading-[1.15] tracking-[-0.02em]"
                      >
                        {NAME_BY_ID[id]?.label ?? id}
                      </StyledName>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indicator wrapper — pinned to the main column area so its centre
              equals the action button's centre below. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 xl:right-[45px]">
            <div
              ref={indicatorRef}
              className="absolute left-1/2 top-0 z-10 h-full w-[2px] -translate-x-1/2 bg-[#ff4100]"
            >
              {/* Top arrow pointing down */}
              <div
                className="absolute left-1/2 top-0 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderTop: "10px solid #ff4100",
                }}
              />
              {/* Bottom arrow pointing up */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "10px solid #ff4100",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Action */}
      <div className="mt-6 flex w-full flex-col items-center gap-[18px]">
        <div className="relative w-full">
          <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-[10px]">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Histórico"
              title="Histórico"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-[18px] bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
            >
              <History className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            <p className="whitespace-nowrap text-[12px] font-semibold tracking-[-0.02em] text-[#7c7c7c]">
              {activeConfig.ownedCount}
              <span className="mx-[2px] text-[#bdbdbd]">/</span>
              {activeConfig.totalCount} liberad
              {tab === "capas" ? "as" : "os"}
            </p>
          </div>
          <div className="pointer-events-none absolute right-[calc(50%+202px)] top-1/2 flex -translate-y-1/2 items-center gap-[6px] whitespace-nowrap text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
            <Image
              src="/images/coin/Coin_icon2.png"
              alt=""
              width={18}
              height={18}
              className="inline-block"
            />
            <span>{activeConfig.cost}</span>
          </div>
          <button
            type="button"
            onClick={openCase}
            disabled={!canOpen}
            className="mx-auto flex h-[50px] w-[380px] items-center justify-center gap-[10px] rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {spinning ? (
              <>
                Girando roleta
                <svg className="capas-spinner" viewBox="25 25 50 50">
                  <circle r="20" cy="50" cx="50" />
                </svg>
              </>
            ) : (
              <>Girar roleta</>
            )}
          </button>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-[10px]">
            <button
              type="button"
              onClick={resetRoulette}
              disabled={spinning}
              aria-label="Resetar roleta"
              title="Resetar roleta"
              className="flex h-[50px] w-[50px] items-center justify-center rounded-[18px] bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => setFastMode((v) => !v)}
              aria-label={fastMode ? "Desativar modo rápido" : "Ativar modo rápido"}
              title={fastMode ? "Modo rápido ativado" : "Acelerar animação"}
              aria-pressed={fastMode}
              className={`flex h-[50px] w-[50px] items-center justify-center rounded-[18px] bg-[#ededed] transition-colors hover:bg-[#e3e3e3] ${
                fastMode ? "text-[#ff4100]" : "text-[#0f0f0f]"
              }`}
            >
              <Zap
                className="h-[18px] w-[18px]"
                strokeWidth={2.2}
                fill="currentColor"
              />
            </button>
          </div>
        </div>
        {tab === "capas" && (
          <p className="text-[12px] font-semibold tracking-[-0.02em] text-[#7c7c7c]">
            {freeSpinAvailable ? (
              <span>x1 Giro gratuito</span>
            ) : (
              <span className="tabular-nums">
                Próximo grátis em {formatCountdown(freeSpinMsLeft)}
              </span>
            )}
          </p>
        )}
        {insufficientFunds && (
          <p className="text-[12px] font-semibold text-[#c53030]">
            Saldo insuficiente. Você precisa de {activeConfig.cost} moedas.
          </p>
        )}
      </div>
      </div>

      {/* Case contents — all possible banners */}
      <div className="mt-12 flex items-center px-1 pb-2">
        <h3 className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          Você pode ganhar qualquer um desses:
        </h3>
      </div>
      <section className="rounded-[var(--panel-radius-card)] bg-[#f7f7f7] py-3">
        {tab === "capas" ? (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 2xl:grid-cols-[repeat(16,minmax(0,1fr))]">
              {sortedBannerPool.slice(0, visibleCount).map((fileName) => {
                const owned = isBannerUnlocked(fileName);
                const loaded = loadedImages.has(fileName);
                const rarity = getBannerRarity(fileName);
                return (
                  <div
                    key={fileName}
                    className={`relative aspect-[1215/717] overflow-hidden border-[2px] [container-type:inline-size] rounded-[clamp(4px,6cqw,16px)] ${
                      loaded ? "bg-[#0c0c0c]" : "animate-pulse bg-[#d0d0d0]"
                    }`}
                    style={{
                      opacity: owned ? 0.1 : 1,
                      borderColor: RARITY_COLOR[rarity],
                    }}
                  >
                    <Image
                      src={getSplashImageSrc(fileName, "thumb")}
                      alt={fileName}
                      fill
                      onLoad={() => markImageLoaded(fileName)}
                      className={`object-cover transition-opacity duration-300 ${
                        loaded ? "opacity-100" : "opacity-0"
                      }`}
                      sizes="(min-width: 1280px) 130px, (min-width: 768px) 16vw, 33vw"
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            {visibleCount < bannerPool.length && (
              <div
                ref={loadMoreRef}
                className="mt-6 flex items-center justify-center gap-[8px] text-[12px] font-semibold tracking-[-0.02em] text-[#7c7c7c]"
              >
                Carregando mais
                <svg className="capas-spinner" viewBox="25 25 50 50">
                  <circle r="20" cy="50" cx="50" />
                </svg>
              </div>
            )}
          </>
        ) : tab === "titulos" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {[...titlePool]
              .sort(
                (a, b) =>
                  TITLE_RARITY_RANK[a.rarity] - TITLE_RARITY_RANK[b.rarity],
              )
              .map((title) => {
              const owned = unlockedTitles.includes(title.id);
              const hasSmoke = rarityHasSmoke(title.rarity);
              return (
                <div
                  key={title.id}
                  className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-[var(--panel-radius-block)] px-[10px] text-center"
                  style={{
                    background: hasSmoke
                      ? "#0c0c0c"
                      : RARITY_COLOR[title.rarity as BannerRarity],
                    opacity: owned ? 0.25 : 1,
                  }}
                >
                  {hasSmoke && <RaritySmokeOverlay rarity={title.rarity} />}
                  <span className="relative z-10 text-[13px] font-medium leading-[1.15] tracking-[-0.02em] text-white">
                    {title.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          // nomes — bg neutro #ededed, sem smoke, sem dot
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {[...NAME_POOL]
              .sort(
                (a, b) =>
                  TITLE_RARITY_RANK[a.rarity] - TITLE_RARITY_RANK[b.rarity],
              )
              .map((name) => {
                const owned = unlockedNames.includes(name.id);
                return (
                  <div
                    key={name.id}
                    className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-[var(--panel-radius-block)] border-2 px-[10px] text-center"
                    style={{
                      background: "#ededed",
                      borderColor:
                        RARITY_COLOR[name.rarity as BannerRarity] ?? "#ededed",
                      opacity: owned ? 0.35 : 1,
                    }}
                  >
                    <StyledName
                      styleId={name.id}
                      className="text-[15px] font-bold leading-[1.15] tracking-[-0.02em]"
                    >
                      {name.label}
                    </StyledName>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <PurchaseHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={historyEntries}
      />

      {/* Confetti burst — portalled to body so it isn't clipped by the
          overflow-hidden roulette section. Anchored at the centre of the
          winning card via fixed positioning. */}
      {mounted && confettiBurst > 0 && burstPos &&
        createPortal(
          <div
            key={confettiBurst}
            aria-hidden
            className="pointer-events-none fixed z-[9999]"
            style={{ left: burstPos.x, top: burstPos.y }}
          >
            {confettiPieces.map((p) => (
              <span
                key={p.id}
                className="capas-confetti-piece"
                style={
                  {
                    width: `${p.size}px`,
                    height: `${p.size * 0.55}px`,
                    background: p.color,
                    borderRadius: "2px",
                    ["--tx" as string]: p.tx,
                    ["--peak" as string]: p.peak,
                    ["--fall" as string]: p.fall,
                    ["--rot" as string]: p.rot,
                    ["--dur" as string]: p.dur,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
