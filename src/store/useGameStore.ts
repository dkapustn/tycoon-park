import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState } from '../games/types'
import { getConfig, getNextGameId, FIRST_GAME_ID } from '../games/registry'
import { buildingCost, tapValue, totalRate } from '../games/engine/selectors'

export interface Settings {
  sound: boolean
  reducedMotion: boolean
}

export interface Meta {
  unlocked: string[]
  completed: string[]
  stars: number
  settings: Settings
}

export interface CompleteResult {
  newlyCompleted: boolean
  unlockedId: string | null
}

interface StoreState {
  meta: Meta
  games: Record<string, GameState>
  ensureGame: (id: string) => void
  tap: (id: string) => number
  buyBuilding: (id: string, buildingId: string) => boolean
  buyUpgrade: (id: string, upgradeId: string) => boolean
  tick: (id: string, dt: number) => void
  markSeen: (id: string) => void
  completeGame: (id: string) => CompleteResult
  resetGame: (id: string) => void
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

function defaultGameState(): GameState {
  return { coins: 0, totalEarned: 0, buildings: {}, upgrades: [], lastSeen: Date.now() }
}

export const useGameStore = create<StoreState>()(
  persist(
    (set, get) => ({
      meta: {
        unlocked: [FIRST_GAME_ID],
        completed: [],
        stars: 0,
        settings: { sound: true, reducedMotion: false },
      },
      games: {},

      ensureGame: (id) => {
        if (!get().games[id]) {
          set((s) => ({ games: { ...s.games, [id]: defaultGameState() } }))
        }
      },

      tap: (id) => {
        const cfg = getConfig(id)
        const g = get().games[id] ?? defaultGameState()
        const v = tapValue(cfg, g)
        set((s) => {
          const cur = s.games[id] ?? defaultGameState()
          return {
            games: { ...s.games, [id]: { ...cur, coins: cur.coins + v, totalEarned: cur.totalEarned + v } },
          }
        })
        return v
      },

      buyBuilding: (id, buildingId) => {
        const cfg = getConfig(id)
        const g = get().games[id] ?? defaultGameState()
        const owned = g.buildings[buildingId] ?? 0
        const cost = buildingCost(cfg, buildingId, owned)
        if (g.coins < cost) return false
        set((s) => {
          const cur = s.games[id] ?? defaultGameState()
          return {
            games: {
              ...s.games,
              [id]: {
                ...cur,
                coins: cur.coins - cost,
                buildings: { ...cur.buildings, [buildingId]: owned + 1 },
              },
            },
          }
        })
        return true
      },

      buyUpgrade: (id, upgradeId) => {
        const cfg = getConfig(id)
        const g = get().games[id] ?? defaultGameState()
        if (g.upgrades.includes(upgradeId)) return false
        const up = cfg.upgrades.find((u) => u.id === upgradeId)
        if (!up || g.coins < up.cost) return false
        set((s) => {
          const cur = s.games[id] ?? defaultGameState()
          return {
            games: {
              ...s.games,
              [id]: { ...cur, coins: cur.coins - up.cost, upgrades: [...cur.upgrades, upgradeId] },
            },
          }
        })
        return true
      },

      tick: (id, dt) => {
        const cfg = getConfig(id)
        const g = get().games[id]
        if (!g) return
        const gain = totalRate(cfg, g) * dt
        if (gain <= 0) return
        set((s) => {
          const cur = s.games[id]
          if (!cur) return {}
          return {
            games: {
              ...s.games,
              [id]: { ...cur, coins: cur.coins + gain, totalEarned: cur.totalEarned + gain },
            },
          }
        })
      },

      markSeen: (id) => {
        set((s) => {
          const cur = s.games[id]
          if (!cur) return {}
          return { games: { ...s.games, [id]: { ...cur, lastSeen: Date.now() } } }
        })
      },

      completeGame: (id) => {
        const cfg = getConfig(id)
        const meta = get().meta
        if (meta.completed.includes(id)) {
          return { newlyCompleted: false, unlockedId: null }
        }
        const next = getNextGameId(id)
        const willUnlock = next && !meta.unlocked.includes(next) ? next : null
        set((s) => ({
          meta: {
            ...s.meta,
            completed: [...s.meta.completed, id],
            stars: s.meta.stars + cfg.starReward,
            unlocked: willUnlock ? [...s.meta.unlocked, willUnlock] : s.meta.unlocked,
          },
        }))
        return { newlyCompleted: true, unlockedId: willUnlock }
      },

      resetGame: (id) => {
        set((s) => ({ games: { ...s.games, [id]: defaultGameState() } }))
      },

      setSetting: (key, value) => {
        set((s) => ({ meta: { ...s.meta, settings: { ...s.meta.settings, [key]: value } } }))
      },
    }),
    {
      name: 'tycoon-arcade-v1',
      version: 1,
      partialize: (s) => ({ meta: s.meta, games: s.games }),
    },
  ),
)

// Dev-only handle for quick inspection / economy calibration in the preview.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useGameStore }).__store = useGameStore
}
