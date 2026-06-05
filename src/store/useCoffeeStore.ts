import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DRINKS,
  drinkById,
  unlockedDrinks,
  coffeeUpgradeById,
  stationCount,
  seatCount,
  brewMs,
  arrivalMs,
  patienceMs,
  tipMult,
  itemDropChance,
  TIP_FRACTION,
  VIP_CHANCE,
  VIP_BONUS_MULT,
} from '../games/coffee/drinks'
import { rollCoffeeDrop } from '../items/items'
import { globalIncomeMult, globalLuckBonus } from '../meta/progress'
import { useGameStore } from './useGameStore'

export type CustomerStatus = 'waiting' | 'brewing' | 'served' | 'left'

export interface Customer {
  id: number
  drinkId: string
  /** Random avatar emoji. */
  face: string
  vip: boolean
  status: CustomerStatus
  /** Timestamp the customer walks out if their order hasn't started. */
  deadline: number
  /** Snapshot of max patience (ms) for drawing the patience bar. */
  patienceMs: number
  /** While brewing: when the drink is ready / total brew time for progress. */
  brewDoneAt: number
  brewTotalMs: number
  /** Coins (price + tip, incl. VIP bonus) banked when the drink is served. */
  earn: number
  /** Gift item id dropped on serve, if any. */
  giftItem: string | null
  /** Timestamp a served/left customer was resolved (for the exit animation). */
  resolvedAt: number
}

export interface CoffeeData {
  coins: number
  totalEarned: number
  customers: Customer[]
  upgrades: Record<string, number>
  served: number
  missed: number
  nextSpawnAt: number
  seq: number
  lastSeen: number
}

interface CoffeeStore extends CoffeeData {
  init: () => void
  startBrew: (id: number) => boolean
  buyUpgrade: (id: string) => boolean
  tick: (now: number) => void
  reset: () => void
}

const FACES = ['🧑', '👩', '👨', '🧒', '👵', '👴', '🧑‍🦰', '👩‍🦱', '🧔', '👱', '👲', '🧕']
const RESOLVE_MS = 750

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function initialData(): CoffeeData {
  return {
    coins: 0,
    totalEarned: 0,
    customers: [],
    upgrades: {},
    served: 0,
    missed: 0,
    nextSpawnAt: Date.now(),
    seq: 0,
    lastSeen: Date.now(),
  }
}

function pickDrinkId(totalEarned: number): string {
  const pool = unlockedDrinks(totalEarned)
  return pool[Math.floor(Math.random() * pool.length)].id
}

/** 0..1 — for waiting: patience left; for brewing: brew progress. */
export function customerMeter(c: Customer, now: number): number {
  if (c.status === 'waiting') return clamp01((c.deadline - now) / c.patienceMs)
  if (c.status === 'brewing') return clamp01(1 - (c.brewDoneAt - now) / c.brewTotalMs)
  return c.status === 'served' ? 1 : 0
}

function computeEarn(drinkId: string, c: Customer, u: Record<string, number>, now: number): number {
  const drink = drinkById(drinkId)
  if (!drink) return 0
  const remaining = clamp01((c.deadline - now) / c.patienceMs)
  const tip = drink.price * TIP_FRACTION * remaining * tipMult(u)
  let earn = drink.price + tip
  if (c.vip) earn *= VIP_BONUS_MULT
  earn *= globalIncomeMult(useGameStore.getState().meta.boosts)
  return Math.round(earn)
}

