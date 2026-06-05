import type { ReactNode } from 'react'
import type { GameConfig } from '../../games/types'
import { useGameStore } from '../../store/useGameStore'
import { themeVars } from '../../lib/theme'
import { formatNumber } from '../../lib/format'
import { StatBadge } from '../ui/StatBadge'

interface Props {
  cfg: GameConfig
  onBack: () => void
  children: ReactNode
}

export function GameShell({ cfg, onBack, children }: Props) {
  const diamonds = useGameStore((s) => s.meta.diamonds)
  return (
    <div className="app-bg absolute inset-0 flex flex-col" style={themeVars(cfg.theme)}>
      <header className="pl-safe pr-safe pt-safe">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            aria-label="Назад"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-2xl leading-none active:scale-95 tap-none"
          >
            ‹
          </button>
          <div className="flex-1 truncate text-center font-display text-lg font-bold">
            {cfg.emoji} {cfg.title}
          </div>
          <StatBadge emoji="💎" value={formatNumber(diamonds)} />
        </div>
      </header>
      <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  )
}
