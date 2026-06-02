import type { GameConfig, GameState } from '../types'

/** Cost of the next unit of a building given how many are already owned. */
export function buildingCost(cfg: GameConfig, buildingId: string, owned: number): number {
  const b = cfg.buildings.find((x) => x.id === buildingId)
  if (!b) return Infinity
  return Math.ceil(b.baseCost * Math.pow(b.costGrowth, owned))
}

/** Coins gained per manual tap, after upgrades. */
export function tapValue(cfg: GameConfig, state: GameState): number {
  let add = 0
  let mult = 1
  for (const id of state.upgrades) {
    const u = cfg.upgrades.find((x) => x.id === id)
    if (!u) continue
    if (u.effect.type === 'tapAdd') add += u.effect.value
    if (u.effect.type === 'tapMult') mult *= u.effect.value
  }
  return Math.max(1, Math.round((cfg.tapTarget.baseTapValue + add) * mult))
}

/** Passive coins per second from all buildings, after rate upgrades. */
export function totalRate(cfg: GameConfig, state: GameState): number {
  let rate = 0
  for (const b of cfg.buildings) {
    rate += (state.buildings[b.id] ?? 0) * b.baseRate
  }
  let mult = 1
  for (const id of state.upgrades) {
    const u = cfg.upgrades.find((x) => x.id === id)
    if (u && u.effect.type === 'rateMult') mult *= u.effect.value
  }
  return rate * mult
}

function goalCurrent(cfg: GameConfig, state: GameState): number {
  return cfg.goal.type === 'totalEarned' ? state.totalEarned : state.coins
}

/** 0..1 progress toward the game's completion goal. */
export function goalProgress(cfg: GameConfig, state: GameState): number {
  return Math.min(1, goalCurrent(cfg, state) / cfg.goal.amount)
}

export function isGoalMet(cfg: GameConfig, state: GameState): boolean {
  return goalCurrent(cfg, state) >= cfg.goal.amount
}
