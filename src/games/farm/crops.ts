// Data + pure helpers for the Farm mini-game. The farm is a real little
// management game (plant -> grow -> water -> harvest -> sell -> reinvest),
// not the generic idle-clicker. All timing/economy lives here so the store
// and UI stay declarative.

export interface CropDef {
  id: string
  name: string
  /** Ripe crop emoji (shown when fully grown and in the barn). */
  emoji: string
  /** Coins spent to plant one (buy-and-plant in a single tap). */
  seedCost: number
  /** Seconds to grow with no watering / upgrades. */
  growSeconds: number
  /** Coins earned per crop when sold at the market (before bonuses). */
  sellValue: number
  /** totalEarned needed before this crop can be planted. */
  unlockAt: number
}

export const CROPS: CropDef[] = [
  { id: 'carrot', name: 'Морковь', emoji: '🥕', seedCost: 6, growSeconds: 6, sellValue: 14, unlockAt: 0 },
  { id: 'strawberry', name: 'Клубника', emoji: '🍓', seedCost: 20, growSeconds: 12, sellValue: 52, unlockAt: 220 },
  { id: 'tomato', name: 'Помидоры', emoji: '🍅', seedCost: 60, growSeconds: 20, sellValue: 170, unlockAt: 900 },
  { id: 'corn', name: 'Кукуруза', emoji: '🌽', seedCost: 180, growSeconds: 32, sellValue: 540, unlockAt: 3200 },
  { id: 'pumpkin', name: 'Тыква', emoji: '🎃', seedCost: 600, growSeconds: 55, sellValue: 1950, unlockAt: 12000 },
  { id: 'grapes', name: 'Виноград', emoji: '🍇', seedCost: 2000, growSeconds: 85, sellValue: 6800, unlockAt: 35000 },
]

const CROP_BY_ID = new Map(CROPS.map((c) => [c.id, c]))

export function cropById(id: string): CropDef | undefined {
  return CROP_BY_ID.get(id)
}

export interface FarmUpgradeDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  /** Multiplicative cost growth per level (ignored for one-shot upgrades). */
  costGrowth: number
  describe: (nextLevel: number) => string
}

export const FARM_UPGRADES: FarmUpgradeDef[] = [
  {
    id: 'sprinkler',
    name: 'Дождеватель',
    emoji: '🚿',
    maxLevel: 5,
    baseCost: 300,
    costGrowth: 2.2,
    describe: (lvl) => `Рост быстрее (уровень ${lvl}, +20%)`,
  },
  {
    id: 'stall',
    name: 'Рыночный ларёк',
    emoji: '🏪',
    maxLevel: 5,
    baseCost: 420,
    costGrowth: 2.35,
    describe: (lvl) => `Продажа дороже (уровень ${lvl}, +15%)`,
  },
  {
    id: 'harvester',
    name: 'Комбайн',
    emoji: '🤖',
    maxLevel: 1,
    baseCost: 9000,
    costGrowth: 1,
    describe: () => 'Автоматически собирает спелый урожай',
  },
  {
    id: 'delivery',
    name: 'Грузовик доставки',
    emoji: '🚚',
    maxLevel: 1,
    baseCost: 16000,
    costGrowth: 1,
    describe: () => 'Сам отвозит урожай на рынок и продаёт',
  },
  {
    id: 'golden',
    name: 'Золотые руки',
    emoji: '✨',
    maxLevel: 1,
    baseCost: 26000,
    costGrowth: 1,
    describe: () => 'Шанс 25% собрать двойной урожай',
  },
]

const UPGRADE_BY_ID = new Map(FARM_UPGRADES.map((u) => [u.id, u]))

export function upgradeById(id: string): FarmUpgradeDef | undefined {
  return UPGRADE_BY_ID.get(id)
}

// --- Plots ---------------------------------------------------------------
export const START_PLOTS = 4
export const MAX_PLOTS = 16

/** Coins for the next plot, given how many are already owned. */
export function plotPrice(plotCount: number): number {
  return Math.ceil(70 * Math.pow(1.55, plotCount - START_PLOTS))
}

// --- Derived multipliers -------------------------------------------------
export function growthMult(upgrades: Record<string, number>): number {
  return 1 + 0.2 * (upgrades.sprinkler ?? 0)
}

export function sellMult(upgrades: Record<string, number>): number {
  return 1 + 0.15 * (upgrades.stall ?? 0)
}

/** Cap on how much watering can shave off a single crop (fraction of grow time). */
export const WATER_CAP = 0.6
/** Fraction of total grow time a single tap of water grants. */
export const WATER_STEP = 0.16
