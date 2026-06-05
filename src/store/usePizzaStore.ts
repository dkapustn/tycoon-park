import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  PIZZAS,
  pizzaById,
  unlockedPizzas,
  pizzaUpgradeById,
  ovenCount,
  seatCount,
  bakeMs,
  arrivalMs,
  patienceMs,
  brandTipMult,
  itemDropChance,
  bakeQuality,
  comboMult,
  PERFECT_TIP,
  BURNT_AT,
  AUTO_PULL_AT,
  VIP_CHANCE,
  VIP_BONUS_MULT,
} from '../games/pizza/pizzas'
import type { BakeQuality } from '../games/pizza/pizzas'
import { rollPizzaDrop } from '../items/items'
import { globalIncomeMult, globalLuckBonus } from '../meta/progress'
import { useGameStore } from './useGameStore'

export type OrderStatus = 'waiting' | 'baking' | 'served' | 'left'

export interface Order {
  id: number
  pizzaId: string
  face: string
  vip: boolean
  status: OrderStatus
  deadline: number
  patienceMs: number
  bakeStartAt: number
  bakeTotalMs: number
  earn: number
  /** Outcome shown on the resolved card. */
  quality: BakeQuality | 'burnt' | null
  giftItem: string | null
  resolvedAt: number
}

export interface PullResult {
  quality: BakeQuality
  earn: number
  combo: number
  giftItem: string | null
}

export interface PizzaData {
  coins: number
  totalEarned: number
  orders: Order[]
  upgrades: Record<string, number>
  served: number
  ruined: number
  perfects: number
  combo: number
  bestCombo: number
  nextSpawnAt: number
  seq: number
  lastSeen: number
}

interface PizzaStore extends PizzaData {
  init: () => void
  startBake: (id: number) => boolean
  pull: (id: number) => PullResult | null
  buyUpgrade: (id: string) => boolean
  tick: (now: number) => void
  reset: () => void
}

const FACES = ['🧑', '👩', '👨', '🧒', '👵', '👴', '🧑‍🦰', '👩‍🦱', '🧔', '👱', '👲', '🧕']
const RESOLVE_MS = 800

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function initialData(): PizzaData {
  return {
    coins: 0,
    totalEarned: 0,
    orders: [],
    upgrades: {},
    served: 0,
    ruined: 0,
    perfects: 0,
    combo: 0,
    bestCombo: 0,
    nextSpawnAt: Date.now(),
    seq: 0,
    lastSeen: Date.now(),
  }
}

function pickPizzaId(totalEarned: number): string {
  const pool = unlockedPizzas(totalEarned)
  return pool[Math.floor(Math.random() * pool.length)].id
}

/** 0..1 for waiting (patience) or 0..BURNT_AT for baking (oven progress). */
export function bakeProgress(o: Order, now: number): number {
  if (o.status !== 'baking') return 0
  return (now - o.bakeStartAt) / o.bakeTotalMs
}
export function patienceMeter(o: Order, now: number): number {
  return clamp01((o.deadline - now) / o.patienceMs)
}

function settleEarn(o: Order, progress: number, u: Record<string, number>): { quality: BakeQuality; earn: number } {
  const pizza = pizzaById(o.pizzaId)
  if (!pizza) return { quality: 'under', earn: 0 }
  const { quality, factor } = bakeQuality(progress, u)
  return { quality, earn: pizza.price * factor }
}

