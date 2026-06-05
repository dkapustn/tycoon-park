import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  cropById,
  plotPrice,
  growthMult,
  sellMult,
  upgradeById,
  START_PLOTS,
  MAX_PLOTS,
  WATER_CAP,
  WATER_STEP,
} from '../games/farm/crops'

export interface Plot {
  /** Planted crop id, or null when the plot is bare soil. */
  crop: string | null
  /** Timestamp (ms) the seed went in. */
  plantedAt: number
  /** Accumulated watering boost in ms (shaves growth time). */
  boostMs: number
}

export interface FarmData {
  coins: number
  totalEarned: number
  /** Harvested crops waiting to be sold: cropId -> count. */
  barn: Record<string, number>
  plots: Plot[]
  /** upgradeId -> level. */
  upgrades: Record<string, number>
  selectedSeed: string
  lastSeen: number
}

interface FarmStore extends FarmData {
  init: () => void
  selectSeed: (id: string) => void
  plant: (index: number) => boolean
  water: (index: number) => boolean
  harvest: (index: number) => number
  sellAll: () => number
  buyPlot: () => boolean
  buyUpgrade: (id: string) => boolean
  runAuto: () => void
  reset: () => void
}

function emptyPlot(): Plot {
  return { crop: null, plantedAt: 0, boostMs: 0 }
}

function initialData(): FarmData {
  return {
    // A little seed money so the very first crops can go in the ground.
    coins: 60,
    totalEarned: 0,
    barn: {},
    plots: Array.from({ length: START_PLOTS }, emptyPlot),
    upgrades: {},
    selectedSeed: 'carrot',
    lastSeen: Date.now(),
  }
}

/** Effective grow time in ms after sprinkler upgrades. */
function effectiveGrowMs(cropId: string, upgrades: Record<string, number>): number {
  const c = cropById(cropId)
  if (!c) return Infinity
  return (c.growSeconds * 1000) / growthMult(upgrades)
}

/** 0..1 growth progress for a plot (0 if empty). */
export function plotProgress(plot: Plot, upgrades: Record<string, number>, now: number): number {
  if (!plot.crop) return 0
  const grow = effectiveGrowMs(plot.crop, upgrades)
  const elapsed = now - plot.plantedAt + plot.boostMs
  return Math.max(0, Math.min(1, elapsed / grow))
}

export function isRipe(plot: Plot, upgrades: Record<string, number>, now: number): boolean {
  return plot.crop != null && plotProgress(plot, upgrades, now) >= 1
}

/** Total market value of everything currently sitting in the barn. */
export function barnValue(barn: Record<string, number>, upgrades: Record<string, number>): number {
  const mult = sellMult(upgrades)
  let sum = 0
  for (const [id, n] of Object.entries(barn)) {
    const c = cropById(id)
    if (c) sum += c.sellValue * n * mult
  }
  return Math.round(sum)
}

export function barnCount(barn: Record<string, number>): number {
  let n = 0
  for (const v of Object.values(barn)) n += v
  return n
}

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      init: () => {
        // Self-heal: ensure at least the starter plots exist (e.g. fresh save).
        if (get().plots.length === 0) {
          set({ plots: Array.from({ length: START_PLOTS }, emptyPlot) })
        }
      },

      selectSeed: (id) => set({ selectedSeed: id }),

      plant: (index) => {
        const s = get()
        const plot = s.plots[index]
        if (!plot || plot.crop) return false
        const crop = cropById(s.selectedSeed)
        if (!crop) return false
        if (s.totalEarned < crop.unlockAt || s.coins < crop.seedCost) return false
        const plots = s.plots.slice()
        plots[index] = { crop: crop.id, plantedAt: Date.now(), boostMs: 0 }
        set({ plots, coins: s.coins - crop.seedCost })
        return true
      },

      water: (index) => {
        const s = get()
        const plot = s.plots[index]
        if (!plot || !plot.crop) return false
        const now = Date.now()
        if (isRipe(plot, s.upgrades, now)) return false
        const crop = cropById(plot.crop)
        if (!crop) return false
        const growMs = crop.growSeconds * 1000
        const cap = growMs * WATER_CAP
        const next = Math.min(cap, plot.boostMs + growMs * WATER_STEP)
        if (next <= plot.boostMs) return false // already fully watered
        const plots = s.plots.slice()
        plots[index] = { ...plot, boostMs: next }
        set({ plots })
        return true
      },

      harvest: (index) => {
        const s = get()
        const plot = s.plots[index]
        if (!plot || !plot.crop) return 0
        if (!isRipe(plot, s.upgrades, Date.now())) return 0
        const cropId = plot.crop
        const golden = (s.upgrades.golden ?? 0) > 0 && Math.random() < 0.25
        const amount = golden ? 2 : 1
        const plots = s.plots.slice()
        plots[index] = emptyPlot()
        set({
          plots,
          barn: { ...s.barn, [cropId]: (s.barn[cropId] ?? 0) + amount },
        })
        return amount
      },

      sellAll: () => {
        const s = get()
        const earned = barnValue(s.barn, s.upgrades)
        if (earned <= 0) return 0
        set({
          barn: {},
          coins: s.coins + earned,
          totalEarned: s.totalEarned + earned,
        })
        return earned
      },

      buyPlot: () => {
        const s = get()
        if (s.plots.length >= MAX_PLOTS) return false
        const cost = plotPrice(s.plots.length)
        if (s.coins < cost) return false
        set({ coins: s.coins - cost, plots: [...s.plots, emptyPlot()] })
        return true
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = upgradeById(id)
        if (!def) return false
        const level = s.upgrades[id] ?? 0
        if (level >= def.maxLevel) return false
        const cost = Math.ceil(def.baseCost * Math.pow(def.costGrowth, level))
        if (s.coins < cost) return false
        set({ coins: s.coins - cost, upgrades: { ...s.upgrades, [id]: level + 1 } })
        return true
      },

      // Auto-harvest (Комбайн) + auto-sell (Грузовик). Only writes on change.
      runAuto: () => {
        const s = get()
        let plots = s.plots
        let barn = s.barn
        let changed = false

        if ((s.upgrades.harvester ?? 0) > 0) {
          const now = Date.now()
          const golden = (s.upgrades.golden ?? 0) > 0
          let nextPlots: Plot[] | null = null
          const nextBarn: Record<string, number> = { ...barn }
          for (let i = 0; i < plots.length; i++) {
            const p = plots[i]
            if (p.crop && isRipe(p, s.upgrades, now)) {
              const amount = golden && Math.random() < 0.25 ? 2 : 1
              nextBarn[p.crop] = (nextBarn[p.crop] ?? 0) + amount
              if (!nextPlots) nextPlots = plots.slice()
              nextPlots[i] = emptyPlot()
            }
          }
          if (nextPlots) {
            plots = nextPlots
            barn = nextBarn
            changed = true
          }
        }

        let coins = s.coins
        let totalEarned = s.totalEarned
        if ((s.upgrades.delivery ?? 0) > 0 && barnCount(barn) > 0) {
          const earned = barnValue(barn, s.upgrades)
          if (earned > 0) {
            coins += earned
            totalEarned += earned
            barn = {}
            changed = true
          }
        }

        if (changed) set({ plots, barn, coins, totalEarned })
      },

      reset: () => set(initialData()),
    }),
    { name: 'tycoon-farm-v1', version: 1 },
  ),
)

// Dev handle, mirroring the main store's pattern.
if (import.meta.env.DEV) {
  ;(window as unknown as { __farm?: typeof useFarmStore }).__farm = useFarmStore
}
