import type { GameConfig } from '../../games/types'
import { themeVars } from '../../lib/theme'
import { Button } from '../ui/Button'

export function ComingSoon({ cfg, onExit }: { cfg: GameConfig; onExit: () => void }) {
  return (
    <div className="app-bg absolute inset-0 flex flex-col" style={themeVars(cfg.theme)}>
      <header className="pl-safe pr-safe pt-safe">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={onExit}
            aria-label="Назад"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-2xl leading-none active:scale-95 tap-none"
          >
            ‹
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-safe text-center">
        <div className="grid h-28 w-28 animate-bob place-items-center rounded-4xl grad-accent text-6xl shadow-card">
          {cfg.emoji}
        </div>
        <h2 className="mt-6 font-display text-3xl font-bold text-shadow-pop">{cfg.title}</h2>
        <p className="mt-1 text-white/70">{cfg.tagline}</p>
        <div className="mt-5 rounded-2xl bg-white/10 px-5 py-3 font-display font-semibold">🚧 Уже в разработке</div>
        <p className="mt-3 max-w-xs text-sm text-white/60">
          Эта игра скоро появится в Тайкун-Парке. Следи за обновлениями!
        </p>
        <Button variant="soft" className="mt-8" onClick={onExit}>
          Вернуться в меню
        </Button>
      </div>
    </div>
  )
}
