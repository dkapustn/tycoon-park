import { CROPS } from '../../../games/farm/crops'
import { useFarmStore } from '../../../store/useFarmStore'
import { useGameStore } from '../../../store/useGameStore'
import { formatNumber } from '../../../lib/format'
import { sfx } from '../../../lib/sound'
import { haptic } from '../../../lib/haptics'
import { cn } from '../../../lib/cn'

/** Horizontal seed picker: choose what the next tap on a bare plot plants. */
export function SeedBar() {
  const coins = useFarmStore((s) => s.coins)
  const totalEarned = useFarmStore((s) => s.totalEarned)
  const selected = useFarmStore((s) => s.selectedSeed)
  const selectSeed = useFarmStore((s) => s.selectSeed)
  const inventory = useGameStore((s) => s.inventory)

  return (
    <div className="scroll-y flex gap-2 overflow-x-auto pb-1">
      {CROPS.map((c) => {
        const locked = totalEarned < c.unlockAt
        const active = selected === c.id
        const affordable = coins >= c.seedCost
        const have = inventory[c.id] ?? 0
        return (
          <button
            key={c.id}
            disabled={locked}
            onClick={() => {
              selectSeed(c.id)
              sfx.tap()
              haptic(6)
            }}
            className={cn(
              'relative flex w-[4.6rem] shrink-0 flex-col items-center gap-0.5 rounded-2xl px-1.5 py-2 tap-none transition-all',
              active ? 'grad-accent shadow-pop' : 'bg-white/10',
              locked && 'opacity-45',
            )}
          >
            {!locked && have > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                {formatNumber(have)}
              </span>
            )}
            <span className="text-2xl leading-none">{locked ? '🔒' : c.emoji}</span>
            <span className="truncate text-[11px] font-semibold leading-tight">{c.name}</span>
            {locked ? (
              <span className="text-[10px] tabular-nums text-white/70">
                🔓 {formatNumber(c.unlockAt)}
              </span>
            ) : (
              <span
                className={cn(
                  'text-[11px] font-bold tabular-nums',
                  active ? 'text-white' : affordable ? 'text-[var(--accent-soft)]' : 'text-white/45',
                )}
              >
                🪙 {formatNumber(c.seedCost)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
