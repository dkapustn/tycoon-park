import type { GameConfig } from './types'
import { farmConfig } from './configs/farm'
import { coffeeConfig } from './configs/coffee'
import { pizzaConfig, mineConfig, bakeryConfig } from './configs/teasers'

/** Ordered list — index defines the unlock chain. */
export const GAMES: GameConfig[] = [
  farmConfig,
  coffeeConfig,
  pizzaConfig,
  mineConfig,
  bakeryConfig,
]

export const GAME_ORDER: string[] = GAMES.map((g) => g.id)
export const FIRST_GAME_ID: string = GAMES[0].id

const byId = new Map(GAMES.map((g) => [g.id, g]))

export function getConfig(id: string): GameConfig {
  const cfg = byId.get(id)
  if (!cfg) throw new Error(`Unknown game id: ${id}`)
  return cfg
}

/** The game that unlocks after `id` is completed, or null if it's the last. */
export function getNextGameId(id: string): string | null {
  const i = GAME_ORDER.indexOf(id)
  return i >= 0 && i < GAME_ORDER.length - 1 ? GAME_ORDER[i + 1] : null
}