export const usePizzaStore = create<PizzaStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      init: () => set({ nextSpawnAt: Date.now() }),

      startBake: (id) => {
        const s = get()
        const o = s.orders.find((x) => x.id === id)
        if (!o || o.status !== 'waiting') return false
        const busy = s.orders.filter((x) => x.status === 'baking').length
        if (busy >= ovenCount(s.upgrades)) return false
        const pizza = pizzaById(o.pizzaId)
        if (!pizza) return false
        const now = Date.now()
        const total = bakeMs(pizza, s.upgrades)
        set({
          orders: s.orders.map((x) =>
            x.id === id ? { ...x, status: 'baking', bakeStartAt: now, bakeTotalMs: total } : x,
          ),
        })
        return true
      },

      pull: (id) => {
        const s = get()
        const o = s.orders.find((x) => x.id === id)
        if (!o || o.status !== 'baking') return null
        const now = Date.now()
        const progress = (now - o.bakeStartAt) / o.bakeTotalMs
        const gs = useGameStore.getState()
        const { quality, earn: base } = settleEarn(o, progress, s.upgrades)

        const combo = quality === 'perfect' ? s.combo + 1 : 0
        let earn = base
        if (quality === 'perfect') {
          const pizza = pizzaById(o.pizzaId)
          earn += (pizza?.price ?? 0) * PERFECT_TIP * brandTipMult(s.upgrades)
          earn *= comboMult(combo)
        }
        if (o.vip) earn *= VIP_BONUS_MULT
        earn = Math.round(earn * globalIncomeMult(gs.meta.boosts))

        const dropChance = o.vip ? 1 : itemDropChance(s.upgrades) + globalLuckBonus(gs.meta.boosts)
        const gift = rollPizzaDrop(dropChance)
        if (gift) gs.addItem(gift, 1)

        set({
          coins: s.coins + earn,
          totalEarned: s.totalEarned + earn,
          served: s.served + 1,
          perfects: s.perfects + (quality === 'perfect' ? 1 : 0),
          combo,
          bestCombo: Math.max(s.bestCombo, combo),
          orders: s.orders.map((x) =>
            x.id === id ? { ...x, status: 'served', earn, quality, giftItem: gift, resolvedAt: now } : x,
          ),
        })

        gs.bumpStat('pizzasBaked', 1)
        if (quality === 'perfect') gs.bumpStat('perfectBakes', 1)
        if (o.vip) gs.bumpStat('vipServed', 1)
        if (gift) gs.bumpStat('giftsReceived', 1)
        gs.bumpStat('coinsEarned', earn)

        return { quality, earn, combo, giftItem: gift }
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = pizzaUpgradeById(id)
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

      tick: (now) => {
        const s = get()
        const gs = useGameStore.getState()
        let coins = s.coins
        let totalEarned = s.totalEarned
        let served = s.served
        let ruined = s.ruined
        let perfects = s.perfects
        let combo = s.combo
        let bestCombo = s.bestCombo
        let changed = false

        const orders = s.orders.map((o) => ({ ...o }))
        const auto = (s.upgrades.autobaker ?? 0) > 0
        const dropChance = itemDropChance(s.upgrades) + globalLuckBonus(gs.meta.boosts)
        let bakedThisTick = 0
        let perfectThisTick = 0
        let vipThisTick = 0
        let giftsThisTick = 0
        let earnedThisTick = 0

        for (const o of orders) {
          if (o.status === 'baking') {
            const progress = (now - o.bakeStartAt) / o.bakeTotalMs
            // Auto-baker pulls right in the perfect window.
            if (auto && progress >= AUTO_PULL_AT && progress <= 1) {
              const pizza = pizzaById(o.pizzaId)
              combo += 1
              let earn = (pizza?.price ?? 0) * (1 + PERFECT_TIP * brandTipMult(s.upgrades))
              earn *= comboMult(combo)
              if (o.vip) earn *= VIP_BONUS_MULT
              earn = Math.round(earn * globalIncomeMult(gs.meta.boosts))
              const gift = o.vip ? rollPizzaDrop(1) : rollPizzaDrop(dropChance)
              if (gift) {
                gs.addItem(gift, 1)
                giftsThisTick++
              }
              coins += earn
              totalEarned += earn
              served++
              perfects++
              perfectThisTick++
              bakedThisTick++
              earnedThisTick += earn
              if (o.vip) vipThisTick++
              bestCombo = Math.max(bestCombo, combo)
              o.status = 'served'
              o.earn = earn
              o.quality = 'perfect'
              o.giftItem = gift
              o.resolvedAt = now
              changed = true
            } else if (progress >= BURNT_AT) {
              o.status = 'left'
              o.quality = 'burnt'
              o.resolvedAt = now
              ruined++
              combo = 0
              changed = true
            }
          } else if (o.status === 'waiting' && now >= o.deadline) {
            o.status = 'left'
            o.quality = null
            o.resolvedAt = now
            ruined++
            changed = true
          }
        }

        let next = orders.filter(
          (o) => !((o.status === 'served' || o.status === 'left') && now - o.resolvedAt > RESOLVE_MS),
        )
        if (next.length !== orders.length) changed = true

        let nextSpawnAt = s.nextSpawnAt
        let seq = s.seq
        const seats = seatCount(s.upgrades)
        const active = () => next.filter((o) => o.status === 'waiting' || o.status === 'baking').length
        let guard = 0
        while (active() < seats && now >= nextSpawnAt && guard < seats + 2) {
          const pat = patienceMs(s.upgrades)
          next = [
            ...next,
            {
              id: seq++,
              pizzaId: pickPizzaId(totalEarned),
              face: FACES[Math.floor(Math.random() * FACES.length)],
              vip: Math.random() < VIP_CHANCE,
              status: 'waiting',
              deadline: now + pat,
              patienceMs: pat,
              bakeStartAt: 0,
              bakeTotalMs: 0,
              earn: 0,
              quality: null,
              giftItem: null,
              resolvedAt: 0,
            },
          ]
          nextSpawnAt = now + arrivalMs(s.upgrades)
          changed = true
          guard++
        }
        if (now >= nextSpawnAt && active() >= seats) nextSpawnAt = now + arrivalMs(s.upgrades)

        if (changed) {
          set({ orders: next, coins, totalEarned, served, ruined, perfects, combo, bestCombo, nextSpawnAt, seq })
        }

        if (bakedThisTick) gs.bumpStat('pizzasBaked', bakedThisTick)
        if (perfectThisTick) gs.bumpStat('perfectBakes', perfectThisTick)
        if (vipThisTick) gs.bumpStat('vipServed', vipThisTick)
        if (giftsThisTick) gs.bumpStat('giftsReceived', giftsThisTick)
        if (earnedThisTick) gs.bumpStat('coinsEarned', earnedThisTick)
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'tycoon-pizza-v1',
      version: 1,
      partialize: (s) => ({
        coins: s.coins,
        totalEarned: s.totalEarned,
        upgrades: s.upgrades,
        served: s.served,
        ruined: s.ruined,
        perfects: s.perfects,
        bestCombo: s.bestCombo,
      }),
    },
  ),
)

export { PIZZAS }

if (import.meta.env.DEV) {
  ;(window as unknown as { __pizza?: typeof usePizzaStore }).__pizza = usePizzaStore
}
