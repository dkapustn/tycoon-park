import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  PASTRIES,
  pastryById,
  unlockedPastries,
  bakeryUpgradeById,
  ovenCount,
  shelfCap,
  seatCount,
  bakeMs,
  batchOf,
  arrivalMs,
  tipMult,
  itemDropChance,
  ORDER_BONUS,
  TIP_FRACTION,
  BASE_PATIENCE_MS,
  VIP_CHANCE,
  VIP_BONUS_MULT,
} from '../games/bakery/pastries'
import { rollBakeryDrop } from '../items/items'
import { globalIncomeMult, globalLuckBonus } from '../meta/progress'
import { useGameStore } from './useGameStore'

export type CustomerStatus = 'waiting' | 'served' | 'left'

export interface BakeJob {
  id: number
  pastryId: string
  doneAt: number
  totalMs: number
}

export interface Customer {
  id: number
  /** pastryId -> quantity required. */
  order: Record<string, number>
  face: string
  vip: boolean
  status: CustomerStatus
  deadline: number
  patienceMs: number
  earn: number
  giftItem: string | null
  resolvedAt: number
}

export interface FulfillResult {
  earn: number
  giftItem: string | null
}

export interface BakeryData {
  coins: number
  totalEarned: number
  shelf: Record<string, number>
  baking: BakeJob[]
  customers: Customer[]
  upgrades: Record<string, number>
  served: number
  missed: number
  nextSpawnAt: number
  seq: number
  lastSeen: number
}

interface BakeryStore extends BakeryData {
  init: () => void
  bake: (pastryId: string) => boolean
  fulfill: (id: number) => FulfillResult | null
  buyUpgrade: (id: string) => boolean
  tick: (now: number) => void
  reset: () => void
}

const FACES = ['🧑', '👩', '👨', '🧒', '👵', '👴', '🧑‍🦰', '👩‍🦱', '🧔', '👱', '👲', '🧕']
const RESOLVE_MS = 750

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function shelfTotal(shelf: Record<string, number>): number {
  let n = 0
  for (const v of Object.values(shelf)) n += v
  return n
}

export function canFulfill(shelf: Record<string, number>, order: Record<string, number>): boolean {
  for (const [id, qty] of Object.entries(order)) {
    if ((shelf[id] ?? 0) < qty) return false
  }
  return true
}

export function orderSize(order: Record<string, number>): number {
  let n = 0
  for (const v of Object.values(order)) n += v
  return n
}

function initialData(): BakeryData {
  return {
    coins: 0,
    totalEarned: 0,
    shelf: {},
    baking: [],
    customers: [],
    upgrades: {},
    served: 0,
    missed: 0,
    nextSpawnAt: Date.now(),
    seq: 0,
    lastSeen: Date.now(),
  }
}

function makeOrder(totalEarned: number): Record<string, number> {
  const pool = unlockedPastries(totalEarned)
  const kinds = pool.length >= 2 && Math.random() < 0.55 ? 2 : 1
  const order: Record<string, number> = {}
  for (let i = 0; i < kinds; i++) {
    const p = pool[Math.floor(Math.random() * pool.length)]
    order[p.id] = (order[p.id] ?? 0) + (1 + Math.floor(Math.random() * 3))
  }
  return order
}

function orderEarn(order: Record<string, number>, c: Customer, u: Record<string, number>, now: number): number {
  let base = 0
  for (const [id, qty] of Object.entries(order)) {
    const p = pastryById(id)
    if (p) base += p.price * qty
  }
  base *= ORDER_BONUS
  const remaining = clamp01((c.deadline - now) / c.patienceMs)
  let earn = base + base * TIP_FRACTION * remaining * tipMult(u)
  if (c.vip) earn *= VIP_BONUS_MULT
  earn *= globalIncomeMult(useGameStore.getState().meta.boosts)
  return Math.round(earn)
}

