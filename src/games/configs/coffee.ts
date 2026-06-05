import type { GameConfig } from '../types'

// Same calibrated curve as the farm, slightly higher goal (it's game two) ->
// engaged player ~8-9 min.
export const coffeeConfig: GameConfig = {
  id: 'coffee',
  kind: 'coffee',
  title: 'Кофейня',
  emoji: '☕',
  tagline: 'Вари, подавай, не дай очереди уйти',
  cardGradient: ['#e3b98f', '#7c4a26'],
  theme: {
    gradFrom: '#e3b98f',
    gradTo: '#8a5a2b',
    accent: '#c8863f',
    accentSoft: '#f0cfa6',
    surface: '#2a1c10',
    bg0: '#241812',
    bg1: '#3a2417',
    bg2: '#5b3a1e',
  },
  currency: { name: 'выручка', emoji: '💰' },
  tapTarget: { emoji: '☕', label: 'Сварить кофе', baseTapValue: 1 },
  buildings: [
    { id: 'machine', name: 'Кофемашина', emoji: '☕', baseCost: 10, costGrowth: 1.13, baseRate: 0.5 },
    { id: 'barista', name: 'Бариста', emoji: '🧑‍🍳', baseCost: 75, costGrowth: 1.14, baseRate: 3 },
    { id: 'cafe', name: 'Кофейня', emoji: '🏪', baseCost: 450, costGrowth: 1.15, baseRate: 16 },
    { id: 'roaster', name: 'Обжарочный цех', emoji: '🔥', baseCost: 2500, costGrowth: 1.15, baseRate: 80 },
    { id: 'truck', name: 'Кофемобиль', emoji: '🚚', baseCost: 11000, costGrowth: 1.16, baseRate: 350 },
    { id: 'franchise', name: 'Франшиза', emoji: '🌐', baseCost: 50000, costGrowth: 1.17, baseRate: 1500 },
  ],
  upgrades: [
    { id: 'beans', name: 'Отборные зёрна', emoji: '🫘', cost: 120, effect: { type: 'tapAdd', value: 3 }, desc: '+3 за тап' },
    { id: 'grinder', name: 'Жернова', emoji: '⚙️', cost: 800, effect: { type: 'tapMult', value: 2 }, desc: 'Тап ×2' },
    { id: 'loyalty', name: 'Карта лояльности', emoji: '🎟️', cost: 3500, effect: { type: 'rateMult', value: 2 }, desc: 'Весь доход ×2' },
    { id: 'wifi', name: 'Wi-Fi и розетки', emoji: '📶', cost: 18000, effect: { type: 'rateMult', value: 2 }, desc: 'Весь доход ×2' },
    { id: 'brand', name: 'Известный бренд', emoji: '⭐', cost: 70000, effect: { type: 'rateMult', value: 3 }, desc: 'Весь доход ×3' },
  ],
  goal: { type: 'totalEarned', amount: 65000, label: 'Стань кофейной империей' },
  win: {
    title: 'Кофейная империя! ☕👑',
    text: 'Очередь с самого утра, бариста не успевают, а твои франшизы открываются по всему городу!',
  },
  starReward: 4,
  diamondReward: 20,
  implemented: true,
}
