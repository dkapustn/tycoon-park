import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CROPS,
  cropById,
  plotPrice,
  growthMult,
  sellMult,
  treasureChance,
  upgradeById,
  START_PLOTS,
  MAX_PLOTS,
  WATER_CAP,
  WATER_STEP,
} from '../games/farm/crops'
import { rollTreasure } from '../items/items'
import { useGameStore } from './useGameStore'

export interface Plot {
  /** Planted crop id, or null when the plot is bare soil. */
  crop: string | null
  /** Timestamp (ms) the seed went in. */
  plantedAt: number
  /** Accumulated watering boost in ms (shaves growth time). */
  boostMs: number
}

export interface FarmOrder {
  id: number
  cropId: string
  qty: number
  coins: number
  diamonds: number
}

export interface HarvestResult {
  cropId: string | null
  amount: number
  /** Item id of a treasure dug up, if any. */
  treasure: string | null
}

export interface FarmData {
  coins: number
  totalEarned: number
  plots: Plot[]
  /** upgradeId -> level. */
  upgrades: Record<string, number>
  selectedSeed: string
  orders: FarmOrder[]
  orderSeq: number
  lastSeen: number
}

interface FarmStore extends FarmData {
  init: () => void
  selectSeed: (id: string) => void
  plant: (index: number) => boolean
  water: (index: number) => boolean
  harvest: (index: number) => HarvestResult
  sellAll: () => number
  buyPlot: () => boolean
  buyUpgrade: (id: string) => boolean
  fulfillOrder: (id: number) => boolean
  rerollOrder: (id: number) => void
  runAuto: () => void
  reset: () => void
}

const ORDER_SLOTS = 3

function emptyPlot(): Plot {
  return { crop: null, plantedAt: 0, boostMs: 0 }
}

/** Builds one contract from the crops unlocked at the given lifetime earnings. */
function makeOrder(totalEarned: number, seq: number): FarmOrder {
  const pool = CROPS.filter((c) => totalEarned >= c.unlockAt)
  const list = pool.length > 0 ? pool : [CROPS[0]]
  const crop = list[Math.floor(Math.random() * list.length)]
  const tier = CROPS.indexOf(crop)
  const qty = 3 + Math.floor(Math.random() * 6) // 3..8
  const coins = Math.round(crop.sellValue * qty * 1.7)
  const diamonds = 1 + Math.floor(tier / 2)
  return { id: seq, cropId: crop.id, qty, coins, diamonds }
}

