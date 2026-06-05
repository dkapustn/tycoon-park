// Meta-progression: a global "Tycoon level" fed by every coin earned across all
// games, plus permanent diamond-shop boosts that apply everywhere. Pure helpers
// only — no store imports — so both stores can read these safely.

export interface Stats {
  harvested: number
  cropsSold: number
  ordersFilled: number
  treasuresFound: number
  coinsEarned: number
  served: number
  vipServed: number
  giftsReceived: number
  diamondsEarned: number
  pizzasBaked: number
  perfectBakes: number
  oresMined: number
}

export function emptyStats(): Stats {
  return {
    harvested: 0,
    cropsSold: 0,
    ordersFilled: 0,
    treasuresFound: 0,
    coinsEarned: 0,
    served: 0,
    vipServed: 0,
    giftsReceived: 0,
    diamondsEarned: 0,
    pizzasBaked: 0,
    perfectBakes: 0,
    oresMined: 0,
  }
}

// --- Tycoon level --------------------------------------------------------
/** Coins required to advance FROM `level` to the next. Early levels are quick. */
export function levelCost(level: number): number {
  return Math.round(70 * Math.pow(1.45, level))
}

export interface LevelInfo {
  level: number
  into: number
  span: number
  progress: number
}

/** Resolves total lifetime coins (xp) into a level + progress to the next. */
export function levelFromXp(xp: number): LevelInfo {
  let level = 0
  let rem = Math.max(0, xp)
  while (level < 999) {
    const c = levelCost(level)
    if (rem >= c) {
      rem -= c
      level++
    } else {
      return { level, into: rem, span: c, progress: c > 0 ? rem / c : 0 }
    }
  }
  return { level, into: 0, span: levelCost(level), progress: 1 }
}

/** 💎 awarded for reaching a given level (bigger levels pay more). */
export function levelReward(level: number): number {
  return 2 + Math.floor(level / 2)
}

// --- Magnate shop (global, permanent, bought with 💎) --------------------
export interface BoostDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  costGrowth: number
  describe: (nextLevel: number) => string
}

export const MAGNATE_BOOSTS: BoostDef[] = [
  {
    id: 'income',
    name: 'Бизнес-империя',
    emoji: '🚀',
    maxLevel: 10,
    baseCost: 15,
    costGrowth: 1.6,
    describe: (l) => `+12% дохода во всех играх (ур. ${l})`,
  },
  {
    id: 'luck',
    name: 'Удача магната',
    emoji: '🍀',
    maxLevel: 6,
    baseCost: 20,
    costGrowth: 1.7,
    describe: (l) => `+3% к шансу находок и подарков (ур. ${l})`,
  },
  {
    id: 'gem',
    name: 'Огранщик',
    emoji: '💠',
    maxLevel: 6,
    baseCost: 18,
    costGrowth: 1.7,
    describe: (l) => `Ценности продаются на +15% дороже (ур. ${l})`,
  },
]

export function boostCost(def: BoostDef, level: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level))
}

export function globalIncomeMult(boosts: Record<string, number>): number {
  return 1 + 0.12 * (boosts.income ?? 0)
}
export function globalLuckBonus(boosts: Record<string, number>): number {
  return 0.03 * (boosts.luck ?? 0)
}
export function globalGemMult(boosts: Record<string, number>): number {
  return 1 + 0.15 * (boosts.gem ?? 0)
}