export const useCoffeeStore = create<CoffeeStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      init: () => {
        // Restart the spawn clock so the café doesn't dump a full queue at once
        // after the screen was closed for a while.
        set({ nextSpawnAt: Date.now() })
      },

      startBrew: (id) => {
        const s = get()
        const c = s.customers.find((x) => x.id === id)
        if (!c || c.status !== 'waiting') return false
        const busy = s.customers.filter((x) => x.status === 'brewing').length
        if (busy >= stationCount(s.upgrades)) return false
        const drink = drinkById(c.drinkId)
        if (!drink) return false
        const now = Date.now()
        const total = brewMs(drink, s.upgrades)
        const earn = computeEarn(c.drinkId, c, s.upgrades, now)
        set({
          customers: s.customers.map((x) =>
            x.id === id
              ? { ...x, status: 'brewing', brewDoneAt: now + total, brewTotalMs: total, earn }
              : x,
          ),
        })
        return true
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = coffeeUpgradeById(id)
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
        let missed = s.missed
        let changed = false

        const customers = s.customers.map((c) => ({ ...c }))
        const dropChance = itemDropChance(s.upgrades) + globalLuckBonus(gs.meta.boosts)
        let earnedThisTick = 0
        let servedThisTick = 0
        let vipThisTick = 0
        let giftsThisTick = 0

        // Resolve brews and expirations.
        for (const c of customers) {
          if (c.status === 'brewing' && now >= c.brewDoneAt) {
            coins += c.earn
            totalEarned += c.earn
            served++
            earnedThisTick += c.earn
            servedThisTick++
            if (c.vip) vipThisTick++
            const gift = c.vip ? rollCoffeeDrop(1) : rollCoffeeDrop(dropChance)
            if (gift) {
              gs.addItem(gift, 1)
              giftsThisTick++
            }
            c.status = 'served'
            c.giftItem = gift
            c.resolvedAt = now
            changed = true
          } else if (c.status === 'waiting' && now >= c.deadline) {
            c.status = 'left'
            c.resolvedAt = now
            missed++
            changed = true
          }
        }

        // Auto-barista starts waiting orders while stations are free.
        if ((s.upgrades.auto ?? 0) > 0) {
          let busy = customers.filter((c) => c.status === 'brewing').length
          const cap = stationCount(s.upgrades)
          for (const c of customers) {
            if (busy >= cap) break
            if (c.status === 'waiting') {
              const drink = drinkById(c.drinkId)
              if (!drink) continue
              const total = brewMs(drink, s.upgrades)
              c.earn = computeEarn(c.drinkId, c, s.upgrades, now)
              c.status = 'brewing'
              c.brewDoneAt = now + total
              c.brewTotalMs = total
              busy++
              changed = true
            }
          }
        }

        // Drop fully-resolved customers after the exit animation window.
        let next = customers.filter(
          (c) => !((c.status === 'served' || c.status === 'left') && now - c.resolvedAt > RESOLVE_MS),
        )
        if (next.length !== customers.length) changed = true

        // Spawn new customers up to the seat limit.
        let nextSpawnAt = s.nextSpawnAt
        let seq = s.seq
        const seats = seatCount(s.upgrades)
        const active = () => next.filter((c) => c.status === 'waiting' || c.status === 'brewing').length
        let guard = 0
        while (active() < seats && now >= nextSpawnAt && guard < seats + 2) {
          const pat = patienceMs(s.upgrades)
          next = [
            ...next,
            {
              id: seq++,
              drinkId: pickDrinkId(totalEarned),
              face: FACES[Math.floor(Math.random() * FACES.length)],
              vip: Math.random() < VIP_CHANCE,
              status: 'waiting',
              deadline: now + pat,
              patienceMs: pat,
              brewDoneAt: 0,
              brewTotalMs: 0,
              earn: 0,
              giftItem: null,
              resolvedAt: 0,
            },
          ]
          nextSpawnAt = now + arrivalMs(s.upgrades)
          changed = true
          guard++
        }
        // Keep the spawn clock from lagging far behind after idle time.
        if (now >= nextSpawnAt && active() >= seats) nextSpawnAt = now + arrivalMs(s.upgrades)

        if (changed) set({ customers: next, coins, totalEarned, served, missed, nextSpawnAt, seq })

        // Feed the cross-game meta counters.
        if (servedThisTick) gs.bumpStat('served', servedThisTick)
        if (vipThisTick) gs.bumpStat('vipServed', vipThisTick)
        if (giftsThisTick) gs.bumpStat('giftsReceived', giftsThisTick)
        if (earnedThisTick) gs.bumpStat('coinsEarned', earnedThisTick)
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'tycoon-coffee-v1',
      version: 1,
      // Don't persist live customers/spawn clock — start the shift fresh.
      partialize: (s) => ({
        coins: s.coins,
        totalEarned: s.totalEarned,
        upgrades: s.upgrades,
        served: s.served,
        missed: s.missed,
      }),
    },
  ),
)

export { DRINKS }

if (import.meta.env.DEV) {
  ;(window as unknown as { __coffee?: typeof useCoffeeStore }).__coffee = useCoffeeStore
}
