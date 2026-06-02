import { useGameStore } from '../../store/useGameStore'
import { formatNumber } from '../../lib/format'
import { StatBadge } from '../ui/StatBadge'

export function Header({ onSettings }: { onSettings: () => void }) {
  const stars = useGameStore((s) => s.meta.stars)
  return (
    <header className="pl-safe pr-safe pt-safe">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight">🎡 Тайкун-Парк</h1>
          <p className="truncate text-sm text-white/60">Аркада весёлых тайкунов</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatBadge emoji="⭐" value={formatNumber(stars)} />
          <button
            onClick={onSettings}
            aria-label="Настройки"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-lg active:scale-95 tap-none"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  )
}
