import type { GameConfig } from '../types'

// Pizzeria — the third real mini-game (kind:'pizza'). Mechanic: oven timing.
// Tap an order to bake, tap again in the perfect window; perfect bakes build a
// combo. Calibrated to ~10-12 min of active play (goal ~70k).
export const pizzaConfig: GameConfig = {
  id: 'pizza',
  kind: 'pizza',
  title: 'Пиццерия',
  emoji: '🍕',
  tagline: 'Поймай идеальную прожарку',
  cardGradient: ['#fb7185', '#b91c1c'],
  theme: {
    gradFrom: '#fb7185',
    gradTo: '#dc2626',
    accent: '#ef4444',
    accentSoft: '#fecaca',
    surface: '#2b1414',
    bg0: '#241011',
    bg1: '#3a1518',
    bg2: '#7f1d1d',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '🍕', label: 'Испечь пиццу', baseTapValue: 1 },
  buildings: [],
  upgrades: [],
  goal: { type: 'totalEarned', amount: 70000, label: 'Построй пиццерию мечты' },
  win: {
    title: 'Лучшая пиццерия! 🍕🏆',
    text: 'Очередь за дверь, печи раскалены, а твоя пицца — идеальной прожарки. Город в восторге!',
  },
  starReward: 5,
  diamondReward: 25,
  implemented: true,
}
