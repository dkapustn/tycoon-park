// Data + pure helpers for the Шахта (Mine) mini-game. Mechanic: break ore veins
// by tapping (each tap deals damage; a vein has HP). Breaking a vein yields
// coins + a chance at a gem, and pushes you DEEPER, where richer (tougher) ore
// waits. Hired miners deal damage automatically — that's the park's first idle
// engine, so the mine also earns OFFLINE while you're away.

export interface OreDef {
  id: string
  name: string
  emoji: string
  /** Coins for breaking one vein (before cart/global multipliers). */
  value: number
  /** Hit points of a vein at this layer. */
  veinHp: number
  /** Depth (veins broken) at which this layer is reached. */
  depthFrom: number
}

export const ORES: OreDef[] = [
  { id: 'stone', name: 'Камень', emoji: '🪨', value: 3, veinHp: 5, depthFrom: 0 },
  { id: 'coal', name: 'Уголь', emoji: '⚫', value: 9, veinHp: 12, depthFrom: 12 },
  { id: 'copper', name: 'Медь', emoji: '🟤', value: 24, veinHp: 26, depthFrom: 30 },
  { id: 'iron', name: 'Железо', emoji: '⚙️', value: 60, veinHp: 55, depthFrom: 65 },
  { id: 'silver', name: 'Серебро', emoji: '🥈', value: 150, veinHp: 120, depthFrom: 120 },
  { id: 'gold', name: 'Золото', emoji: '🥇', value: 360, veinHp: 260, depthFrom: 210 },
  { id: 'emerald', name: 'Изумруд', emoji: '💚', value: 800, veinHp: 520, depthFrom: 330 },
  { id: 'diamond', name: 'Алмаз', emoji: '💎', value: 1800, veinHp: 1000, depthFrom: 480 },
]

/** Deepest ore layer reached at the given depth. */
export function oreAtDepth(depth: number): OreDef {
  let cur = ORES[0]
  for (const o of ORES) if (depth >= o.depthFrom) cur = o
  return cur
}

/** The next layer that unlocks deeper, or null at the bottom. */
export function nextOre(depth: number): OreDef | null {
  for (const o of ORES) if (o.depthFrom > depth) return o
  return null
}

export interface MineUpgradeDef {
  id: string
  name: string
  emoji: string
  maxLevel: number
  baseCost: number
  costGrowth: number
  currency?: 'coins' | 'diamonds'
  describe: (nextLevel: number) => string
}

export const MINE_UPGRADES: MineUpgradeDef[] = [
  {
    id: 'power',
    name: 'Кирка',
    emoji: '⛏️',
    maxLevel: 12,
    baseCost: 55,
    costGrowth: 1.65,
    describe: (l) => `Урон за тап +2 (всего ${1 + 2 * l})`,
  },
  {
    id: 'miners',
    name: 'Шахтёры',
    emoji: '👷',
    maxLevel: 12,
    baseCost: 160,
    costGrowth: 1.65,
    describe: (l) => `+2 авто-урона/сек (работают и оффлайн), всего ${2 * l}`,
  },
  {
    id: 'drill',
    name: 'Бур',
    emoji: '🛠️',
    maxLevel: 5,
    baseCost: 1600,
    costGrowth: 2.3,
    describe: (l) => `Авто-урон ×1.6 (уровень ${l})`,
  },
  {
    id: 'cart',
    name: 'Вагонетка',
    emoji: '🛒',
    maxLevel: 5,
    baseCost: 1000,
    costGrowth: 2.1,
    describe: (l) => `Руда дороже +25% (уровень ${l})`,
  },
  // Premium (💎 diamonds)
  {
    id: 'exosuit',
    name: 'Экзоскелет',
    emoji: '🦾',
    maxLevel: 3,
    baseCost: 16,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Урон за тап ×2 (уровень ${l})`,
  },
  {
    id: 'turbo',
    name: 'Турбо-бур',
    emoji: '⚡',
    maxLevel: 3,
    baseCost: 20,
    costGrowth: 1.8,
    currency: 'diamonds',
    describe: (l) => `Авто-урон ×2 (уровень ${l})`,
  },
  {
    id: 'detector',
    name: 'Детектор камней',
    emoji: '🔎',
    maxLevel: 5,
    baseCost: 12,
    costGrowth: 1.7,
    currency: 'diamonds',
    describe: (l) => `Чаще находишь самоцветы (уровень ${l})`,
  },
]

const UPGRADE_BY_ID = new Map(MINE_UPGRADES.map((u) => [u.id, u]))
export function mineUpgradeById(id: string): MineUpgradeDef | undefined {
  return UPGRADE_BY_ID.get(id)
}

export const OFFLINE_CAP_MS = 8 * 3600 * 1000

export function tapDamage(u: Record<string, number>): number {
  return (1 + 2 * (u.power ?? 0)) * Math.pow(2, u.exosuit ?? 0)
}
export function autoDps(u: Record<string, number>): number {
  return 2 * (u.miners ?? 0) * Math.pow(1.6, u.drill ?? 0) * Math.pow(2, u.turbo ?? 0)
}
export function valueMult(u: Record<string, number>): number {
  return 1 + 0.25 * (u.cart ?? 0)
}
export function gemChance(u: Record<string, number>): number {
  return Math.min(0.25, 0.02 + 0.03 * (u.detector ?? 0))
}