export const useBakeryStore = create<BakeryStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      init: () => set({ nextSpawnAt: Date.now(), baking: [], customers: [] }),

      bake: (pastryId) => {
        const s = get()
        if (s.baking.length >= ovenCount(s.upgrades)) return false
        const p = pastryById(pastryId)
        if (!p) return false
        if (shelfTotal(s.shelf) >= shelfCap(s.upgrades)) return false
        const now = Date.now()
        const total = bakeMs(p, s.upgrades)
        set({ baking: [...s.baking, { id: s.seq, pastryId, doneAt: now + total, totalMs: total }], seq: s.seq + 1 })
        return true
      },

      fulfill: (id) => {
        const s = get()
        const c = s.customers.find((x) => x.id === id)
        if (!c || c.status !== 'waiting') return null
        if (!canFulfill(s.shelf, c.order)) return null
        const now = Date.now()
        const gs = useGameStore.getState()
        const earn = orderEarn(c.order, c, s.upgrades, now)
        const shelf = { ...s.shelf }
        let sold = 0
        for (const [pid, qty] of Object.entries(c.order)) {
          shelf[pid] = (shelf[pid] ?? 0) - qty
          if (shelf[pid] <= 0) delete shelf[pid]
          sold += qty
        }
        const gift = c.vip ? rollBakeryDrop(1) : rollBakeryDrop(itemDropChance(s.upgrades) + globalLuckBonus(gs.meta.boosts))
        if (gift) gs.addItem(gift, 1)
        set({
          shelf,
          coins: s.coins + earn,
          totalEarned: s.totalEarned + earn,
          served: s.served + 1,
          customers: s.customers.map((x) =>
            x.id === id ? { ...x, status: 'served', earn, giftItem: gift, resolvedAt: now } : x,
          ),
        })
        gs.bumpStat('pastriesSold', sold)
        gs.bumpStat('coinsEarned', earn)
        if (c.vip) gs.bumpStat('vipServed', 1)
        if (gift) gs.bumpStat('giftsReceived', 1)
        return { earn, giftItem: gift }
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = bakeryUpgradeById(id)
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
        let changed = false
        const cap = shelfCap(s.upgrades)

        // Finish baking trays -> shelf (respecting capacity).
        const shelf = { ...s.shelf }
        const baking = s.baking.filter((j) => {
          if (now < j.doneAt) return true
          const p = pastryById(j.pastryId)
          if (p) {
            const space = cap - shelfTotal(shelf)
            const add = Math.max(0, Math.min(batchOf(p, s.upgrades), space))
            if (add > 0) shelf[j.pastryId] = (shelf[j.pastryId] ?? 0) + add
          }
          changed = true
          return false
        })

        let coins = s.coins
        let totalEarned = s.totalEarned
        let served = s.served
        let missed = s.missed
        let soldThisTick = 0
        let vipThisTick = 0
        let giftsThisTick = 0
        let earnedThisTick = 0

        const customers = s.customers.map((c) => ({ ...c }))

        // Expire waiting customers.
        for (const c of customers) {
          if (c.status === 'waiting' && now >= c.deadline) {
            c.status = 'left'
            c.resolvedAt = now
            missed++
            changed = true
          }
        }

        // Auto-seller: fulfill any satisfiable waiting customer.
        if ((s.upgrades.autoseller ?? 0) > 0) {
          for (const c of customers) {
            if (c.status !== 'waiting' || !canFulfill(shelf, c.order)) continue
            const earn = orderEarn(c.order, c, s.upgrades, now)
            for (const [pid, qty] of Object.entries(c.order)) {
              shelf[pid] = (shelf[pid] ?? 0) - qty
              if (shelf[pid] <= 0) delete shelf[pid]
              soldThisTick += qty
            }
            const gift = c.vip
              ? rollBakeryDrop(1)
              : rollBakeryDrop(itemDropChance(s.upgrades) + globalLuckBonus(gs.meta.boosts))
            if (gift) {
              gs.addItem(gift, 1)
              giftsThisTick++
            }
            coins += earn
            totalEarned += earn
            served++
            earnedThisTick += earn
            if (c.vip) vipThisTick++
            c.status = 'served'
            c.earn = earn
            c.giftItem = gift
            c.resolvedAt = now
            changed = true
          }
        }

        // Auto-baker: keep the shelf stocked while ovens are free.
        let bakeList = baking
        if ((s.upgrades.autobaker ?? 0) > 0) {
          const ovens = ovenCount(s.upgrades)
          const pool = unlockedPastries(totalEarned)
          while (bakeList.length < ovens && shelfTotal(shelf) + bakeList.length * 2 < cap) {
            // Bake whatever is lowest in stock to keep variety available.
            let target = pool[0]
            let lowest = Infinity
            for (const p of pool) {
              const stock = shelf[p.id] ?? 0
              if (stock < lowest) {
                lowest = stock
                target = p
              }
            }
            const total = bakeMs(target, s.upgrades)
            bakeList = [...bakeList, { id: s.seq + (bakeList.length - baking.length), pastryId: target.id, doneAt: now + total, totalMs: total }]
            changed = true
          }
        }
        const seqAfterAuto = s.seq + (bakeList.length - baking.length)

        // Remove resolved customers after the exit animation.
        let next = customers.filter(
          (c) => !((c.status === 'served' || c.status === 'left') && now - c.resolvedAt > RESOLVE_MS),
        )
        if (next.length !== customers.length) changed = true

        // Spawn new customers.
        let nextSpawnAt = s.nextSpawnAt
        let seq = seqAfterAuto
        const seats = seatCount(s.upgrades)
        const active = () => next.filter((c) => c.status === 'waiting').length
        let guard = 0
        while (active() < seats && now >= nextSpawnAt && guard < seats + 2) {
          const pat = BASE_PATIENCE_MS
          next = [
            ...next,
            {
              id: seq++,
              order: makeOrder(totalEarned),
              face: FACES[Math.floor(Math.random() * FACES.length)],
              vip: Math.random() < VIP_CHANCE,
              status: 'waiting',
              deadline: now + pat,
              patienceMs: pat,
              earn: 0,
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
          set({ shelf, baking: bakeList, customers: next, coins, totalEarned, served, missed, nextSpawnAt, seq })
        }

        if (soldThisTick) gs.bumpStat('pastriesSold', soldThisTick)
        if (vipThisTick) gs.bumpStat('vipServed', vipThisTick)
        if (giftsThisTick) gs.bumpStat('giftsReceived', giftsThisTick)
        if (earnedThisTick) gs.bumpStat('coinsEarned', earnedThisTick)
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'tycoon-bakery-v1',
      version: 1,
      partialize: (s) => ({
        coins: s.coins,
        totalEarned: s.totalEarned,
        shelf: s.shelf,
        upgrades: s.upgrades,
        served: s.served,
        missed: s.missed,
      }),
    },
  ),
)

export { PASTRIES }

if (import.meta.env.DEV) {
  ;(window as unknown as { __bakery?: typeof useBakeryStore }).__bakery = useBakeryStore
}
