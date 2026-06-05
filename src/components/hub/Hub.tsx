import { useState } from 'react'
import { motion } from 'framer-motion'
import { GAMES, GAME_ORDER } from '../../games/registry'
import { useGameStore } from '../../store/useGameStore'
import { useNav } from '../../store/useNav'
import { levelFromXp } from '../../meta/progress'
import { ACHIEVEMENTS, metricValue } from '../../meta/achievements'
import type { AchievementContext } from '../../meta/achievements'
import { formatNumber } from '../../lib/format'
import { Header } from './Header'
import { GameCard } from './GameCard'
import type { CardStatus } from './GameCard'
import { ProgressBar } from '../ui/ProgressBar'
import { SettingsSheet } from '../settings/SettingsSheet'
import { DailyModal } from '../meta/DailyModal'
import { cn } from '../../lib/cn'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Hub() {
  const unlocked = useGameStore((s) => s.meta.unlocked)
  const completed = useGameStore((s) => s.meta.completed)
  const meta = useGameStore((s) => s.meta)
  const openGame = useNav((s) => s.openGame)
  const openSoon = useNav((s) => s.openSoon)
  const openInventory = useNav((s) => s.openInventory)
  const openAchievements = useNav((s) => s.openAchievements)
  const openShop = useNav((s) => s.openShop)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dailyOpen, setDailyOpen] = useState(false)

  const lvl = levelFromXp(meta.stats.coinsEarned)
  const dailyAvailable = meta.daily.lastClaim !== todayStr()

  const ctx: AchievementContext = {
    ...meta.stats,
    level: lvl.level,
    gamesCompleted: completed.length,
  }
  const claimable = ACHIEVEMENTS.filter(
    (a) => !meta.claimed.includes(a.id) && metricValue(a.metric, ctx) >= a.goal,
  ).length

  const actions = [
    { key: 'daily', emoji: '🎁', label: 'Награда', onClick: () => setDailyOpen(true), badge: dailyAvailable ? '!' : '' },
    { key: 'ach', emoji: '🏆', label: 'Награды', onClick: openAchievements, badge: claimable > 0 ? String(claimable) : '' },
    { key: 'shop', emoji: '💠', label: 'Лавка', onClick: openShop, badge: '' },
    { key: 'inv', emoji: '🎒', label: 'Инвентарь', onClick: openInventory, badge: '' },
  ]

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <Header onSettings={() => setSettingsOpen(true)} />
      <div className="scroll-y flex-1 pl-safe pr-safe">
        <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-5">
          {/* Tycoon level hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="mb-3 overflow-hidden rounded-4xl bg-gradient-to-br from-white/15 to-white/5 p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl grad-accent text-2xl font-extrabold shadow-pop">
                {lvl.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold leading-tight">🏙️ Тайкун-магнат</div>
                <div className="text-xs text-white/60">
                  Уровень {lvl.level} · до след. {formatNumber(Math.ceil(lvl.span - lvl.into))} 🪙
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={lvl.progress} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Meta actions */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={a.onClick}
                className="relative flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3 tap-none transition-all active:scale-95 hover:bg-white/15"
              >
                {a.badge && (
                  <span
                    className={cn(
                      'absolute right-2 top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold leading-none',
                      a.badge === '!' ? 'animate-pulseGlow bg-rose-500' : 'bg-rose-500',
                    )}
                  >
                    {a.badge}
                  </span>
                )}
                <span className="text-2xl leading-none">{a.emoji}</span>
                <span className="text-[11px] font-semibold text-white/80">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="mb-2 px-1 font-display text-sm font-semibold uppercase tracking-wide text-white/55">
            🎮 Игры
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {GAMES.map((cfg, i) => {
              const status: CardStatus = completed.includes(cfg.id)
                ? 'completed'
                : unlocked.includes(cfg.id)
                  ? 'unlocked'
                  : 'locked'
              const prevIndex = GAME_ORDER.indexOf(cfg.id) - 1
              const prevTitle = prevIndex >= 0 ? GAMES[prevIndex].title : ''
              return (
                <GameCard
                  key={cfg.id}
                  cfg={cfg}
                  index={i}
                  status={status}
                  prevTitle={prevTitle}
                  onOpen={() => (cfg.implemented ? openGame(cfg.id) : openSoon(cfg.id))}
                />
              )
            })}
          </div>
        </div>
      </div>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DailyModal open={dailyOpen} onClose={() => setDailyOpen(false)} />
    </div>
  )
}
