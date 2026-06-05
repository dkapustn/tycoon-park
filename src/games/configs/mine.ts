import type { GameConfig } from '../types'

// Шахта — the fourth real mini-game (kind:'mine'). Mechanic: break ore veins by
// tapping, descend into richer layers, hire miners for passive (and OFFLINE)
// income. The park's first idle engine. Goal ~80k (~10-12 min active).
export const mineConfig: GameConfig = {
  id: 'mine',
  kind: 'mine',
  title: 'Шахта',
  emoji: '⛏️',
  tagline: 'Копай глубже за самоцветами',
  cardGradient: ['#38bdf8', '#1e3a8a'],
  theme: {
    gradFrom: '#38bdf8',
    gradTo: '#2563eb',
    accent: '#3b82f6',
    accentSoft: '#bae6fd',
    surface: '#0f1d33',
    bg0: '#0c1626',
    bg1: '#11233f',
    bg2: '#1e3a8a',
  },
  currency: { name: 'монеты', emoji: '🪙' },
  tapTarget: { emoji: '⛏️', label: 'Копать', baseTapValue: 1 },
  buildings: [],
  upgrades: [],
  goal: { type: 'totalEarned', amount: 90000, label: 'Докопай до алмазной жилы' },
  win: {
    title: 'Алмазная жила! ⛏️💎',
    text: 'Ты добрался до самых глубин и нашёл алмазы! Шахта гудит, вагонетки полны, богатство течёт рекой.',
  },
  starReward: 6,
  diamondReward: 30,
  implemented: true,
}
