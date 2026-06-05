// Data + pure helpers for the Пиццерия mini-game. The hook here is OVEN TIMING:
// you tap an order to start baking, then tap again to pull the pizza out during
// the "perfect" window. Nail it for a combo bonus; pull early/late for less;
// let it burn and it's ruined. Distinct from the farm (growth) and café (queue).

export interface PizzaDef {
  id: string
  name: string
  emoji: string
  price: number
  bakeSeconds: number
  unlockAt: number
}

export const PIZZAS: PizzaDef[] = [
  { id: 'margherita', name: 'Маргарита', emoji: '🧀', price: 18, bakeSeconds: 2.2, unlockAt: 0 },
  { id: 'pepperoni', name: 'Пепперони', emoji: '🍖', price: 52, bakeSeconds: 3.0, unlockAt: 450 },
  { id: 'mushroom', name: 'Грибная', emoji: '🍄', price: 130, bakeSeconds: 3.8, unlockAt: 2400 },
  { id: 'hawaiian', name: 'Гавайская', emoji: '🍍', price: 320, bakeSeconds: 4.6, unlockAt: 10000 },
  { id: 'meat', name: 'Мясная', emoji: '🥓', price: 800, bakeSeconds: 5.4, unlockAt: 30000 },
]

const PIZZA_BY_ID = new Map(PIZZAS.map((p) => [p.id, p]))

export function pizzaById(id: string): PizzaDef | undefined {
  return PIZZA_BY_ID.get(id)
}

export function unlockedPizzas(totalEarned: number): PizzaDef[] {
  const list = PIZZAS.filter((p) => totalEarned >= p.unlockAt)
  return list.length > 0 ? list : [PIZZAS[0]]
}

export interface PizzaUpgradeDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  costGrowth: number
  currency?: 'coins' | 'diamonds'
  describe: (nextLevel: number) => string
}

export const PIZZA_UPGRADES: PizzaUpgradeDef[] = [
  {
    id: 'oven',
    name: 'Печь',
    emoji: '🔥',
    maxLevel: 5,
    baseCost: 130,
    costGrowth: 1.95,
    describe: (l) => `+1 одновременная выпечка (всего ${START_OVENS + l})`,
  },
  {
    id: 'dough',
    name: 'Скоростное тесто',
    emoji: '⚡',
    maxLevel: 4,
    baseCost: 750,
    costGrowth: 2.3,
    describe: (l) => `Печётся быстрее (уровень ${l}, −14%)`,
  },
  {
    id: 'tables',
    name: 'Больше столиков',
    emoji: '🪑',
    maxLevel: 5,
    baseCost: 200,
    costGrowth: 2.05,
    describe: (l) => `+1 место в зале (всего ${START_SEATS + l})`,
  },
  {
    id: 'ad',
    name: 'Промо-акции',
    emoji: '📣',
    maxLevel: 4,
    baseCost: 550,
    costGrowth: 2.2,
    describe: (l) => `Гости приходят чаще (уровень ${l})`,
  },
  {
    id: 'decor',
    name: 'Уютный зал',
    emoji: '🪴',
    maxLevel: 3,
    baseCost: 1500,
    costGrowth: 2.5,
    describe: (l) => `Гости ждут дольше (уровень ${l})`,
  },
  {
    id: 'autobaker',
    name: 'Робот-пиццайоло',
    emoji: '🤖',
    maxLevel: 1,
    baseCost: 17000,
    costGrowth: 1,
    describe: () => 'Сам достаёт пиццу в идеальный момент',
  },
  // Premium (💎 diamonds)
  {
    id: 'chef',
    name: 'Шеф-пиццайоло',
    emoji: '🧑‍🍳',
    maxLevel: 3,
    baseCost: 12,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Окно «идеально» шире (уровень ${l})`,
  },
  {
    id: 'brand',
    name: 'Звёздная печь',
    emoji: '🌟',
    maxLevel: 1,
    baseCost: 22,
    costGrowth: 1,
    currency: 'diamonds',
    describe: () => 'Бонус за идеальную пиццу ×2',
  },
  {
    id: 'fresh',
    name: 'Фирменный рецепт',
    emoji: '🍅',
    maxLevel: 3,
    baseCost: 10,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Чаще даришь товары гостям (уровень ${l})`,
  },
]

const UPGRADE_BY_ID = new Map(PIZZA_UPGRADES.map((u) => [u.id, u]))

export function pizzaUpgradeById(id: string): PizzaUpgradeDef | undefined {
  return UPGRADE_BY_ID.get(id)
}

// --- Tuning constants ----------------------------------------------------
export const START_OVENS = 1
export const START_SEATS = 3
export const BASE_PATIENCE_MS = 13000
export const BASE_ARRIVAL_MS = 2400
/** Bake progress (0..1+) where the "perfect" window starts by default. */
export const PERFECT_BASE = 0.7
/** Past this bake progress the pizza is burnt and lost. */
export const BURNT_AT = 1.4
export const UNDERCOOK_FACTOR = 0.6
export const OVERCOOK_FACTOR = 0.5
/** Extra tip (fraction of price) for a perfectly-baked pizza. */
export const PERFECT_TIP = 0.6
export const VIP_CHANCE = 0.06
export const VIP_BONUS_MULT = 3
/** Auto-baker pulls once progress reaches this point. */
export const AUTO_PULL_AT = 0.9

// --- Derived from upgrade levels ----------------------------------------
export function ovenCount(u: Record<string, number>): number {
  return START_OVENS + (u.oven ?? 0)
}
export function seatCount(u: Record<string, number>): number {
  return START_SEATS + (u.tables ?? 0)
}
export function bakeMs(pizza: PizzaDef, u: Record<string, number>): number {
  return pizza.bakeSeconds * 1000 * Math.pow(0.86, u.dough ?? 0)
}
export function arrivalMs(u: Record<string, number>): number {
  return BASE_ARRIVAL_MS * Math.pow(0.82, u.ad ?? 0)
}
export function patienceMs(u: Record<string, number>): number {
  return BASE_PATIENCE_MS * (1 + 0.35 * (u.decor ?? 0))
}
/** Lower start = wider perfect window. Shrinks with the Chef upgrade. */
export function perfectFrom(u: Record<string, number>): number {
  return Math.max(0.5, PERFECT_BASE - 0.06 * (u.chef ?? 0))
}
export function brandTipMult(u: Record<string, number>): number {
  return (u.brand ?? 0) > 0 ? 2 : 1
}
export function itemDropChance(u: Record<string, number>): number {
  return Math.min(0.4, 0.03 + 0.05 * (u.fresh ?? 0))
}

export type BakeQuality = 'under' | 'perfect' | 'over'

/** Resolves a bake-progress value into a quality + price factor. */
export function bakeQuality(progress: number, u: Record<string, number>): { quality: BakeQuality; factor: number } {
  if (progress < perfectFrom(u)) return { quality: 'under', factor: UNDERCOOK_FACTOR }
  if (progress <= 1) return { quality: 'perfect', factor: 1 }
  return { quality: 'over', factor: OVERCOOK_FACTOR }
}

/** Combo multiplier from a run of perfect bakes (caps at +50%). */
export function comboMult(combo: number): number {
  return 1 + Math.min(combo, 10) * 0.05
}
