import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState } from '../games/types'
import { getConfig, getNextGameId, FIRST_GAME_ID } from '../games/registry'
import { buildingCost, tapValue, totalRate } from '../games/engine/selectors'
import { itemById, rollTreasure } from '../items/items'
import type { Stats } from '../meta/progress'
import {
  emptyStats,
  levelFromXp,
  levelReward,
  globalGemMult,
  MAGNATE_BOOSTS,
  boostCost,
} from '../meta/progress'
import { ACHIEVEMENTS, metricValue } from '../meta/achievements'
import type { AchievementContext } from '../meta/achievements'
import { useToast } from './useToast'

export interface Settings {
  sound: boolean
  reducedMotion: boolean
}

export interface DailyState {
  /** ISO date (YYYY-MM-DD) the chest was last claimed. */
  lastClaim: string
  streak: number
}

export interface Meta {
  unlocked: string[]
  completed: string[]
  stars: number
  /** Shared premium currency, earned across all games. */
  diamonds: number
  /** Lifetime cross-game counters that drive level & achievements. */
  stats: Stats
  /** Permanent global boosts bought in the Magnate shop. */
  boosts: Record<string, number>
  /** Claimed achievement ids. */
  claimed: string[]
  daily: DailyState
  /** Highest level we've already paid the level-up bonus for. */
  rewardedLevel: number
  settings: Settings
}

export interface DailyReward {
  diamonds: number
  itemId: string | null
  streak: number
}

