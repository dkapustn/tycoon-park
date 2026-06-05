// Data + pure helpers for the Кофейня mini-game: a café where customers queue
// with drink orders and a patience timer. You tap a customer to brew & serve
// their drink before they leave. All tuning lives here.

export interface DrinkDef {
  id: string
  name: string
  emoji: string
  /** Base coins earned for serving (before tip). */
  price: number
  /** Seconds a barista station needs to brew it (before speed upgrades). */
  brewSeconds: number
  /** totalEarned needed before customers start ordering it. */
  unlockAt: number
}

export const DRINKS: DrinkDef[] = [
  { id: 'espresso', name: 'Эспрессо', emoji: '☕', price: 16, brewSeconds: 1.8, unlockAt: 0 },
  { id: 'cappuccino', name: 'Капучино', emoji: '🥛', price: 48, brewSeconds: 2.5, unlockAt: 400 },
  { id: 'latte', name: 'Латте', emoji: '🧋', price: 125, brewSeconds: 3.2, unlockAt: 2200 },
  { id: 'mocha', name: 'Мокачино', emoji: '🍫', price: 330, brewSeconds: 4.0, unlockAt: 9000 },
  { id: 'iced', name: 'Айс-латте', emoji: '🧊', price: 820, brewSeconds: 4.8, unlockAt: 28000 },
]

const DRINK_BY_ID = new Map(DRINKS.map((d) => [d.id, d]))

export function drinkById(id: string): DrinkDef | undefined {
  return DRINK_BY_ID.get(id)
}

export function unlockedDrinks(totalEarned: number): DrinkDef[] {
  const list = DRINKS.filter((d) => totalEarned >= d.unlockAt)
  return list.length > 0 ? list : [DRINKS[0]]
}

export interface CoffeeUpgradeDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  costGrowth: number
  currency?: 'coins' | 'diamonds'
  describe: (nextLevel: number) => string
}

export const COFFEE_UPGRADES: CoffeeUpgradeDef[] = [
  {
    id: 'barista',
    name: 'Бариста',
    emoji: '👩‍🍳',
    maxLevel: 5,
    baseCost: 110,
    costGrowth: 1.95,
    describe: (l) => `+1 одновременная готовка (всего ${START_STATIONS + l})`,
  },
  {
    id: 'machine',
    name: 'Скоростная кофемашина',
    emoji: '⚡',
    maxLevel: 4,
    baseCost: 700,
    costGrowth: 2.3,
    describe: (l) => `Готовка быстрее (уровень ${l}, −14%)`,
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
    name: 'Реклама',
    emoji: '📣',
    maxLevel: 4,
    baseCost: 550,
    costGrowth: 2.2,
    describe: (l) => `Гости приходят чаще (уровень ${l})`,
  },
  {
    id: 'lounge',
    name: 'Уютный зал',
    emoji: '🛋️',
    maxLevel: 3,
    baseCost: 1500,
    costGrowth: 2.5,
    describe: (l) => `Гости ждут дольше (уровень ${l})`,
  },
  {
    id: 'auto',
    name: 'Авто-бариста',
    emoji: '🤖',
    maxLevel: 1,
    baseCost: 16000,
    costGrowth: 1,
    describe: () => 'Сам начинает готовить заказы',
  },
  // Premium (💎 diamonds)
  {
    id: 'brand',
    name: 'Звёздный бренд',
    emoji: '🌟',
    maxLevel: 1,
    baseCost: 20,
    costGrowth: 1,
    currency: 'diamonds',
    describe: () => 'Чаевые ×2 со всех заказов',
  },
  {
    id: 'signature',
    name: 'Фирменные зёрна',
    emoji: '☕',
    maxLevel: 3,
    baseCost: 10,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Чаще даришь товары гостям (уровень ${l})`,
  },
]

const UPGRADE_BY_ID = new Map(COFFEE_UPGRADES.map((u) => [u.id, u]))

export function coffeeUpgradeById(id: string): CoffeeUpgradeDef | undefined {
  return UPGRADE_BY_ID.get(id)
}

// --- Tuning constants ----------------------------------------------------
export const START_STATIONS = 1
export const START_SEATS = 3
export const BASE_PATIENCE_MS = 12000
export const BASE_ARRIVAL_MS = 2200
/** Fraction of price paid as tip when served instantly (scales with patience). */
export const TIP_FRACTION = 0.6
/** VIP customers tip big and always leave a gift item. */
export const VIP_CHANCE = 0.06
export const VIP_BONUS_MULT = 3

// --- Derived from upgrade levels ----------------------------------------
export function stationCount(u: Record<string, number>): number {
  return START_STATIONS + (u.barista ?? 0)
}
export function seatCount(u: Record<string, number>): number {
  return START_SEATS + (u.tables ?? 0)
}
export function brewMs(drink: DrinkDef, u: Record<string, number>): number {
  return drink.brewSeconds * 1000 * Math.pow(0.86, u.machine ?? 0)
}
export function arrivalMs(u: Record<string, number>): number {
  return BASE_ARRIVAL_MS * Math.pow(0.82, u.ad ?? 0)
}
export function patienceMs(u: Record<string, number>): number {
  return BASE_PATIENCE_MS * (1 + 0.35 * (u.lounge ?? 0))
}
export function tipMult(u: Record<string, number>): number {
  return (u.brand ?? 0) > 0 ? 2 : 1
}
export function itemDropChance(u: Record<string, number>): number {
  return Math.min(0.4, 0.03 + 0.05 * (u.signature ?? 0))
}
