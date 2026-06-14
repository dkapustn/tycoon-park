import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  onBack: () => void
  right?: ReactNode
}

/** Shared top bar for full-screen sub-pages (inventory, profile, stats, …). */
export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <header className="pl-safe pr-safe pt-safe">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Назад"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/12 text-2xl leading-none active:scale-95 tap-none"
        >
          ‹
        </button>
        <div className="flex-1 truncate text-center font-display text-lg font-bold">{title}</div>
        <div className="flex h-10 min-w-10 items-center justify-end">{right}</div>
      </div>
    </header>
  )
}
