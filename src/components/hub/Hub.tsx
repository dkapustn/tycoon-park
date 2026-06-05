import { useState } from 'react'
import { motion } from 'framer-motion'
import { GAMES, GAME_ORDER } from '../../games/registry'
import { useGameStore } from '../../store/useGameStore'
import { useNav } from '../../store/useNav'
import { itemById } from '../../items/items'
import { formatNumber } from '../../lib/format'
import { Header } from './Header'
import { GameCard } from './GameCard'
import type { CardStatus } from './GameCard'
import { ProgressBar } from '../ui/ProgressBar'
import { SettingsSheet } from '../settings/SettingsSheet'

export function Hub() {
  const unlocked = useGameStore((s) => s.meta.unlocked)
  const completed = useGameStore((s) => s.meta.completed)
  const diamonds = useGameStore((s) => s.meta.diamonds)
  const stars = useGameStore((s) => s.meta.stars)
  const inventory = useGameStore((s) => s.inventory)
  const openGame = useNav((s) => s.openGame)
  const openSoon = useNav((s) => s.openSoon)
  const openInventory = useNav((s) => s.openInventory)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const total = GAMES.length
  const done = completed.length
  const itemCount = Object.entries(inventory).reduce((a, [id, n]) => a + (itemById(id) ? n : 0), 0)

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <Header onSettings={() => setSettingsOpen(true)} />
      <div className="scroll-y flex-1 pl-safe pr-safe">
        <div className="mx-auto w-full max-w-3xl px-4 pb-10 sm:px-5">
          {/* Progress hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="mb-4 overflow-hidden rounded-4xl bg-gradient-to-br from-white/15 to-white/5 p-4 shadow-card"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg font-bold">🏆 Твой парк</div>
                <div className="text-sm text-white/65">
                  Пройдено {done} из {total} тайкунов
                </div>
              </div>
              <button
                onClick={openInventory}
                className="shrink-0 rounded-2xl bg-white/15 px-4 py-2.5 font-display text-sm font-semibold tap-none active:scale-95"
              >
                🎒 Инвентарь
              </button>
            </div>
            <div className="mt-3">
              <ProgressBar value={total ? done / total : 0} />
            </div>
            <div className="mt-3 flex gap-2">
              {[
                { emoji: '💎', label: 'Алмазы', value: diamonds },
                { emoji: '⭐', label: 'Звёзды', value: stars },
                { emoji: '📦', label: 'Предметы', value: itemCount },
              ].map((s) => (
                <div key={s.label} className="flex-1 rounded-2xl bg-black/25 px-2 py-2 text-center">
                  <div className="font-display text-lg font-extrabold tabular-nums leading-none">
                    {s.emoji} {formatNumber(s.value)}
                  </div>
                  <div className="mt-1 text-[11px] text-white/55">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

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
    </div>
  )
}
