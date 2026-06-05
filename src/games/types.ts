export type EffectType = 'tapAdd' | 'tapMult' | 'rateMult'

export interface BuildingDef {
  id: string
  name: string
  emoji: string
  baseCost: number
  /** Multiplicative cost growth per owned unit, e.g. 1.15. */
  costGrowth: number
  /** Coins per second per owned unit. */
  baseRate: number
}

export interface UpgradeDef {
  id: string
  name: string
  emoji: string
  cost: number
  effect: { type: EffectType; value: number }
  desc: string
}

export interface GoalDef {
  type: 'totalEarned' | 'balance'
  amount: number
  label: string
}

/** CSS-variable palette applied per game screen. */
export interface GameTheme {
  gradFrom: string
  gradTo: string
  accent: string
  accentSoft: string
  surface: string
  bg0: string
  bg1: string
  bg2: string
}

/** Which engine renders the game. `idle` = generic clicker; `farm` = the
 *  plant/grow/harvest/sell mini-game. Defaults to `idle` when omitted. */
export type GameKind = 'idle' | 'farm'

export interface GameConfig {
  id: string
  kind?: GameKind
  title: string
  emoji: string
  tagline: string
  cardGradient: [string, string]
  theme: GameTheme
  currency: { name: string; emoji: string }
  tapTarget: { emoji: string; label: string; baseTapValue: number }
  buildings: BuildingDef[]
  upgrades: UpgradeDef[]
  goal: GoalDef
  win: { title: string; text: string }
  starReward: number
  implemented: boolean
}

export interface GameState {
  coins: number
  totalEarned: number
  buildings: Record<string, number>
  upgrades: string[]
  lastSeen: number
}
