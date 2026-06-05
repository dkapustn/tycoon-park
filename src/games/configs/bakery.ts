import type { GameConfig } from '../types'

// Пекарня — the fifth (final) real mini-game (kind:'bakery'). Mechanic: supply &
// demand — bake trays to stock the shelf, fulfill customers' combo orders from
// that stock. Completes the unlock chain. Goal ~95k (~11-13 min active).
export const bakeryConfig: GameConfig = {
  id: 'bakery',
  kind: 'bakery',
  title: 'Пекарня',
  emoji: '🍞',
  tagline: 'Пеки про запас, собирай заказы',
  cardGradient: ['#fbbf24', '#b45309'],
  theme: {
    gradFrom: '#fbbf24',
    gradTo: '#d97706',
    accent: '#f59e0b',
    accentSoft: '#fde68a',
    surface: '#2a1d0d',
    bg0: '#241a0e',
    bg1: '#3a2812',
    bg2: '#92400e',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '🥐', label: 'Испечь', baseTapValue: 1 },
  buildings: [],
  upgrades: [],
  goal: { type: 'totalEarned', amount: 95000, label: 'Открой пекарню-легенду' },
  win: {
    title: 'Пекарня-легенда! 🍞🏆',
    text: 'Витрина ломится от свежей выпечки, очередь довольных гостей, аромат на весь квартал. Ты прошёл весь Тайкун-Парк!',
  },
  starReward: 7,
  diamondReward: 35,
  implemented: true,
}
