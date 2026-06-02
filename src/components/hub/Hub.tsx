import { useState } from 'react'
import { GAMES, GAME_ORDER } from '../../games/registry'
import { useGameStore } from '../../store/useGameStore'
import { useNav } from '../../store/useNav'
import { Header } from './Header'
import { GameCard } from './GameCard'
import type { CardStatus } from './GameCard'
import { SettingsSheet } from '../settings/SettingsSheet'

export function Hub() {
  const unlocked = useGameStore((s) => s.meta.unlocked)
  const completed = useGameStore((s) => s.meta.completed)
  const openGame = useNav((s) => s.openGame)
  const openSoon = useNav((s) => s.openSoon)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app-bg absolute inset-0 flex flex-col">
      <Header onSettings={() => setSettingsOpen(true)} />
      <div className="scroll-y flex-1 pl-safe pr-safe">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 px-4 pb-10 sm:gap-4 sm:px-5 lg:grid-cols-3">
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
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
