// Data + pure helpers for the Пекарня (Bakery) mini-game. The hook is SUPPLY &
// DEMAND: tap pastry buttons to bake trays into your shelf STOCK, then fulfill
// customers whose orders are COMBOS of several pastries — but only if you've
// baked enough. Juggling what to bake vs. what's being ordered is the game.

export interface PastryDef {
  id: string
  name: string
  emoji: string
  price: number
  bakeSeconds: number
  /** Units added to the shelf when a tray finishes. */
  batch: number
  unlockAt: number
}

export const PASTRIES: PastryDef[] = [
  { id: 'croissant', name: 'Круассан', emoji: '🥐', price: 14, bakeSeconds: 2.5, batch: 3, unlockAt: 0 },
  { id: 'baguette', name: 'Багет', emoji: '🥖', price: 32, bakeSeconds: 3.2, batch: 3, unlockAt: 450 },
  { id: 'cupcake', name: 'Капкейк', emoji: '🧁', price: 80, bakeSeconds: 4.0, batch: 3, unlockAt: 2400 },
  { id: 'cake', name: 'Торт', emoji: '🍰', price: 200, bakeSeconds: 5.0, batch: 2, unlockAt: 10000 },
  { id: 'pretzel', name: 'Крендель', emoji: '🥨', price: 480, bakeSeconds: 6.0, batch: 2, unlockAt: 30000 },
]

const PASTRY_BY_ID = new Map(PASTRIES.map((p) => [p.id, p]))
export function pastryById(id: string): PastryDef | undefined {
  return PASTRY_BY_ID.get(id)
}
export function unlockedPastries(totalEarned: number): PastryDef[] {
  const list = PASTRIES.filter((p) => totalEarned >= p.unlockAt)
  return list.length > 0 ? list : [PASTRIES[0]]
}

export interface BakeryUpgradeDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  costGrowth: number
  currency?: 'coins' | 'diamonds'
  describe: (nextLevel: number) => string
}

export const BAKERY_UPGRADES: BakeryUpgradeDef[] = [
  {
    id: 'oven',
    name: 'Печь',
    emoji: '🔥',
    maxLevel: 5,
    baseCost: 140,
    costGrowth: 1.95,
    describe: (l) => `+1 одновременная выпечка (всего ${START_OVENS + l})`,
  },
  {
    id: 'mixer',
    name: 'Тестомес',
    emoji: '⚡',
    maxLevel: 4,
    baseCost: 800,
    costGrowth: 2.3,
    describe: (l) => `Выпечка быстрее (уровень ${l}, −14%)`,
  },
  {
    id: 'shelf',
    name: 'Витрина',
    emoji: '🗄️',
    maxLevel: 5,
    baseCost: 260,
    costGrowth: 2.0,
    describe: (l) => `+8 к вместимости витрины (всего ${SHELF_BASE + 8 * l})`,
  },
  {
    id: 'seats',
    name: 'Зал',
    emoji: '🪑',
    maxLevel: 5,
    baseCost: 220,
    costGrowth: 2.05,
    describe: (l) => `+1 место для гостей (всего ${START_SEATS + l})`,
  },
  {
    id: 'ad',
    name: 'Витринная реклама',
    emoji: '📣',
    maxLevel: 4,
    baseCost: 600,
    costGrowth: 2.2,
    describe: (l) => `Гости приходят чаще (уровень ${l})`,
  },
  {
    id: 'autobaker',
    name: 'Авто-пекарь',
    emoji: '🤖',
    maxLevel: 1,
    baseCost: 9000,
    costGrowth: 1,
    describe: () => 'Сам печёт, чтобы витрина не пустела',
  },
  {
    id: 'autoseller',
    name: 'Продавец',
    emoji: '🛎️',
    maxLevel: 1,
    baseCost: 17000,
    costGrowth: 1,
    describe: () => 'Сам выдаёт заказы, если всё есть на витрине',
  },
  // Premium (💎 diamonds)
  {
    id: 'recipe',
    name: 'Секретный рецепт',
    emoji: '📖',
    maxLevel: 3,
    baseCost: 12,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `+1 к размеру партии выпечки (уровень ${l})`,
  },
  {
    id: 'brand',
    name: 'Знаменитый бренд',
    emoji: '🌟',
    maxLevel: 1,
    baseCost: 20,
    costGrowth: 1,
    currency: 'diamonds',
    describe: () => 'Чаевые ×2 со всех заказов',
  },
  {
    id: 'fresh',
    name: 'Фирменная глазурь',
    emoji: '🍫',
    maxLevel: 3,
    baseCost: 10,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Чаще даришь товары гостям (уровень ${l})`,
  },
]

const UPGRADE_BY_ID = new Map(BAKERY_UPGRADES.map((u) => [u.id, u]))
export function bakeryUpgradeById(id: string): BakeryUpgradeDef | undefined {
  return UPGRADE_BY_ID.get(id)
}

// --- Tuning constants ----------------------------------------------------
export const START_OVENS = 2
export const START_SEATS = 3
export const SHELF_BASE = 16
export const BASE_PATIENCE_MS = 16000
export const BASE_ARRIVAL_MS = 2600
export const ORDER_BONUS = 1.35
export const TIP_FRACTION = 0.4
export const VIP_CHANCE = 0.06
export const VIP_BONUS_MULT = 3

// --- Derived from upgrade levels ----------------------------------------
export function ovenCount(u: Record<string, number>): number {
  return START_OVENS + (u.oven ?? 0)
}
export function shelfCap(u: Record<string, number>): number {
  return SHELF_BASE + 8 * (u.shelf ?? 0)
}
export function seatCount(u: Record<string, number>): number {
  return START_SEATS + (u.seats ?? 0)
}
export function bakeMs(p: PastryDef, u: Record<string, number>): number {
  return p.bakeSeconds * 1000 * Math.pow(0.86, u.mixer ?? 0)
}
export function batchOf(p: PastryDef, u: Record<string, number>): number {
  return p.batch + (u.recipe ?? 0)
}
export function arrivalMs(u: Record<string, number>): number {
  return BASE_ARRIVAL_MS * Math.pow(0.82, u.ad ?? 0)
}
export function tipMult(u: Record<string, number>): number {
  return (u.brand ?? 0) > 0 ? 2 : 1
}
export function itemDropChance(u: Record<string, number>): number {
  return Math.min(0.4, 0.03 + 0.05 * (u.fresh ?? 0))
}