/** Local YYYY-MM-DD, offset by `days`. */
function dayStr(days = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface CompleteResult {
  newlyCompleted: boolean
  unlockedId: string | null
}

interface StoreState {
  meta: Meta
  games: Record<string, GameState>
  /** Shared inventory across all games: itemId -> quantity. */
  inventory: Record<string, number>
  ensureGame: (id: string) => void
  tap: (id: string) => number
  buyBuilding: (id: string, buildingId: string) => boolean
  buyUpgrade: (id: string, upgradeId: string) => boolean
  tick: (id: string, dt: number) => void
  markSeen: (id: string) => void
  completeGame: (id: string) => CompleteResult
  resetGame: (id: string) => void
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  // --- Shared economy ---
  addDiamonds: (n: number) => void
  spendDiamonds: (n: number) => boolean
  addItem: (itemId: string, qty: number) => void
  takeItem: (itemId: string, qty: number) => boolean
  /** Sells treasures for diamonds. qty omitted = sell all of that item. */
  sellItemForDiamonds: (itemId: string, qty?: number) => number
  // --- Meta progression ---
  bumpStat: (key: keyof Stats, n?: number) => void
  buyBoost: (id: string) => boolean
  claimAchievement: (id: string) => boolean
  claimDaily: () => DailyReward | null
}

function defaultMeta(): Meta {
  return {
    unlocked: [FIRST_GAME_ID],
    completed: [],
    stars: 0,
    diamonds: 0,
    stats: emptyStats(),
    boosts: {},
    claimed: [],
    daily: { lastClaim: '', streak: 0 },
    rewardedLevel: 0,
    settings: { sound: true, reducedMotion: false },
  }
}

function defaultGameState(): GameState {
  return { coins: 0, totalEarned: 0, buildings: {}, upgrades: [], lastSeen: Date.now() }
}

export const useGameStore = create<StoreState>()(
  persist(
    (set, get) => ({
      meta: defaultMeta(),
      games: {},
      inventory: {},

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
        const reward = cfg.diamondReward ?? 0
        set((s) => ({
          meta: {
            ...s.meta,
            completed: [...s.meta.completed, id],
            stars: s.meta.stars + cfg.starReward,
            diamonds: s.meta.diamonds + reward,
            stats: { ...s.meta.stats, diamondsEarned: s.meta.stats.diamondsEarned + reward },
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

      addDiamonds: (n) => {
        if (n <= 0) return
        set((s) => ({
          meta: {
            ...s.meta,
            diamonds: s.meta.diamonds + n,
            stats: { ...s.meta.stats, diamondsEarned: s.meta.stats.diamondsEarned + n },
          },
        }))
      },

      spendDiamonds: (n) => {
        if (get().meta.diamonds < n) return false
        set((s) => ({ meta: { ...s.meta, diamonds: s.meta.diamonds - n } }))
        return true
      },

      addItem: (itemId, qty) => {
        if (qty <= 0) return
        set((s) => ({ inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] ?? 0) + qty } }))
      },

      takeItem: (itemId, qty) => {
        const have = get().inventory[itemId] ?? 0
        if (have < qty) return false
        set((s) => {
          const next = { ...s.inventory }
          const left = (next[itemId] ?? 0) - qty
          if (left > 0) next[itemId] = left
          else delete next[itemId]
          return { inventory: next }
        })
        return true
      },

      sellItemForDiamonds: (itemId, qty) => {
        const def = itemById(itemId)
        if (!def || !def.diamondValue) return 0
        const have = get().inventory[itemId] ?? 0
        const n = qty == null ? have : Math.min(qty, have)
        if (n <= 0) return 0
        const earned = Math.round(n * def.diamondValue * globalGemMult(get().meta.boosts))
        set((s) => {
          const next = { ...s.inventory }
          const left = (next[itemId] ?? 0) - n
          if (left > 0) next[itemId] = left
          else delete next[itemId]
          return {
            inventory: next,
            meta: {
              ...s.meta,
              diamonds: s.meta.diamonds + earned,
              stats: { ...s.meta.stats, diamondsEarned: s.meta.stats.diamondsEarned + earned },
            },
          }
        })
        return earned
      },

      bumpStat: (key, n = 1) => {
        if (n === 0) return
        let toast: { emoji: string; text: string } | null = null
        set((s) => {
          const stats = { ...s.meta.stats, [key]: (s.meta.stats[key] ?? 0) + n }
          let meta: Meta = { ...s.meta, stats }
          if (key === 'coinsEarned') {
            const newLevel = levelFromXp(stats.coinsEarned).level
            if (newLevel > s.meta.rewardedLevel) {
              let reward = 0
              for (let L = s.meta.rewardedLevel + 1; L <= newLevel; L++) reward += levelReward(L)
              meta = {
                ...meta,
                rewardedLevel: newLevel,
                diamonds: s.meta.diamonds + reward,
                stats: { ...stats, diamondsEarned: stats.diamondsEarned + reward },
              }
              toast = { emoji: '🏙️', text: `Уровень ${newLevel}! +${reward}💎` }
            }
          }
          return { meta }
        })
        if (toast) useToast.getState().push(toast)
      },

      buyBoost: (id) => {
        const s = get()
        const def = MAGNATE_BOOSTS.find((b) => b.id === id)
        if (!def) return false
        const lvl = s.meta.boosts[id] ?? 0
        if (lvl >= def.maxLevel) return false
        const cost = boostCost(def, lvl)
        if (s.meta.diamonds < cost) return false
        set((st) => ({
          meta: { ...st.meta, diamonds: st.meta.diamonds - cost, boosts: { ...st.meta.boosts, [id]: lvl + 1 } },
        }))
        return true
      },

      claimAchievement: (id) => {
        const s = get()
        if (s.meta.claimed.includes(id)) return false
        const def = ACHIEVEMENTS.find((a) => a.id === id)
        if (!def) return false
        const ctx: AchievementContext = {
          ...s.meta.stats,
          level: levelFromXp(s.meta.stats.coinsEarned).level,
          gamesCompleted: s.meta.completed.length,
        }
        if (metricValue(def.metric, ctx) < def.goal) return false
        set((st) => ({
          meta: {
            ...st.meta,
            claimed: [...st.meta.claimed, id],
            diamonds: st.meta.diamonds + def.reward,
            stats: { ...st.meta.stats, diamondsEarned: st.meta.stats.diamondsEarned + def.reward },
          },
        }))
        useToast.getState().push({ emoji: def.emoji, text: `${def.name}: +${def.reward}💎` })
        return true
      },

      claimDaily: () => {
        const s = get()
        const today = dayStr()
        if (s.meta.daily.lastClaim === today) return null
        const streak = s.meta.daily.lastClaim === dayStr(-1) ? s.meta.daily.streak + 1 : 1
        const diamonds = 4 + Math.min(streak, 7) * 2
        const itemId = rollTreasure(1)
        set((st) => ({
          meta: {
            ...st.meta,
            daily: { lastClaim: today, streak },
            diamonds: st.meta.diamonds + diamonds,
            stats: { ...st.meta.stats, diamondsEarned: st.meta.stats.diamondsEarned + diamonds },
          },
          inventory: itemId
            ? { ...st.inventory, [itemId]: (st.inventory[itemId] ?? 0) + 1 }
            : st.inventory,
        }))
        return { diamonds, itemId, streak }
      },
    }),
    {
      name: 'tycoon-arcade-v1',
      version: 3,
      partialize: (s) => ({ meta: s.meta, games: s.games, inventory: s.inventory }),
      migrate: (persisted) => {
        const s = (persisted ?? {}) as { meta?: Partial<Meta>; inventory?: Record<string, number> }
        const base = defaultMeta()
        const m = { ...base, ...(s.meta ?? {}) } as Meta
        m.stats = { ...emptyStats(), ...(s.meta?.stats ?? {}) }
        m.boosts = s.meta?.boosts ?? {}
        m.claimed = Array.isArray(s.meta?.claimed) ? s.meta!.claimed! : []
        m.daily = s.meta?.daily ?? { lastClaim: '', streak: 0 }
        m.settings = { ...base.settings, ...(s.meta?.settings ?? {}) }
        // Don't retro-pay level bonuses for untracked past earnings.
        m.rewardedLevel = levelFromXp(m.stats.coinsEarned).level
        return { meta: m, inventory: s.inventory ?? {} } as Partial<StoreState> as StoreState
      },
    },
  ),
)

// Dev-only handle for quick inspection / economy calibration in the preview.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useGameStore }).__store = useGameStore
}