function initialData(): FarmData {
  return {
    // A little seed money so the very first crops can go in the ground.
    coins: 60,
    totalEarned: 0,
    plots: Array.from({ length: START_PLOTS }, emptyPlot),
    upgrades: {},
    selectedSeed: 'carrot',
    orders: [],
    orderSeq: 0,
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

export const useFarmStore = create<FarmStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      init: () => {
        const s = get()
        const patch: Partial<FarmData> = {}
        if (s.plots.length === 0) patch.plots = Array.from({ length: START_PLOTS }, emptyPlot)
        if (s.orders.length < ORDER_SLOTS) {
          const orders = s.orders.slice()
          let seq = s.orderSeq
          while (orders.length < ORDER_SLOTS) orders.push(makeOrder(s.totalEarned, seq++))
          patch.orders = orders
          patch.orderSeq = seq
        }
        if (Object.keys(patch).length) set(patch)
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
        if (!plot || !plot.crop) return { cropId: null, amount: 0, treasure: null }
        if (!isRipe(plot, s.upgrades, Date.now())) return { cropId: null, amount: 0, treasure: null }
        const cropId = plot.crop
        const golden = (s.upgrades.golden ?? 0) > 0 && Math.random() < 0.25
        const amount = golden ? 2 : 1
        const plots = s.plots.slice()
        plots[index] = emptyPlot()
        set({ plots })
        const gs = useGameStore.getState()
        gs.addItem(cropId, amount)
        const treasure = rollTreasure(treasureChance(s.upgrades))
        if (treasure) gs.addItem(treasure, 1)
        return { cropId, amount, treasure }
      },

      // Sells every farm crop currently in the shared inventory for coins.
      sellAll: () => {
        const s = get()
        const inv = useGameStore.getState().inventory
        const mult = sellMult(s.upgrades)
        let earned = 0
        const taken: [string, number][] = []
        for (const c of CROPS) {
          const n = inv[c.id] ?? 0
          if (n > 0) {
            earned += c.sellValue * n * mult
            taken.push([c.id, n])
          }
        }
        earned = Math.round(earned)
        if (earned <= 0) return 0
        const gs = useGameStore.getState()
        for (const [id, n] of taken) gs.takeItem(id, n)
        set({ coins: s.coins + earned, totalEarned: s.totalEarned + earned })
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
        if (def.currency === 'diamonds') {
          if (!useGameStore.getState().spendDiamonds(cost)) return false
        } else {
          if (s.coins < cost) return false
          set({ coins: s.coins - cost })
        }
        set((cur) => ({ upgrades: { ...cur.upgrades, [id]: (cur.upgrades[id] ?? 0) + 1 } }))
        return true
      },

      fulfillOrder: (id) => {
        const s = get()
        const order = s.orders.find((o) => o.id === id)
        if (!order) return false
        const gs = useGameStore.getState()
        if ((gs.inventory[order.cropId] ?? 0) < order.qty) return false
        gs.takeItem(order.cropId, order.qty)
        gs.addDiamonds(order.diamonds)
        const seq = s.orderSeq
        set({
          coins: s.coins + order.coins,
          totalEarned: s.totalEarned + order.coins,
          orders: s.orders.map((o) => (o.id === id ? makeOrder(s.totalEarned + order.coins, seq) : o)),
          orderSeq: seq + 1,
        })
        return true
      },

      rerollOrder: (id) => {
        const s = get()
        const seq = s.orderSeq
        set({
          orders: s.orders.map((o) => (o.id === id ? makeOrder(s.totalEarned, seq) : o)),
          orderSeq: seq + 1,
        })
      },

      // Auto-harvest (Комбайн) + auto-sell (Грузовик). Only writes on change.
      runAuto: () => {
        const s = get()
        const gs = useGameStore.getState()

        if ((s.upgrades.harvester ?? 0) > 0) {
          const now = Date.now()
          const goldenOwned = (s.upgrades.golden ?? 0) > 0
          const chance = treasureChance(s.upgrades)
          let nextPlots: Plot[] | null = null
          for (let i = 0; i < s.plots.length; i++) {
            const p = s.plots[i]
            if (p.crop && isRipe(p, s.upgrades, now)) {
              const amount = goldenOwned && Math.random() < 0.25 ? 2 : 1
              gs.addItem(p.crop, amount)
              const t = rollTreasure(chance)
              if (t) gs.addItem(t, 1)
              if (!nextPlots) nextPlots = s.plots.slice()
              nextPlots[i] = emptyPlot()
            }
          }
          if (nextPlots) set({ plots: nextPlots })
        }

        if ((s.upgrades.delivery ?? 0) > 0) {
          get().sellAll()
        }
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'tycoon-farm-v1',
      version: 2,
      // v1 stored a local `barn`; harvested crops now live in the shared
      // inventory, so drop it and let init() seed the new order board.
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<FarmData> & { barn?: unknown }
        delete s.barn
        if (!Array.isArray(s.orders)) s.orders = []
        if (typeof s.orderSeq !== 'number') s.orderSeq = 0
        return s as FarmData
      },
    },
  ),
)

// Dev handle, mirroring the main store's pattern.
if (import.meta.env.DEV) {
  ;(window as unknown as { __farm?: typeof useFarmStore }).__farm = useFarmStore
}
