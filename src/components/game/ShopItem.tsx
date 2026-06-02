import { cn } from '../../lib/cn'

interface Props {
  emoji: string
  title: string
  subtitle: string
  cost?: string
  owned?: number
  affordable?: boolean
  done?: boolean
  onBuy: () => void
}

export function ShopItem({ emoji, title, subtitle, cost, owned, affordable, done, onBuy }: Props) {
  const disabled = done || (cost !== undefined && !affordable)
  return (
    <button
      onClick={onBuy}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl p-2.5 text-left tap-none transition-all duration-150 active:scale-[0.98]',
        done ? 'bg-white/5' : affordable ? 'bg-white/15 hover:bg-white/20' : 'bg-white/[0.07]',
        disabled && 'cursor-default active:scale-100',
      )}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/25 text-2xl">{emoji}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display font-semibold">{title}</span>
          {owned !== undefined && owned > 0 && <span className="shrink-0 text-xs text-white/55">×{owned}</span>}
        </div>
        <div className="truncate text-xs text-white/60">{subtitle}</div>
      </div>
      {done ? (
        <span className="shrink-0 text-xl text-[var(--accent-soft)]">✓</span>
      ) : (
        <div
          className={cn(
            'shrink-0 font-display text-sm font-bold tabular-nums',
            affordable ? 'text-[var(--accent-soft)]' : 'text-white/45',
          )}
        >
          {cost}
        </div>
      )}
    </button>
  )
}
