import type { GameConfig } from '../types'

// Economy calibrated via scripts/sim.mjs: an engaged player reaches the goal in
// ~8 min (casual ~10), journeying plot -> carrot -> greenhouse -> cows. Tractor
// and agro are "keep playing" content past the finish line.
export const farmConfig: GameConfig = {
  id: 'farm',
  kind: 'farm',
  title: 'Ферма',
  emoji: '🌱',
  tagline: 'Сажай, поливай, собирай, продавай',
  cardGradient: ['#4ade80', '#15803d'],
  theme: {
    gradFrom: '#4ade80',
    gradTo: '#16a34a',
    accent: '#22c55e',
    accentSoft: '#bbf7d0',
    surface: '#14301f',
    bg0: '#0f2417',
    bg1: '#1a3a26',
    bg2: '#3f6212',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '🌾', label: 'Собрать урожай', baseTapValue: 1 },
  buildings: [
    { id: 'plot', name: 'Грядка', emoji: '🌱', baseCost: 10, costGrowth: 1.13, baseRate: 0.5 },
    { id: 'carrot', name: 'Морковное поле', emoji: '🥕', baseCost: 75, costGrowth: 1.14, baseRate: 3 },
    { id: 'greenhouse', name: 'Теплица', emoji: '🍅', baseCost: 450, costGrowth: 1.15, baseRate: 16 },
    { id: 'cows', name: 'Коровник', emoji: '🐄', baseCost: 2500, costGrowth: 1.15, baseRate: 80 },
    { id: 'tractor', name: 'Трактор', emoji: '🚜', baseCost: 11000, costGrowth: 1.16, baseRate: 350 },
    { id: 'agro', name: 'Агрокомплекс', emoji: '🏭', baseCost: 50000, costGrowth: 1.17, baseRate: 1500 },
  ],
  upgrades: [
    { id: 'gloves', name: 'Перчатки', emoji: '🧤', cost: 120, effect: { type: 'tapAdd', value: 3 }, desc: '+3 к сбору за тап' },
    { id: 'wateringcan', name: 'Лейка', emoji: '💧', cost: 800, effect: { type: 'tapMult', value: 2 }, desc: 'Сбор за тап ×2' },
    { id: 'fertilizer', name: 'Удобрение', emoji: '🧪', cost: 3500, effect: { type: 'rateMult', value: 2 }, desc: 'Весь доход ×2' },
    { id: 'drone', name: 'Агродрон', emoji: '🛸', cost: 18000, effect: { type: 'rateMult', value: 2 }, desc: 'Весь доход ×2' },
    { id: 'goldseeds', name: 'Золотые семена', emoji: '✨', cost: 70000, effect: { type: 'rateMult', value: 3 }, desc: 'Весь доход ×3' },
  ],
  goal: { type: 'totalEarned', amount: 80000, label: 'Построй Золотую ферму' },
  win: {
    title: 'Золотая ферма! 🏆',
    text: 'Ты превратил пустырь в процветающую ферму. Амбары ломятся от урожая, а соседи завидуют!',
  },
  starReward: 3,
  implemented: true,
}
