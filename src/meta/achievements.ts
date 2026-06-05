import type { Stats } from './progress'

// Cross-game achievements. Each tracks one metric and pays diamonds when its
// goal is reached and the player claims it. Metrics come from the shared
// `Stats` plus a couple of derived values (level, games completed).

export type Metric = keyof Stats | 'level' | 'gamesCompleted'

export interface AchievementDef {
  id: string
  name: string
  emoji: string
  metric: Metric
  goal: number
  reward: number
}

export interface AchievementContext extends Stats {
  level: number
  gamesCompleted: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Farm
  { id: 'harvest_1', name: 'Зелёный новичок', emoji: '🌱', metric: 'harvested', goal: 50, reward: 3 },
  { id: 'harvest_2', name: 'Фермер', emoji: '🥕', metric: 'harvested', goal: 500, reward: 8 },
  { id: 'harvest_3', name: 'Агромагнат', emoji: '🚜', metric: 'harvested', goal: 5000, reward: 25 },
  { id: 'orders_1', name: 'Поставщик', emoji: '📋', metric: 'ordersFilled', goal: 10, reward: 5 },
  { id: 'orders_2', name: 'Надёжный партнёр', emoji: '🤝', metric: 'ordersFilled', goal: 50, reward: 18 },
  { id: 'treasure_1', name: 'Кладоискатель', emoji: '🍀', metric: 'treasuresFound', goal: 5, reward: 6 },
  { id: 'treasure_2', name: 'Археолог', emoji: '🏺', metric: 'treasuresFound', goal: 30, reward: 20 },

  // Coffee
  { id: 'serve_1', name: 'Бариста-стажёр', emoji: '☕', metric: 'served', goal: 50, reward: 3 },
  { id: 'serve_2', name: 'Мастер-бариста', emoji: '🥛', metric: 'served', goal: 500, reward: 8 },
  { id: 'serve_3', name: 'Кофейный король', emoji: '👑', metric: 'served', goal: 5000, reward: 25 },
  { id: 'vip_1', name: 'Любимец VIP', emoji: '🌟', metric: 'vipServed', goal: 10, reward: 10 },
  { id: 'vip_2', name: 'Знаменитость', emoji: '💼', metric: 'vipServed', goal: 50, reward: 28 },
  { id: 'gift_1', name: 'Щедрые гости', emoji: '🎁', metric: 'giftsReceived', goal: 20, reward: 6 },

  // Wealth & meta
  { id: 'coins_1', name: 'Первая десятка', emoji: '🪙', metric: 'coinsEarned', goal: 10000, reward: 5 },
  { id: 'coins_2', name: 'Шестизначный', emoji: '💰', metric: 'coinsEarned', goal: 100000, reward: 15 },
  { id: 'coins_3', name: 'Миллионер', emoji: '🤑', metric: 'coinsEarned', goal: 1000000, reward: 50 },
  { id: 'level_1', name: 'Восходящая звезда', emoji: '📈', metric: 'level', goal: 5, reward: 5 },
  { id: 'level_2', name: 'Воротила', emoji: '🏙️', metric: 'level', goal: 15, reward: 18 },
  { id: 'level_3', name: 'Легенда бизнеса', emoji: '🌆', metric: 'level', goal: 30, reward: 60 },
  { id: 'games_1', name: 'Первая победа', emoji: '🎮', metric: 'gamesCompleted', goal: 1, reward: 5 },
  { id: 'games_2', name: 'Дуплет', emoji: '🏆', metric: 'gamesCompleted', goal: 2, reward: 15 },
  { id: 'diamonds_1', name: 'Сверкающий старт', emoji: '💎', metric: 'diamondsEarned', goal: 100, reward: 5 },
  { id: 'diamonds_2', name: 'Алмазный фонд', emoji: '💠', metric: 'diamondsEarned', goal: 500, reward: 20 },
]

export function metricValue(metric: Metric, ctx: AchievementContext): number {
  return ctx[metric] ?? 0
}
