import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  oreAtDepth,
  mineUpgradeById,
  tapDamage,
  autoDps,
  valueMult,
  gemChance,
  OFFLINE_CAP_MS,
} from '../games/mine/ores'
import { rollMineGem } from '../items/items'
import { globalIncomeMult, globalLuckBonus } from '../meta/progress'
import { useGameStore } from './useGameStore'

export interface MineData {
  coins: number
  totalEarned: number
  /** Veins broken so far — also the current depth. */
  depth: number
  /** Remaining HP of the current vein. */
  veinHp: number
  upgrades: Record<string, number>
  lastSeen: number
}

export interface MineHit {
  broke: number
  coins: number
  gems: string[]
}

export interface OfflineReport {
  coins: number
  seconds: number
}

interface MineStore extends MineData {
  collectOffline: () => OfflineReport | null
  markSeen: () => void
  mineTap: () => MineHit
  buyUpgrade: (id: string) => boolean
  tick: (dtMs: number) => void
  reset: () => void
}

function initialData(): MineData {
  return {
    coins: 0,
    totalEarned: 0,
    depth: 0,
    veinHp: oreAtDepth(0).veinHp,
    upgrades: {},
    lastSeen: Date.now(),
  }
}

interface DamageResult {
  depth: number
  veinHp: number
  coins: number
  broke: number
  gems: string[]
}

/** Applies `dmg` to the current vein, breaking veins (and descending) as needed. */
function applyDamage(state: MineData, dmg: number, boosts: Record<string, number>): DamageResult {
  let depth = state.depth
  let veinHp = state.veinHp
  let ore = oreAtDepth(depth)
  const vMult = valueMult(state.upgrades) * globalIncomeMult(boosts)
  const chance = gemChance(state.upgrades) + globalLuckBonus(boosts)
  let coins = 0
  let broke = 0
  const gems: string[] = []
  let remaining = dmg
  let guard = 0
  while (remaining >= veinHp && guard < 3000) {
    remaining -= veinHp
    coins += Math.round(ore.value * vMult)
    broke++
    const gem = rollMineGem(chance)
    if (gem) gems.push(gem)
    depth++
    ore = oreAtDepth(depth)
    veinHp = ore.veinHp
    guard++
  }
  veinHp -= remaining
  return { depth, veinHp, coins, broke, gems }
}

export const useMineStore = create<MineStore>()(
  persist(
    (set, get) => ({
      ...initialData(),

      // One-time catch-up for what the auto-miners dug while away. Approximated
      // at the current layer (no descent) and capped, so it stays bounded.
      collectOffline: () => {
        const s = get()
        const now = Date.now()
        const elapsed = Math.min(OFFLINE_CAP_MS, now - s.lastSeen)
        set({ lastSeen: now })
        const dps = autoDps(s.upgrades)
        if (dps <= 0 || elapsed < 8000) return null
        const ore = oreAtDepth(s.depth)
        const gs = useGameStore.getState()
        const coins = Math.floor(
          dps * (elapsed / 1000) * (ore.value / ore.veinHp) * valueMult(s.upgrades) * globalIncomeMult(gs.meta.boosts),
        )
        if (coins <= 0) return null
        set((cur) => ({ coins: cur.coins + coins, totalEarned: cur.totalEarned + coins }))
        gs.bumpStat('coinsEarned', coins)
        return { coins, seconds: Math.floor(elapsed / 1000) }
      },

      markSeen: () => set({ lastSeen: Date.now() }),

      mineTap: () => {
        const s = get()
        const gs = useGameStore.getState()
        const r = applyDamage(s, tapDamage(s.upgrades), gs.meta.boosts)
        set({ depth: r.depth, veinHp: r.veinHp, coins: s.coins + r.coins, totalEarned: s.totalEarned + r.coins })
        for (const g of r.gems) gs.addItem(g, 1)
        if (r.broke) {
          gs.bumpStat('oresMined', r.broke)
          gs.bumpStat('coinsEarned', r.coins)
        }
        if (r.gems.length) gs.bumpStat('treasuresFound', r.gems.length)
        return { broke: r.broke, coins: r.coins, gems: r.gems }
      },

      buyUpgrade: (id) => {
        const s = get()
        const def = mineUpgradeById(id)
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

      tick: (dtMs) => {
        const s = get()
        const dps = autoDps(s.upgrades)
        if (dps <= 0) return
        const gs = useGameStore.getState()
        const r = applyDamage(s, dps * (dtMs / 1000), gs.meta.boosts)
        if (r.coins <= 0 && r.broke === 0 && r.veinHp === s.veinHp) return
        set({ depth: r.depth, veinHp: r.veinHp, coins: s.coins + r.coins, totalEarned: s.totalEarned + r.coins })
        for (const g of r.gems) gs.addItem(g, 1)
        if (r.broke) {
          gs.bumpStat('oresMined', r.broke)
          gs.bumpStat('coinsEarned', r.coins)
        }
        if (r.gems.length) gs.bumpStat('treasuresFound', r.gems.length)
      },

      reset: () => set(initialData()),
    }),
    {
      name: 'tycoon-mine-v1',
      version: 1,
      partialize: (s) => ({
        coins: s.coins,
        totalEarned: s.totalEarned,
        depth: s.depth,
        veinHp: s.veinHp,
        upgrades: s.upgrades,
        lastSeen: s.lastSeen,
      }),
    },
  ),
)

if (import.meta.env.DEV) {
  ;(window as unknown as { __mine?: typeof useMineStore }).__mine = useMineStore
}
