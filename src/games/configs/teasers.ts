import type { GameConfig, GameTheme } from '../types'

// Locked "coming soon" games. They populate the hub and demonstrate the unlock
// chain; turning one into a real game later = fill buildings/upgrades/goal and
// flip `implemented` to true.
type TeaserInput = {
  id: string
  title: string
  emoji: string
  tagline: string
  cardGradient: [string, string]
  theme: GameTheme
  currency: { name: string; emoji: string }
  tapTarget: { emoji: string; label: string; baseTapValue: number }
  starReward: number
}

function teaser(t: TeaserInput): GameConfig {
  return {
    ...t,
    buildings: [],
    upgrades: [],
    goal: { type: 'totalEarned', amount: 1, label: 'Скоро' },
    win: { title: 'Скоро', text: 'Эта игра ещё в разработке.' },
    implemented: false,
  }
}

export const pizzaConfig = teaser({
  id: 'pizza',
  title: 'Пиццерия',
  emoji: '🍕',
  tagline: 'Горячая, с пылу с жару',
  cardGradient: ['#fb7185', '#b91c1c'],
  theme: {
    gradFrom: '#fb7185', gradTo: '#dc2626', accent: '#ef4444', accentSoft: '#fecaca',
    surface: '#2b1414', bg0: '#241011', bg1: '#3a1518', bg2: '#7f1d1d',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '🍕', label: 'Испечь пиццу', baseTapValue: 1 },
  starReward: 5,
})

export const mineConfig = teaser({
  id: 'mine',
  title: 'Шахта',
  emoji: '⛏️',
  tagline: 'Копай глубже за самоцветами',
  cardGradient: ['#38bdf8', '#1e3a8a'],
  theme: {
    gradFrom: '#38bdf8', gradTo: '#2563eb', accent: '#3b82f6', accentSoft: '#bae6fd',
    surface: '#0f1d33', bg0: '#0c1626', bg1: '#11233f', bg2: '#1e3a8a',
  },
  currency: { name: 'самоцветы', emoji: '💎' },
  tapTarget: { emoji: '⛏️', label: 'Копать', baseTapValue: 1 },
  starReward: 5,
})

export const bakeryConfig = teaser({
  id: 'bakery',
  title: 'Пекарня',
  emoji: '🍞',
  tagline: 'Свежий хлеб каждое утро',
  cardGradient: ['#fbbf24', '#b45309'],
  theme: {
    gradFrom: '#fbbf24', gradTo: '#d97706', accent: '#f59e0b', accentSoft: '#fde68a',
    surface: '#2a1d0d', bg0: '#241a0e', bg1: '#3a2812', bg2: '#92400e',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '🥐', label: 'Испечь', baseTapValue: 1 },
  starReward: 6,
})
